import axios from "axios";
import { env } from "../config/env";
import { nowMs, safeJsonParse } from "./json";
import { mockFor } from "./mock";
import type { AIProvider, ProviderCallInput, ProviderCallResult } from "./types";
import { PROMPT_VERSION } from "./prompts";

// Jina is primarily used for retrieval/grounding; here we expose a minimal wrapper that
// can be used by services/jobs to fetch ClaimReview feeds or page content.
export class JinaProvider implements AIProvider {
  name = "jina" as const;

  async call(input: ProviderCallInput): Promise<ProviderCallResult> {
    const start = nowMs();

    if (!env.JINA_API_KEY) {
      return {
        meta: { provider: this.name, promptVersion: PROMPT_VERSION, latencyMs: nowMs() - start, usedMock: true },
        json: mockFor(input.task, this.name, input.input.text),
        rawText: undefined
      };
    }

    // Minimal "unified" behavior: for structured tasks, we still return mock-ish output.
    // Real deployments should use Jina for retrieval + grounding, and delegate reasoning
    // to Gemini/Grok/OpenRouter.
    try {
      const url = input.input.url;
      const text = input.input.text;

      if (url) {
        // Jina Reader: https://r.jina.ai/http(s)://...
        const readerUrl = `https://r.jina.ai/${url.replace(/^https?:\/\//, "https://")}`;
        const resp = await axios.get(readerUrl, {
          headers: { Authorization: `Bearer ${env.JINA_API_KEY}` },
          timeout: 20_000
        });
        const rawText = typeof resp.data === "string" ? resp.data : JSON.stringify(resp.data);
        const json = safeJsonParse(rawText);
        return {
          meta: { provider: this.name, promptVersion: PROMPT_VERSION, latencyMs: nowMs() - start, usedMock: false },
          json,
          rawText
        };
      }

      return {
        meta: { provider: this.name, promptVersion: PROMPT_VERSION, latencyMs: nowMs() - start, usedMock: false },
        json: { ok: true, echoed: { task: input.task, text } },
        rawText: undefined
      };
    } catch (err: any) {
      return {
        meta: { provider: this.name, promptVersion: PROMPT_VERSION, latencyMs: nowMs() - start, usedMock: true },
        json: mockFor(input.task, this.name, input.input.text),
        rawText: err?.message
      };
    }
  }
}

