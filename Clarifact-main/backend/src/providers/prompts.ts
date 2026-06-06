import type { PromptTask } from "./types";

export const PROMPT_VERSION = "v1";

type TemplateVars = {
  text?: string;
  url?: string;
};

function baseSystem() {
  return [
    "You are Clarifact, a misinformation verification assistant.",
    "Return ONLY valid JSON. Do not wrap in markdown.",
    "Never include trailing commas."
  ].join("\n");
}

export function renderPrompt(task: PromptTask, vars: TemplateVars) {
  switch (task) {
    case "claim-extraction":
      return [
        baseSystem(),
        "Task: Extract check-worthy claims.",
        "Return JSON with shape:",
        '{ "language": "en|hi|kn|unknown", "contentType": "news|opinion|meme|forwarded|unknown", "claims": [{"text": "...", "confidence": 0.0}], "suspiciousSentences": [{"text":"...","reason":"...","score":0.0}] }',
        "Input:",
        vars.url ? `URL: ${vars.url}` : "",
        vars.text ? `TEXT:\n${vars.text}` : ""
      ]
        .filter(Boolean)
        .join("\n\n");

    case "emotional-manipulation-analysis":
      return [
        baseSystem(),
        "Task: Detect emotional manipulation.",
        "Return JSON with shape:",
        '{ "scores": { "fear":0.0, "anger":0.0, "urgency":0.0, "scarcity":0.0, "outrage":0.0, "authority":0.0, "shareBait":0.0 }, "triggerPhrases": ["..."], "highlighted": [{"text":"...","label":"fear|anger|urgency|scarcity|outrage|authority|shareBait"}], "riskLabel": "low|medium|high" }',
        "Input:",
        vars.text ? `TEXT:\n${vars.text}` : ""
      ]
        .filter(Boolean)
        .join("\n\n");

    case "source-credibility":
      return [
        baseSystem(),
        "Task: Score source credibility for a URL/domain and provide rationale.",
        "Return JSON with shape:",
        '{ "sourceCredibility": 0.0, "rationale": "...", "signals": ["..."], "publisher": "..." }',
        "Input:",
        vars.url ? `URL: ${vars.url}` : "",
        vars.text ? `CONTEXT:\n${vars.text}` : ""
      ]
        .filter(Boolean)
        .join("\n\n");

    case "final-verdict-summary":
      return [
        baseSystem(),
        "Task: Determine the VERDICT for the claim or URL provided.",
        "",
        "CRITICAL RULES:",
        "1. If the input is a FACT-CHECK article (e.g. from Reuters fact-check, Snopes, PolitiFact, FullFact, AltNews, BoomLive), the verdict reflects what the fact-checkers concluded about the CLAIM BEING CHECKED — not about the article itself. If they say FAKE, FALSE, or DEBUNKED, return verdict=FALSE.",
        "2. If the input is a reputable news report about a verified real event, verdict=TRUE.",
        "3. NEVER return TRUE solely because the domain name looks reputable — analyze the actual CONTENT.",
        "4. If the article title or URL contains 'fact-check', 'fake', 'debunk', this is strong signal the claim being checked is FALSE.",
        "",
        "Return JSON with shape:",
        '{ "verdict": "TRUE|FALSE|MISLEADING|UNVERIFIED", "confidence": 0.0, "summary": "...", "eli10": "...", "evidence": [{"url":"...","title":"...","why":"..."}] }',
        "Input:",
        vars.url ? `URL: ${vars.url}` : "",
        vars.text ? `CONTEXT:\n${vars.text}` : ""
      ]
        .filter(Boolean)
        .join("\n\n");
    case "image-analysis":
      return [
        baseSystem(),
        "Task: Analyze this image for misinformation, fakeness, or manipulation.",
        "",
        "Examine the image thoroughly for:",
        "1. Visual manipulation signs (splicing, cloning, unrealistic lighting, AI generation artifacts)",
        "2. Text overlays or captions — are they accurate or misleading?",
        "3. Context manipulation — is the image real but used out of context?",
        "4. Deepfake or synthetic media indicators",
        "5. Metadata inconsistencies if visible",
        "6. Emotional manipulation tactics (shocking imagery, fear-inducing composition)",
        "",
        "Return JSON with shape:",
        '{ "verdict": "TRUE|FALSE|MISLEADING|UNVERIFIED", "confidence": 0.0, "summary": "detailed explanation of what the image shows and why it is or is not fake", "eli10": "simple explanation for a 10-year-old", "manipulationSignals": ["..."], "isAiGenerated": true|false, "isOutOfContext": true|false, "textInImage": "any text visible in the image", "fakeProbability": 0.0 }',
        "",
        "VERDICT GUIDE:",
        "- TRUE: Image is authentic and used in correct context",
        "- FALSE: Image is clearly fake, manipulated, AI-generated, or completely fabricated",
        "- MISLEADING: Image is real but used out of context or with misleading caption",
        "- UNVERIFIED: Cannot determine authenticity from visual analysis alone",
        vars.text ? `\nContext/filename provided: ${vars.text}` : ""
      ]
        .filter(Boolean)
        .join("\n");

    case "instagram-analysis":
      return [
        baseSystem(),
        "Task: Analyze an Instagram Reel, Post, or Story URL for misinformation, fake content, or manipulation.",
        "",
        "Examine the content for:",
        "1. Fake or misleading captions — does the caption match what is likely in the video/image?",
        "2. Hashtag manipulation — are hashtags used to artificially boost reach or mislead?",
        "3. Engagement spike patterns — sudden viral spread suggesting coordinated inauthentic behavior",
        "4. Impersonation — is the account pretending to be a public figure, brand, or authority?",
        "5. Fake giveaway scams — offers that require sharing, following, or sending money",
        "6. Reposted misinformation — viral false claims being re-shared",
        "7. Edited media — visual signs of manipulation, deepfake, or AI-generated content",
        "8. Health/safety misinformation — dangerous medical, political, or financial claims",
        "",
        "Return JSON with shape:",
        '{ "verdict": "TRUE|FALSE|MISLEADING|UNVERIFIED", "confidence": 0.0, "summary": "detailed analysis of the Instagram content", "eli10": "simple explanation for a 10-year-old", "platform": "instagram", "mediaType": "reel|post|story", "username": "extracted username if visible in URL", "checks": { "fakeCaptions": false, "hashtagManipulation": false, "impersonation": false, "fakeGiveaway": false, "repostedMisinfo": false, "editedMedia": false, "healthMisinfo": false }, "riskFactors": ["..."], "authenticityScore": 0.0, "fakeProbability": 0.0 }',
        "",
        "VERDICT GUIDE:",
        "- TRUE: Content appears authentic and not misleading",
        "- FALSE: Content is clearly fake, impersonation, or dangerous misinformation",
        "- MISLEADING: Content has real elements but is used deceptively",
        "- UNVERIFIED: Cannot determine authenticity from URL/metadata alone",
        vars.url ? `\nInstagram URL: ${vars.url}` : "",
        vars.text ? `\nAdditional context: ${vars.text}` : ""
      ]
        .filter(Boolean)
        .join("\n");

    case "video-analysis":
      return [
        baseSystem(),
        "Task: Watch this video COMPLETELY and analyze it for misinformation, fake news, or manipulated content.",
        "",
        "Watch the entire video from start to finish. Analyze:",
        "1. SPOKEN CONTENT — What is being said? Are there false claims, misleading statistics, or fabricated quotes?",
        "2. VISUAL CONTENT — Are visuals authentic? Signs of deepfake, CGI splicing, out-of-context footage?",
        "3. TEXT OVERLAYS — Are any on-screen texts, titles, or captions inaccurate or misleading?",
        "4. AUDIO — Is the voice authentic or AI-generated? Are sound effects used manipulatively?",
        "5. CONTEXT — Is real footage being presented with a false narrative?",
        "6. IDENTITY — Is anyone impersonating a public figure, official, or authority?",
        "7. EMOTIONAL MANIPULATION — Are fear, panic, or outrage used to bypass critical thinking?",
        "8. FACTUAL ACCURACY — Are specific dates, statistics, events, or quotes verifiable?",
        "",
        "Return JSON with shape:",
        '{ "verdict": "TRUE|FALSE|MISLEADING|UNVERIFIED", "confidence": 0.0, "summary": "comprehensive analysis of everything seen and heard in the video", "eli10": "simple explanation for a 10-year-old", "spokenClaims": ["key claims made in the video"], "visualFindings": ["observations about visuals"], "manipulationSignals": ["manipulation techniques detected"], "isDeepfake": false, "isOutOfContext": false, "isAiGeneratedAudio": false, "fakeProbability": 0.0, "riskFactors": ["..."], "evidence": [{"type": "speech|visual|text", "timestamp": "00:15", "finding": "what was found", "verdict": "fake|real|misleading"}] }',
        "",
        "VERDICT GUIDE:",
        "- TRUE: Video content is authentic and the narrative is accurate",
        "- FALSE: Video contains clearly fabricated claims, deepfake, or completely false narrative",
        "- MISLEADING: Real footage with false framing, selective editing, or misleading narration",
        "- UNVERIFIED: Cannot fully determine authenticity from video content alone",
        vars.text ? `\nContext: ${vars.text}` : "",
        vars.url ? `\nSource URL: ${vars.url}` : ""
      ]
        .filter(Boolean)
        .join("\n");
  }
}
