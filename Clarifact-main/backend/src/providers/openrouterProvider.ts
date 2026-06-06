import axios from "axios";
import { env } from "../config/env";
import { nowMs, safeJsonParse } from "./json";
import { mockFor } from "./mock";
import type { AIProvider, ProviderCallInput, ProviderCallResult } from "./types";
import { PROMPT_VERSION } from "./prompts";

export class OpenRouterProvider implements AIProvider {
  name = "openrouter" as const;

  async call(input: ProviderCallInput): Promise<ProviderCallResult> {
    const start = nowMs();

    if (!env.OPENROUTER_API_KEY) {
      return {
        meta: { provider: this.name, promptVersion: PROMPT_VERSION, latencyMs: nowMs() - start, usedMock: true },
        json: mockFor(input.task, this.name, input.input.text),
        rawText: undefined
      };
    }

    try {
      const resp = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: "openai/gpt-4.1-mini",
          messages: [
            { role: "system", content: "Return only JSON." },
            { role: "user", content: input.prompt }
          ],
          temperature: 0.2
        },
        {
          headers: {
            Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json"
          },
          timeout: 12_000
        }
      );

      const content = resp.data?.choices?.[0]?.message?.content;
      const rawText = typeof content === "string" ? content : JSON.stringify(resp.data);
      const json = safeJsonParse(rawText);

      return {
        meta: {
          provider: this.name,
          model: resp.data?.model,
          promptVersion: PROMPT_VERSION,
          latencyMs: nowMs() - start,
          usedMock: false
        },
        json,
        rawText
      };
    } catch (err: any) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.error?.message ?? err?.response?.data?.message ?? err?.message;
      return {
        meta: { provider: this.name, promptVersion: PROMPT_VERSION, latencyMs: nowMs() - start, usedMock: true },
        json: mockFor(input.task, this.name, input.input.text),
        rawText: status ? `HTTP ${status}: ${detail}` : err?.message
      };
    }
  }
}

