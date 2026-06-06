import axios from "axios";
import { env } from "../config/env";
import { nowMs, safeJsonParse } from "./json";
import { mockFor } from "./mock";
import type { AIProvider, ProviderCallInput, ProviderCallResult } from "./types";
import { PROMPT_VERSION } from "./prompts";

// Gemini supports text-only, image (inlineData), and video (inlineData) analysis.
// For image-analysis: we send base64 image parts.
// For video-analysis: we send base64 video parts (downloaded locally via yt-dlp).
export class GeminiProvider implements AIProvider {
  name = "gemini" as const;

  async call(input: ProviderCallInput): Promise<ProviderCallResult> {
    const start = nowMs();

    if (!env.GEMINI_API_KEY) {
      return {
        meta: { provider: this.name, promptVersion: PROMPT_VERSION, latencyMs: nowMs() - start, usedMock: true },
        json: mockFor(input.task, this.name, input.input.text),
        rawText: undefined
      };
    }

    try {
      const endpoint =
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

      // Build content parts: text prompt always included
      const parts: any[] = [{ text: input.prompt }];

      const meta = input.input.metadata ?? {};

      // Image analysis: add inlineData for base64 image
      if (input.task === "image-analysis" && meta.imageBase64) {
        parts.push({
          inlineData: {
            mimeType: (meta.imageMimeType as string | undefined) ?? "image/jpeg",
            data: meta.imageBase64 as string
          }
        });
      }

      // Video analysis: add inlineData for base64 video
      if (input.task === "video-analysis" && meta.videoBase64) {
        parts.push({
          inlineData: {
            mimeType: (meta.videoMimeType as string | undefined) ?? "video/mp4",
            data: meta.videoBase64 as string
          }
        });
      }

      const resp = await axios.post(
        `${endpoint}?key=${encodeURIComponent(env.GEMINI_API_KEY)}`,
        {
          contents: [{ role: "user", parts }],
          generationConfig: {
            temperature: 0.2,
            // Higher max tokens for detailed video analysis
            maxOutputTokens: input.task === "video-analysis" ? 4096 : 2048
          }
        },
        {
          timeout: input.task === "video-analysis" ? 120_000 : 20_000,
          maxBodyLength: 200 * 1024 * 1024, // 200 MB max body for video upload
          maxContentLength: 200 * 1024 * 1024
        }
      );

      const content = resp.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      const rawText = typeof content === "string" ? content : JSON.stringify(resp.data);
      const json = safeJsonParse(rawText);

      return {
        meta: { provider: this.name, model: "gemini-2.0-flash", promptVersion: PROMPT_VERSION, latencyMs: nowMs() - start, usedMock: false },
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
