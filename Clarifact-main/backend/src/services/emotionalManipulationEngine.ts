type Label =
  | "fear"
  | "anger"
  | "urgency"
  | "scarcity"
  | "outrage"
  | "authority"
  | "shareBait";

const PATTERNS: Array<{ label: Label; re: RegExp; weight: number }> = [
  { label: "shareBait", re: /\bshare\b|\bforward\b|\bsend to\b|\bspread\b/i, weight: 0.35 },
  { label: "urgency", re: /\burgent\b|\bimmediately\b|\bnow\b|\bbefore (midnight|it'?s too late)\b/i, weight: 0.4 },
  { label: "fear", re: /\bthey are hiding\b|\bdelete this\b|\bwon't show\b|\bshocking\b|\bterrifying\b/i, weight: 0.35 },
  { label: "anger", re: /\btraitor\b|\bdisgusting\b|\bcorrupt\b|\boutrageous\b/i, weight: 0.3 },
  { label: "scarcity", re: /\bonly today\b|\blimited\b|\blast chance\b/i, weight: 0.25 },
  { label: "authority", re: /\bofficial\b|\bgovernment\b|\bministry\b|\bWHO\b|\bdoctor\b|\bIAS\b/i, weight: 0.3 },
  { label: "outrage", re: /\bexposed\b|\bscam\b|\bfraud\b|\btruth revealed\b/i, weight: 0.3 }
];

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

export type EmotionalManipulationResult = {
  scores: Record<Label, number>;
  triggerPhrases: string[];
  highlighted: Array<{ text: string; label: Label }>;
  riskLabel: "low" | "medium" | "high";
};

export function analyzeEmotionalManipulation(text: string): EmotionalManipulationResult {
  const scores: Record<Label, number> = {
    fear: 0,
    anger: 0,
    urgency: 0,
    scarcity: 0,
    outrage: 0,
    authority: 0,
    shareBait: 0
  };

  const triggers: string[] = [];
  const highlighted: Array<{ text: string; label: Label }> = [];

  for (const p of PATTERNS) {
    const m = text.match(p.re);
    if (!m) continue;
    scores[p.label] = clamp01(scores[p.label] + p.weight);
    const trigger = m[0];
    triggers.push(trigger);
    highlighted.push({ text: trigger, label: p.label });
  }

  const overall = Object.values(scores).reduce((a, b) => a + b, 0) / 7;
  const riskLabel: EmotionalManipulationResult["riskLabel"] =
    overall >= 0.55 ? "high" : overall >= 0.3 ? "medium" : "low";

  return {
    scores,
    triggerPhrases: Array.from(new Set(triggers)).slice(0, 20),
    highlighted: highlighted.slice(0, 50),
    riskLabel
  };
}

