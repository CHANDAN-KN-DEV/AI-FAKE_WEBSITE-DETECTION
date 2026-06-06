import axios from "axios";
import { env } from "../config/env";
import { nowMs, safeJsonParse } from "./json";
import { mockFor } from "./mock";
import type { AIProvider, ProviderCallInput, ProviderCallResult } from "./types";
import { PROMPT_VERSION } from "./prompts";

// "Grok API" varies by deployment. This wrapper assumes an OpenAI-compatible chat endpoint.
export class GrokProvider implements AIProvider {
  name = "grok" as const;

  async call(input: ProviderCallInput): Promise<ProviderCallResult> {
    const start = nowMs();

    if (!env.GROK_API_KEY) {
      return {
        meta: { provider: this.name, promptVersion: PROMPT_VERSION, latencyMs: nowMs() - start, usedMock: true },
        json: mockFor(input.task, this.name, input.input.text),
        rawText: undefined
      };
    }

    const isGroqKey = env.GROK_API_KEY.startsWith("gsk_");
    const endpoint = isGroqKey
      ? "https://api.groq.com/openai/v1/chat/completions"
      : "https://api.x.ai/v1/chat/completions";
    const model = env.GROK_MODEL || (isGroqKey ? "llama-3.1-8b-instant" : "grok-3-mini-fast");

    try {
      const resp = await axios.post(
        endpoint,
        {
          model,
          messages: [
            { role: "system", content: "Return only JSON." },
            { role: "user", content: input.prompt }
          ],
          temperature: 0.2
        },
        {
          headers: {
            Authorization: `Bearer ${env.GROK_API_KEY}`,
            "Content-Type": "application/json"
          },
          timeout: 12_000
        }
      );

      const content =
        resp.data?.choices?.[0]?.message?.content ??
        resp.data?.output?.[0]?.content?.[0]?.text ??
        resp.data?.output?.[0]?.content;
      const rawText = typeof content === "string" ? content : JSON.stringify(resp.data);
      const json = safeJsonParse(rawText);

      return {
        meta: {
          provider: this.name,
          model: resp.data?.model ?? model,
          promptVersion: PROMPT_VERSION,
          latencyMs: nowMs() - start,
          usedMock: false
        },
        json,
        rawText
      };
    } catch (err: any) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.error ?? err?.response?.data?.message ?? err?.message;
      return {
        meta: { provider: this.name, promptVersion: PROMPT_VERSION, latencyMs: nowMs() - start, usedMock: true },
        json: mockFor(input.task, this.name, input.input.text),
        rawText: status ? `HTTP ${status}: ${typeof detail === "string" ? detail : JSON.stringify(detail)}` : err?.message
      };
    }
  }
}

