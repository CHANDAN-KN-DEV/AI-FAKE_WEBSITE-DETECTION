import type { PromptTask, ProviderName } from "./types";

export function mockFor(task: PromptTask, provider: ProviderName, inputText?: string) {
  const base = {
    provider,
    promptVersion: "v1",
    note: "Mock fallback (missing API key or provider unavailable)"
  };

  switch (task) {
    case "claim-extraction":
      return {
        ...base,
        language: "unknown",
        contentType: "unknown",
        claims: inputText
          ? [{ text: inputText.slice(0, 140), confidence: 0.4 }]
          : [{ text: "Unable to extract claim (no input).", confidence: 0.1 }],
        suspiciousSentences: []
      };
    case "emotional-manipulation-analysis":
      return {
        ...base,
        scores: {
          fear: 0.2,
          anger: 0.1,
          urgency: 0.2,
          scarcity: 0.1,
          outrage: 0.1,
          authority: 0.1,
          shareBait: 0.2
        },
        triggerPhrases: [],
        highlighted: [],
        riskLabel: "low"
      };
    case "source-credibility":
      return {
        ...base,
        sourceCredibility: 0.5,
        publisher: "unknown",
        rationale: "No provider key configured; returning neutral credibility.",
        signals: []
      };
    case "final-verdict-summary":
      return {
        ...base,
        verdict: "UNVERIFIED",
        confidence: 0.25,
        summary: "Unable to generate final verdict without live providers.",
        eli10: "We couldn't check this properly yet.",
        evidence: []
      };
    case "image-analysis":
      return {
        ...base,
        verdict: "UNVERIFIED",
        confidence: 0.0,
        fakeProbability: 0.0,
        summary: "Image analysis requires Gemini API key. Configure GEMINI_API_KEY to enable vision-based fake news detection.",
        eli10: "We need a special key to look at images properly. Ask an adult to set it up!",
        manipulationSignals: [],
        isAiGenerated: false,
        isOutOfContext: false,
        textInImage: ""
      };
    case "video-analysis":
      return {
        ...base,
        verdict: "UNVERIFIED",
        confidence: 0.2,
        fakeProbability: 0.2,
        summary: "Full video analysis requires Gemini API key and yt-dlp for video download. Configure GEMINI_API_KEY to enable AI-powered video fake news detection.",
        eli10: "We need a special key to watch and analyze videos. Ask an adult to set it up!",
        spokenClaims: [],
        visualFindings: [],
        manipulationSignals: [],
        isDeepfake: false,
        isOutOfContext: false,
        isAiGeneratedAudio: false,
        riskFactors: [],
        evidence: []
      };
    case "instagram-analysis":
      return {
        ...base,
        verdict: "UNVERIFIED",
        confidence: 0.2,
        fakeProbability: 0.2,
        platform: "instagram",
        mediaType: "reel",
        username: null,
        summary: "Instagram content analysis requires an AI provider key. Configure GEMINI_API_KEY or GROK_API_KEY to enable full Instagram reel/post analysis.",
        eli10: "We need a special key to check Instagram videos. Ask an adult to set it up!",
        checks: { fakeCaptions: false, hashtagManipulation: false, impersonation: false, fakeGiveaway: false, repostedMisinfo: false, editedMedia: false, healthMisinfo: false },
        riskFactors: [],
        authenticityScore: 0.5
      };
  }
}

