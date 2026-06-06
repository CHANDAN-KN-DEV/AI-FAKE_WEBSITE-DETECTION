import { prisma } from "../config/prisma";
import { HttpError } from "../middleware/errorMiddleware";
import type { VerdictLabel } from "@prisma/client";

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function scoreToVerdict(score: number): VerdictLabel {
  // Interpret score as "truthiness" probability.
  if (score >= 0.67) return "TRUE";
  if (score <= 0.33) return "FALSE";
  return "MISLEADING";
}

function extractTruthinessFromRaw(rawJson: unknown): number | null {
  if (!rawJson || typeof rawJson !== "object") return null;
  const raw = rawJson as Record<string, unknown>;
  if (typeof raw.fakeProbability === "number") return clamp01(1 - raw.fakeProbability);
  if (typeof raw.confidence === "number") return clamp01(raw.confidence);
  const nested = raw.result;
  if (nested && typeof nested === "object") {
    const nestedResult = nested as Record<string, unknown>;
    if (typeof nestedResult.fakeProbability === "number") return clamp01(1 - nestedResult.fakeProbability);
    if (typeof nestedResult.confidence === "number") return clamp01(nestedResult.confidence);
  }
  return null;
}

export async function recalculateConsensus(claimId: string) {
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    include: {
      aiAnalyses: { orderBy: { createdAt: "desc" } },
      votes: true,
      trustedSources: true,
      verifiedUpdates: { orderBy: { createdAt: "desc" }, take: 1 }
    }
  });
  if (!claim) throw new HttpError(404, "Claim not found");

  // ONLY use final-verdict-summary analyses for the truthiness score.
  // claim-extraction confidence = "probability text contains a claim" (unrelated to truth)
  // mixing them corrupts the confidence calculation (e.g. URL claims get 0.4 confidence → wrong aiTruth)
  const verdictAnalyses = claim.aiAnalyses.filter(a => a.task === "final-verdict-summary");
  const extractionAnalyses = claim.aiAnalyses.filter(a => a.task === "claim-extraction");

  const latestByProvider = new Map<string, number>();

  // First: populate from final-verdict analyses (most accurate)
  for (const analysis of verdictAnalyses) {
    const key = `${analysis.provider}:${analysis.task}`;
    if (latestByProvider.has(key)) continue;
    const score = analysis.fakeProbability != null
      ? clamp01(1 - analysis.fakeProbability)
      : analysis.confidence != null
      ? clamp01(analysis.confidence)
      : extractTruthinessFromRaw(analysis.rawJson as unknown);
    if (typeof score === "number") latestByProvider.set(key, score);
  }

  // Only use claim-extraction as fallback when NO final-verdict analyses exist
  if (latestByProvider.size === 0) {
    for (const analysis of extractionAnalyses) {
      const key = `${analysis.provider}:${analysis.task}`;
      if (latestByProvider.has(key)) continue;
      const score = analysis.fakeProbability != null
        ? clamp01(1 - analysis.fakeProbability)
        : analysis.confidence != null
        ? clamp01(analysis.confidence)
        : extractTruthinessFromRaw(analysis.rawJson as unknown);
      if (typeof score === "number") latestByProvider.set(key, score);
    }
  }

  const aiScores = [...latestByProvider.values()];
  const aiTruth = aiScores.length > 0 ? aiScores.reduce((a, b) => a + b, 0) / aiScores.length : 0.5;


  // Community score: informational only, not used in verdict.
  const voteTruthiness = claim.votes.map((v) => {
    const t = v.value === "TRUE" ? 1 : v.value === "FALSE" ? 0 : 0.5;
    return { t, w: v.weight ?? 1 };
  });
  const communityTruth =
    voteTruthiness.length === 0
      ? 0.5
      : voteTruthiness.reduce((a, b) => a + b.t * b.w, 0) / voteTruthiness.reduce((a, b) => a + b.w, 0);

  // Source reliability
  const srcTrustValues = claim.trustedSources.map((s) => s.trust).filter((x): x is number => typeof x === "number");
  const sourceReliability = srcTrustValues.length ? srcTrustValues.reduce((a, b) => a + b, 0) / srcTrustValues.length : 0.5;

  // Verdict score is AI-only.
  const finalScore = clamp01(aiTruth);
  const latestCorrectionVerdict = claim.verifiedUpdates[0]?.verdict;
  const noVotes = claim.votes.length === 0;
  const noSources = claim.trustedSources.length === 0;
  const latestRaw = claim.aiAnalyses[0]?.rawJson as any;
  const aiLikelyMock =
    typeof latestRaw === "object" &&
    latestRaw != null &&
    ("note" in latestRaw || "attemptedProviders" in latestRaw);

  // Use the correction verdict as primary truth label; fall back to score-derived.
  let verdict: VerdictLabel;
  if (latestCorrectionVerdict && latestCorrectionVerdict !== "UNVERIFIED") {
    verdict = latestCorrectionVerdict;
  } else if (latestCorrectionVerdict === "UNVERIFIED" && (noVotes && noSources && aiLikelyMock)) {
    verdict = "UNVERIFIED";
  } else {
    verdict = scoreToVerdict(finalScore);
  }

  // Confidence percent: reflect the actual verdict strength.
  // For TRUE/FALSE: use the raw AI score direction. For MISLEADING: use distance from 0.5.
  let confidencePercent: number;
  if (verdict === "TRUE") {
    // Higher aiTruth → higher confidence it's true
    confidencePercent = clamp01(aiTruth) * 100;
  } else if (verdict === "FALSE") {
    // Lower aiTruth → higher confidence it's false
    confidencePercent = clamp01(1 - aiTruth) * 100;
  } else if (verdict === "MISLEADING") {
    // Proximity to 0.5 (ambiguous) → mid confidence; further from 0.5 → higher confidence
    confidencePercent = clamp01(0.5 + Math.abs(aiTruth - 0.5)) * 100;
  } else {
    // UNVERIFIED: show low confidence
    confidencePercent = clamp01(aiTruth >= 0.5 ? aiTruth : 1 - aiTruth) * 100;
  }

  // Boost confidence from trusted sources
  if (srcTrustValues.length > 0 && verdict !== "UNVERIFIED") {
    const srcBoost = sourceReliability * 0.1;
    confidencePercent = Math.min(99, confidencePercent + srcBoost * 100);
  }

  const disagreementIndex = clamp01(Math.abs(aiTruth - communityTruth));

  const consensus = await prisma.consensusResult.upsert({
    where: { claimId },
    create: {
      claimId,
      aiScore: aiTruth,
      communityScore: communityTruth,
      sourceReliability,
      finalScore,
      verdict,
      confidencePercent,
      disagreementIndex
    },
    update: {
      aiScore: aiTruth,
      communityScore: communityTruth,
      sourceReliability,
      finalScore,
      verdict,
      confidencePercent,
      disagreementIndex
    }
  });

  return consensus;
}


export async function getConsensus(claimId: string) {
  const consensus = await prisma.consensusResult.findUnique({ where: { claimId } });
  if (!consensus) throw new HttpError(404, "Consensus not found");
  return consensus;
}

