import type { AIProvider, PromptTask, ProviderCallInput, ProviderCallResult, ProviderName } from "./types";
import { JinaProvider } from "./jinaProvider";
import { GeminiProvider } from "./geminiProvider";
import { GrokProvider } from "./grokProvider";
import { OpenRouterProvider } from "./openrouterProvider";
import { HiveProvider } from "./hiveProvider";
import { renderPrompt } from "./prompts";

export type ProviderRegistryOptions = {
  // Preferred providers per task, in order. Remaining providers are used as fallbacks.
  orderByTask?: Partial<Record<PromptTask, ProviderName[]>>;
};

const DEFAULT_ORDER: Record<PromptTask, ProviderName[]> = {
  // Text tasks — OpenRouter first, Grok as fallback, Jina for URL fetching
  "claim-extraction":                 ["openrouter", "grok"],
  "emotional-manipulation-analysis":  ["openrouter", "grok"],
  "source-credibility":               ["jina", "openrouter", "grok"],
  "final-verdict-summary":            ["openrouter", "grok"],
  // Instagram URL analysis — OpenRouter + Grok (text reasoning), NO Gemini
  "instagram-analysis":               ["openrouter", "grok"],
  // Visual tasks — Gemini natively handles multimodal (images and video)
  "image-analysis":                   ["gemini", "hive"],
  "video-analysis":                   ["gemini", "hive"],
};

const PROVIDER_COOLDOWN_MS = 5 * 60 * 1000;
const unavailableUntil = new Map<ProviderName, number>();

function isOnCooldown(name: ProviderName) {
  const until = unavailableUntil.get(name);
  return typeof until === "number" && until > Date.now();
}

function shouldCooldown(result: ProviderCallResult) {
  if (!result.meta.usedMock) return false;
  const raw = String(result.rawText ?? "").toLowerCase();
  return raw.includes("429") || raw.includes("402") || raw.includes("quota") || raw.includes("rate limit");
}

export class ProviderRegistry {
  private providers: Record<ProviderName, AIProvider>;
  private orderByTask: Record<PromptTask, ProviderName[]>;

  constructor(opts: ProviderRegistryOptions = {}) {
    this.providers = {
      jina: new JinaProvider(),
      gemini: new GeminiProvider(),
      grok: new GrokProvider(),
      openrouter: new OpenRouterProvider(),
      hive: new HiveProvider()
    };

    this.orderByTask = { ...DEFAULT_ORDER, ...(opts.orderByTask ?? {}) } as Record<PromptTask, ProviderName[]>;
  }

  getProvider(name: ProviderName) {
    return this.providers[name];
  }

  async callWithFallback(input: Omit<ProviderCallInput, "prompt"> & { prompt?: string }): Promise<ProviderCallResult> {
    const prompt = input.prompt ?? renderPrompt(input.task, { text: input.input.text, url: input.input.url });
    const order = this.orderByTask[input.task] ?? [];
    const attempted: ProviderName[] = [];
    let last: ProviderCallResult | null = null;

    for (const providerName of order) {
      if (isOnCooldown(providerName)) continue;
      attempted.push(providerName);
      const provider = this.providers[providerName];
      const result = await provider.call({ ...input, prompt });
      last = result;
      if (shouldCooldown(result)) {
        unavailableUntil.set(providerName, Date.now() + PROVIDER_COOLDOWN_MS);
      }
      // Stop early if not using mock. Mock usually indicates missing key/unavailable provider.
      if (!result.meta.usedMock) return result;
    }

    // If all are mocked/unavailable, return the last attempt (still structured JSON).
    if (!last) {
      const p = this.providers.openrouter;
      return p.call({ ...input, prompt });
    }

    return {
      ...last,
      json: {
        attemptedProviders: attempted,
        result: last.json
      }
    };
  }

  async compareProviders(input: Omit<ProviderCallInput, "prompt"> & { prompt?: string }) {
    const prompt = input.prompt ?? renderPrompt(input.task, { text: input.input.text, url: input.input.url });
    const names: ProviderName[] = ["jina", "grok", "openrouter", "gemini"];
    const results = await Promise.all(
      names.map(async (name) => {
        const provider = this.providers[name];
        if (isOnCooldown(name)) {
          return {
            meta: { provider: name, promptVersion: "v1", latencyMs: 0, usedMock: true },
            json: { skipped: true, reason: "provider_on_cooldown" },
            rawText: "provider_on_cooldown"
          } as ProviderCallResult;
        }
        const result = await provider.call({ ...input, prompt });
        if (shouldCooldown(result)) {
          unavailableUntil.set(name, Date.now() + PROVIDER_COOLDOWN_MS);
        }
        return result;
      })
    );
    return results;
  }
}

