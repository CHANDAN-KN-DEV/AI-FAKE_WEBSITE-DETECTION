import axios from "axios";
import { env } from "../config/env";
import { nowMs, safeJsonParse } from "./json";
import { mockFor } from "./mock";
import type { AIProvider, ProviderCallInput, ProviderCallResult } from "./types";
import { PROMPT_VERSION } from "./prompts";

export class HiveProvider implements AIProvider {
  name = "hive" as const;

  async call(input: ProviderCallInput): Promise<ProviderCallResult> {
    const start = nowMs();

    if (!env.HIVE_API_KEY) {
      return {
        meta: { provider: this.name, promptVersion: PROMPT_VERSION, latencyMs: nowMs() - start, usedMock: true },
        json: mockFor(input.task, this.name, input.input.text),
        rawText: undefined
      };
    }

    try {
      const endpoint = "https://api.thehive.ai/api/v2/task/sync";
      const formData = new FormData();

      const meta = input.input.metadata ?? {};

      // In a real integration, we'd append the actual file blob
      // Here we append the base64 or URL if available
      if (input.task === "image-analysis" && meta.imageBase64) {
        // Convert base64 to Blob (or let Axios handle base64 if Hive supports it)
        // Hive typically accepts a 'media' file or 'url'
        const base64Data = meta.imageBase64 as string;
        const mimeType = (meta.imageMimeType as string) || 'image/jpeg';
        const buffer = Buffer.from(base64Data, "base64");
        const blob = new Blob([buffer], { type: mimeType });
        formData.append("media", blob, "image.jpg");
      } else if (input.task === "video-analysis" && meta.videoBase64) {
        const base64Data = meta.videoBase64 as string;
        const mimeType = (meta.videoMimeType as string) || 'video/mp4';
        const buffer = Buffer.from(base64Data, "base64");
        const blob = new Blob([buffer], { type: mimeType });
        formData.append("media", blob, "video.mp4");
      }

      const resp = await axios.post(
        endpoint,
        formData,
        {
          headers: {
            "Authorization": `token ${env.HIVE_API_KEY}`,
            // Let axios auto-set content-type with boundary for FormData
          },
          timeout: input.task === "video-analysis" ? 120_000 : 20_000,
          maxBodyLength: 200 * 1024 * 1024,
          maxContentLength: 200 * 1024 * 1024
        }
      );

      // Hive returns classes and scores. We map this to our expected JSON schema.
      const hiveData = resp.data;
      const rawText = JSON.stringify(hiveData);

      // Simple heuristic mapping to our expected JSON
      // If we see 'deepfake' class with high score, we map it to FALSE.
      let verdict = "unverified";
      let confidence = 0.5;
      let visualFindings = ["Analyzed by Hive AI"];

      // Process hive response (mock logic here assuming typical Hive format)
      if (hiveData?.status?.[0]?.response?.output?.[0]?.classes) {
        const classes = hiveData.status[0].response.output[0].classes;
        const deepfakeClass = classes.find((c: any) => c.class === "deepfake" || c.class === "ai_generated");
        if (deepfakeClass && deepfakeClass.score > 0.8) {
          verdict = "false";
          confidence = deepfakeClass.score;
          visualFindings.push("High probability of AI generation or deepfake manipulation");
        } else {
          verdict = "verified";
          confidence = 0.9;
        }
      }

      const json = {
        verdict,
        confidence,
        summary: "Visual analysis completed by AI computer vision models.",
        eli10: "The AI looked at the image/video and checked for signs of manipulation.",
        visualFindings,
        manipulationTriggers: [],
        timeline: [],
        sourceCredibility: [],
      };

      return {
        meta: { provider: this.name, model: "hive-moderation", promptVersion: PROMPT_VERSION, latencyMs: nowMs() - start, usedMock: false },
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
