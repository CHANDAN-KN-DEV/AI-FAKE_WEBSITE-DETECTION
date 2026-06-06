import { createHash } from "crypto";

export function normalizeTextForKey(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .slice(0, 2000);
}

export function makeNormalizedKey(parts: { text?: string; url?: string }) {
  const base = normalizeTextForKey([parts.url ?? "", parts.text ?? ""].join("\n"));
  return createHash("sha256").update(base).digest("hex");
}

export function guessLanguage(text: string): "en" | "hi" | "kn" | "unknown" {
  // Very lightweight heuristic; can be replaced with provider-based detection.
  if (/[\u0C80-\u0CFF]/.test(text)) return "kn";
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  if (/[a-zA-Z]/.test(text)) return "en";
  return "unknown";
}

