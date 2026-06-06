import type { PromptTask, ProviderCallResult } from "../providers";
import { ProviderRegistry } from "../providers";
import { prisma } from "../config/prisma";
import { HttpError } from "../middleware/errorMiddleware";
import { analyzeEmotionalManipulation } from "./emotionalManipulationEngine";

const registry = new ProviderRegistry();

async function storeAIAnalysis(params: {
  claimId: string;
  providerResult: ProviderCallResult;
  task: PromptTask;
  inputSummary?: string;
}) {
  const { claimId, providerResult, task, inputSummary } = params;
  const raw = providerResult.json as any;

  // Extract structured fields from raw JSON for DB columns (feeds consensusService)
  // For claim-extraction: parse confidence per claim
  const extractedClaimsConf = Array.isArray(raw?.claims)
    ? Math.max(...raw.claims.map((c: any) => typeof c.confidence === 'number' ? c.confidence : 0), 0)
    : null;
  // For final-verdict-summary: confidence comes directly
  const directConf = typeof raw?.confidence === 'number' ? raw.confidence
    : typeof raw?.result?.confidence === 'number' ? raw.result.confidence
    : null;
  // fakeProbability (inverted confidence for FALSE claims)
  const directFake = typeof raw?.fakeProbability === 'number' ? raw.fakeProbability
    : typeof raw?.result?.fakeProbability === 'number' ? raw.result.fakeProbability
    : null;

  const confidence = directConf ?? (extractedClaimsConf !== null && extractedClaimsConf > 0 ? extractedClaimsConf : null);
  const fakeProbability = directFake;

  return prisma.aIAnalysis.create({
    data: {
      claimId,
      provider: providerResult.meta.provider,
      model: providerResult.meta.model,
      task,
      promptVersion: providerResult.meta.promptVersion,
      inputSummary,
      rawJson: providerResult.json as any,
      confidence,
      fakeProbability,
      explanation: typeof raw?.summary === 'string' ? raw.summary
        : typeof raw?.result?.summary === 'string' ? raw.result.summary
        : undefined,
      eli10: typeof raw?.eli10 === 'string' ? raw.eli10
        : typeof raw?.result?.eli10 === 'string' ? raw.result.eli10
        : undefined,
      suspiciousSentences: Array.isArray(raw?.suspiciousSentences) ? raw.suspiciousSentences as any : undefined,
    }
  });
}

export async function extractClaims(claimId: string) {
  const claim = await prisma.claim.findUnique({ where: { id: claimId }, include: { inputs: true } });
  if (!claim) throw new HttpError(404, "Claim not found");
  await prisma.claim.update({ where: { id: claimId }, data: { status: "analyzing" } });
  const text = claim.inputs.find((i) => i.rawText)?.rawText ?? claim.title ?? "";
  const url = claim.inputs.find((i) => i.rawUrl)?.rawUrl ?? undefined;

  const task: PromptTask = "claim-extraction";
  const result = await registry.callWithFallback({
    task,
    input: { text: text ?? undefined, url }
  });

  await storeAIAnalysis({ claimId, providerResult: result, task, inputSummary: (text ?? "").slice(0, 200) });
  return result;
}

export async function emotionalManipulation(claimId: string) {
  const claim = await prisma.claim.findUnique({ where: { id: claimId }, include: { inputs: true } });
  if (!claim) throw new HttpError(404, "Claim not found");
  const text = claim.inputs.find((i) => i.rawText)?.rawText ?? claim.title ?? "";
  if (!text) throw new HttpError(400, "No text available for emotional analysis");

  // Deterministic engine first (works without keys)
  const engine = analyzeEmotionalManipulation(text);

  await prisma.emotionalSignal.create({
    data: {
      claimId,
      fear: engine.scores.fear,
      anger: engine.scores.anger,
      urgency: engine.scores.urgency,
      scarcity: engine.scores.scarcity,
      outrage: engine.scores.outrage,
      authority: engine.scores.authority,
      shareBait: engine.scores.shareBait,
      triggerPhrases: engine.triggerPhrases as any,
      highlighted: engine.highlighted as any,
      riskLabel: engine.riskLabel
    }
  });

  // Optional provider run for richer output (stored in AIAnalysis)
  const task: PromptTask = "emotional-manipulation-analysis";
  const result = await registry.callWithFallback({
    task,
    input: { text }
  });
  await storeAIAnalysis({ claimId, providerResult: result, task, inputSummary: text.slice(0, 200) });

  return { engine, provider: result };
}

export async function sourceCredibility(claimId: string) {
  const claim = await prisma.claim.findUnique({ where: { id: claimId }, include: { inputs: true } });
  if (!claim) throw new HttpError(404, "Claim not found");
  const url = claim.inputs.find((i) => i.rawUrl)?.rawUrl;
  if (!url) throw new HttpError(400, "No URL available for source scoring");

  const task: PromptTask = "source-credibility";
  const result = await registry.callWithFallback({
    task,
    input: { url, text: claim.title ?? undefined }
  });

  await storeAIAnalysis({ claimId, providerResult: result, task, inputSummary: url });
  return result;
}

export async function providerCompare(task: PromptTask, input: { text?: string; url?: string }) {
  return registry.compareProviders({ task, input });
}

export async function analyzeImageClaim(
  claimId: string,
  imageInput?: { imageBase64?: string; imageMimeType?: string }
) {
  const claim = await prisma.claim.findUnique({ where: { id: claimId }, include: { inputs: true } });
  if (!claim) throw new HttpError(404, "Claim not found");
  await prisma.claim.update({ where: { id: claimId }, data: { status: "analyzing" } });

  // Use passed-in image data (preferred) — avoids storing huge base64 in DB
  const inputRow = claim.inputs[0];
  const meta = inputRow?.rawMeta as any;
  const imageBase64: string | undefined = imageInput?.imageBase64 ?? meta?.imageBase64;
  const imageMimeType: string = imageInput?.imageMimeType ?? meta?.imageMimeType ?? "image/jpeg";
  const fileName: string = meta?.fileName ?? claim.title ?? "image";

  const task: PromptTask = "image-analysis";

  // Always use Gemini for vision — it's the only provider with multimodal support
  const result = await registry.callWithFallback({
    task,
    input: {
      text: claim.title ?? fileName,
      metadata: {
        imageBase64,
        imageMimeType
      }
    }
  });

  const raw = result.json as any;
  const verdict = raw?.verdict ?? "UNVERIFIED";
  const rawConf: number | null = typeof raw?.confidence === "number" ? raw.confidence : null;
  const rawFake: number | null = typeof raw?.fakeProbability === "number" ? raw.fakeProbability : null;

  const isAiGenerated = raw?.isAiGenerated === true;
  const isOutOfContext = raw?.isOutOfContext === true;
  const numSignals = Array.isArray(raw?.manipulationSignals) ? raw.manipulationSignals.length : 0;

  let dbConfidence: number | null = null;
  let dbFakeProbability: number | null = null;
  
  if (verdict === "FALSE") {
    let calcFakeProb = rawFake;
    if (calcFakeProb == null) {
        if (isAiGenerated) calcFakeProb = 0.95;
        else if (numSignals > 2) calcFakeProb = 0.90;
        else if (numSignals > 0) calcFakeProb = 0.80;
        else calcFakeProb = rawConf != null ? 1 - rawConf : 0.78;
    }
    dbFakeProbability = calcFakeProb;
  } else if (verdict === "MISLEADING") {
    let calcConf = rawConf;
    if (calcConf == null) {
        if (isOutOfContext) calcConf = 0.85;
        else if (numSignals > 0) calcConf = 0.70;
        else calcConf = 0.55;
    }
    dbConfidence = calcConf;
  } else if (verdict === "TRUE") {
    let calcConf = rawConf;
    if (calcConf == null) {
        if (!isAiGenerated && numSignals === 0 && !isOutOfContext) calcConf = 0.88;
        else calcConf = 0.65;
    }
    dbConfidence = calcConf;
  } else {
    dbConfidence = rawConf ?? 0.35;
  }

  await storeAIAnalysis({
    claimId,
    providerResult: {
      ...result,
      json: {
        ...raw,
        confidence: dbConfidence,
        fakeProbability: dbFakeProbability
      }
    },
    task,
    inputSummary: fileName
  });

  // Mark as reviewed so result page stops polling
  await prisma.claim.update({ where: { id: claimId }, data: { status: "reviewed" } });

  return result;
}

export async function analyzeTextDirect(text: string) {
  const task: PromptTask = "claim-extraction";
  return registry.callWithFallback({ task, input: { text } });
}

export async function analyzeUrlDirect(url: string) {
  const task: PromptTask = "claim-extraction";
  // Jina can retrieve content; for now we pass URL as context to extractor.
  return registry.callWithFallback({ task, input: { url } });
}

// ─── Detect and parse Instagram URL ───
function parseInstagramUrl(url: string): { mediaType: 'reel' | 'post' | 'story'; username: string | null } | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes('instagram.com')) return null;
    const parts = u.pathname.split('/').filter(Boolean);
    // /reel/CODE or /reels/CODE
    if (parts[0] === 'reel' || parts[0] === 'reels') return { mediaType: 'reel', username: null };
    // /stories/USERNAME/ID
    if (parts[0] === 'stories') return { mediaType: 'story', username: parts[1] || null };
    // /p/CODE (post)
    if (parts[0] === 'p') return { mediaType: 'post', username: null };
    // /USERNAME/reel/CODE
    if (parts[1] === 'reel' || parts[1] === 'reels') return { mediaType: 'reel', username: parts[0] };
    // Default: treat as post
    return { mediaType: 'post', username: parts[0] || null };
  } catch {
    return null;
  }
}

export async function analyzeInstagramClaim(claimId: string): Promise<{ mediaType: string; username: string | null; analysisResult: any }> {
  const claim = await prisma.claim.findUnique({ where: { id: claimId }, include: { inputs: true } });
  if (!claim) throw new HttpError(404, "Claim not found");

  const url = claim.inputs.find((i) => i.rawUrl)?.rawUrl;
  if (!url) throw new HttpError(400, "No URL found for Instagram analysis");

  const igInfo = parseInstagramUrl(url);
  if (!igInfo) throw new HttpError(400, "URL is not a valid Instagram URL");

  await prisma.claim.update({ where: { id: claimId }, data: { status: "analyzing" } });

  const task: PromptTask = "instagram-analysis";
  const result = await registry.callWithFallback({
    task,
    input: { url, text: `Instagram ${igInfo.mediaType}${igInfo.username ? ` by @${igInfo.username}` : ''}` }
  });

  const raw = result.json as any;
  const verdict = raw?.verdict ?? "UNVERIFIED";
  const rawConf: number | null = typeof raw?.confidence === 'number' ? raw.confidence : null;
  const rawFake: number | null = typeof raw?.fakeProbability === 'number' ? raw.fakeProbability : null;

  const checks = raw?.checks || {};
  const hasManipulation = checks.fakeCaptions || checks.hashtagManipulation || checks.impersonation || checks.fakeGiveaway || checks.repostedMisinfo || checks.editedMedia || checks.healthMisinfo;
  const numRiskFactors = Array.isArray(raw?.riskFactors) ? raw.riskFactors.length : 0;

  let dbConfidence: number | null = null;
  let dbFakeProbability: number | null = null;

  if (verdict === "FALSE") {
    let calcFakeProb = rawFake;
    if (calcFakeProb == null) {
        if (checks.impersonation || checks.fakeGiveaway) calcFakeProb = 0.95;
        else if (checks.editedMedia || checks.healthMisinfo) calcFakeProb = 0.90;
        else if (hasManipulation || numRiskFactors > 2) calcFakeProb = 0.85;
        else calcFakeProb = rawConf != null ? 1 - rawConf : 0.75;
    }
    dbFakeProbability = calcFakeProb;
  } else if (verdict === "MISLEADING") {
    let calcConf = rawConf;
    if (calcConf == null) {
        if (checks.fakeCaptions || checks.repostedMisinfo) calcConf = 0.85;
        else if (hasManipulation || numRiskFactors > 0) calcConf = 0.75;
        else calcConf = 0.55;
    }
    dbConfidence = calcConf;
  } else if (verdict === "TRUE") {
    let calcConf = rawConf;
    if (calcConf == null) {
        if (!hasManipulation && numRiskFactors === 0) calcConf = 0.85;
        else calcConf = 0.60;
    }
    dbConfidence = calcConf;
  } else {
    dbConfidence = rawConf ?? 0.3;
  }

  await storeAIAnalysis({
    claimId,
    providerResult: {
      ...result,
      json: { ...raw, confidence: dbConfidence, fakeProbability: dbFakeProbability, mediaType: igInfo.mediaType, username: igInfo.username }
    },
    task,
    inputSummary: url.slice(0, 200)
  });

  await prisma.claim.update({ where: { id: claimId }, data: { status: "reviewed" } });

  return {
    mediaType: igInfo.mediaType,
    username: raw?.username || igInfo.username,
    analysisResult: raw
  };
}

// ════════════════════════════════════════
//  VIDEO ANALYSIS  (yt-dlp + Gemini vision)
// ════════════════════════════════════════

export async function analyzeVideoClaim(
  claimId: string,
  opts?: { sourceUrl?: string }
): Promise<{ videoUrl: string; analysisResult: any; sizeBytes?: number }> {
  const claim = await prisma.claim.findUnique({ where: { id: claimId }, include: { inputs: true } });
  if (!claim) throw new HttpError(404, "Claim not found");

  const videoUrl = opts?.sourceUrl || claim.inputs.find((i) => i.rawUrl)?.rawUrl || claim.inputs.find((i) => i.rawText)?.rawText || "";
  if (!videoUrl) throw new HttpError(400, "No video URL found for analysis");

  await prisma.claim.update({ where: { id: claimId }, data: { status: "analyzing" } });

  const task: PromptTask = "video-analysis";
  let videoBase64: string | undefined;
  let videoMimeType = "video/mp4";
  let sizeBytes: number | undefined;
  let downloadError: string | undefined;

  // Attempt to download video via yt-dlp
  try {
    const { downloadVideo, isYtDlpAvailable } = await import("./videoDownloader");
    const ytdlpAvailable = await isYtDlpAvailable();

    if (ytdlpAvailable) {
      const dl = await downloadVideo(videoUrl);
      videoBase64 = dl.buffer.toString("base64");
      videoMimeType = dl.mimeType;
      sizeBytes = dl.sizeBytes;
    } else {
      downloadError = "yt-dlp not available — running URL-only analysis";
    }
  } catch (err: any) {
    const msg = String(err?.message ?? "");
    const isCookieError = msg.includes("login") || msg.includes("cookie") || msg.includes("authentication") || msg.includes("browser");

    downloadError = isCookieError
      ? "Instagram requires you to be logged in. Please open Instagram in Chrome/Edge, log in, then retry — yt-dlp will read your browser cookies automatically."
      : `Video download failed (${msg.slice(0, 120)}) — running URL-only analysis`;
  }

  // Build the AI analysis — with video bytes if download succeeded, URL-only if not
  const analysisContext = videoBase64
    ? `Video URL: ${videoUrl}`
    : [
        `Video URL: ${videoUrl}`,
        `Platform: ${/instagram/.test(videoUrl) ? "Instagram Reel" : /youtube/.test(videoUrl) ? "YouTube" : "Video"}`,
        "Note: Full video could not be downloaded. Analyze the URL metadata, platform patterns, and any available public context to give the most accurate verdict possible.",
        downloadError ? `Reason: ${downloadError}` : ""
      ].filter(Boolean).join("\n");

  const result = await registry.callWithFallback({
    task,
    input: {
      url: videoUrl,
      text: analysisContext,
      metadata: videoBase64 ? { videoBase64, videoMimeType } : {}
    }
  });

  const raw = result.json as any;
  const verdict = raw?.verdict ?? "UNVERIFIED";
  const rawConf: number | null = typeof raw?.confidence === "number" ? raw.confidence : null;
  const rawFake: number | null = typeof raw?.fakeProbability === "number" ? raw.fakeProbability : null;

  const isDeepfake = raw?.isDeepfake === true;
  const isOutOfContext = raw?.isOutOfContext === true;
  const isAiGeneratedAudio = raw?.isAiGeneratedAudio === true;
  const numManipulationSignals = Array.isArray(raw?.manipulationSignals) ? raw.manipulationSignals.length : 0;
  const numEvidence = Array.isArray(raw?.evidence) ? raw.evidence.length : 0;
  
  let dbConfidence: number | null = null;
  let dbFakeProbability: number | null = null;
  
  if (verdict === "FALSE") {
    let calcFakeProb = rawFake;
    if (calcFakeProb == null) {
        if (isDeepfake || isAiGeneratedAudio) calcFakeProb = 0.96;
        else if (numManipulationSignals > 2) calcFakeProb = 0.90;
        else if (numEvidence > 0 || numManipulationSignals > 0) calcFakeProb = 0.85;
        else calcFakeProb = rawConf != null ? 1 - rawConf : 0.80;
    }
    dbFakeProbability = calcFakeProb;
    dbConfidence = calcFakeProb;
  } else if (verdict === "MISLEADING") {
    let calcConf = rawConf;
    if (calcConf == null) {
        if (isOutOfContext) calcConf = 0.85;
        else if (numManipulationSignals > 0) calcConf = 0.75;
        else calcConf = 0.60;
    }
    dbConfidence = calcConf;
    dbFakeProbability = rawFake ?? 0.4;
  } else if (verdict === "TRUE") {
    let calcConf = rawConf;
    if (calcConf == null) {
        if (!isDeepfake && !isAiGeneratedAudio && !isOutOfContext && numManipulationSignals === 0) calcConf = 0.88;
        else calcConf = 0.65;
    }
    dbConfidence = calcConf;
  } else {
    dbConfidence = rawConf ?? 0.3;
  }

  // Rich explanation: merge summary, spoken claims, visual findings
  const spokenClaims: string[] = Array.isArray(raw?.spokenClaims) ? raw.spokenClaims : [];
  const visualFindings: string[] = Array.isArray(raw?.visualFindings) ? raw.visualFindings : [];
  const evidence: any[] = Array.isArray(raw?.evidence) ? raw.evidence : [];

  const richSummary = [
    raw?.summary || "",
    spokenClaims.length ? `\n\n📢 Key Claims Spoken in Video:\n${spokenClaims.map((c, i) => `${i + 1}. ${c}`).join("\n")}` : "",
    visualFindings.length ? `\n\n👁️ Visual Analysis:\n${visualFindings.map((f, i) => `${i + 1}. ${f}`).join("\n")}` : "",
    evidence.length ? `\n\n🔍 Evidence Timeline:\n${evidence.map((e: any) => `[${e.timestamp ?? "?"}] ${e.type?.toUpperCase() ?? "?"}: ${e.finding} — ${e.verdict}`).join("\n")}` : "",
    raw?.isDeepfake ? "\n\n⚠️ DEEPFAKE INDICATORS DETECTED" : "",
    raw?.isOutOfContext ? "\n\n⚠️ VIDEO APPEARS TO BE OUT-OF-CONTEXT REPURPOSING" : "",
    raw?.isAiGeneratedAudio ? "\n\n⚠️ AI-GENERATED AUDIO DETECTED" : "",
    downloadError ? `\n\n[Note: ${downloadError}]` : "",
  ].filter(Boolean).join("");

  await storeAIAnalysis({
    claimId,
    providerResult: {
      ...result,
      json: {
        ...raw,
        confidence: dbConfidence,
        fakeProbability: dbFakeProbability,
        summary: richSummary,
        videoUrl,
        sizeBytes
      }
    },
    task,
    inputSummary: videoUrl.slice(0, 200)
  });

  // Mark as reviewed so result page stops polling
  await prisma.claim.update({ where: { id: claimId }, data: { status: "reviewed" } });

  return { videoUrl, analysisResult: { ...raw, summary: richSummary }, sizeBytes };
}
