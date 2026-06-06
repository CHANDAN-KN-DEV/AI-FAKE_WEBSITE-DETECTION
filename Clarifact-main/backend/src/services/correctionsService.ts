import { prisma } from "../config/prisma";
import { ProviderRegistry } from "../providers";
import { HttpError } from "../middleware/errorMiddleware";
import axios from "axios";
import { env } from "../config/env";

const registry = new ProviderRegistry();

// These are FACT-CHECKING sources — articles from these domains are DEBUNKING claims,
// so the verdict should come from the article content, not from the domain trust alone.
const FACTCHECK_DOMAINS = [
  "reuters.com/fact-check",
  "factcheck.org",
  "politifact.com",
  "snopes.com",
  "fullfact.org",
  "boomlive.in",
  "factchecker.in",
  "altnews.in",
  "vishvasnews.com",
  "logically.ai",
  "misbar.com",
  "leadstories.com",
  "africacheck.org"
];

// Reputable news sources (NOT fact-check pages) — high domain trust
const TRUSTED_NEWS_DOMAINS = [
  "thehindu.com",
  "indianexpress.com",
  "timesofindia.indiatimes.com",
  "hindustantimes.com",
  "ndtv.com",
  "bbc.com",
  "reuters.com"
];

function isFactCheckUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return FACTCHECK_DOMAINS.some((d) => lower.includes(d));
}

function isNewsUrl(url: string): boolean {
  const lower = url.toLowerCase();
  // Must be trusted domain but NOT a fact-check page
  return TRUSTED_NEWS_DOMAINS.some((d) => lower.includes(d)) && !isFactCheckUrl(url);
}

function parseUrlsFromText(text: string): string[] {
  const matches = text.match(/https?:\/\/[^\s)]+/g) ?? [];
  return [...new Set(matches.map((m) => m.replace(/[),.;]+$/, "")))];
}

// Fetch URL content via Jina Reader for richer context
async function fetchUrlContent(url: string): Promise<string | null> {
  if (!env.JINA_API_KEY || !url) return null;
  try {
    const readerUrl = `https://r.jina.ai/${url}`;
    const resp = await axios.get(readerUrl, {
      headers: { Authorization: `Bearer ${env.JINA_API_KEY}` },
      timeout: 15_000
    });
    const raw = typeof resp.data === "string" ? resp.data : JSON.stringify(resp.data);
    // Return first 3000 chars — enough for verdict without overwhelming the prompt
    return raw.slice(0, 3000);
  } catch {
    return null;
  }
}

async function getJinaEvidence(text: string) {
  if (!env.JINA_API_KEY || !text.trim()) return [];
  try {
    const search = await axios.get(`https://s.jina.ai/${encodeURIComponent(text.trim())}`, {
      headers: { Authorization: `Bearer ${env.JINA_API_KEY}` },
      timeout: 12_000
    });
    const raw = typeof search.data === "string" ? search.data : JSON.stringify(search.data);
    const urls = parseUrlsFromText(raw)
      .filter((url) => TRUSTED_NEWS_DOMAINS.some((d) => url.includes(d)))
      .slice(0, 5);
    return urls.map((url) => ({ url, title: new URL(url).hostname, why: "Fetched via Jina trusted-news search" }));
  } catch {
    return [];
  }
}

function normalizeVerdictLabel(input: unknown): "TRUE" | "FALSE" | "MISLEADING" | "UNVERIFIED" {
  const value = String(input ?? "UNVERIFIED").trim().toUpperCase();
  if (value === "TRUE" || value === "VERIFIED") return "TRUE";
  if (value === "FALSE" || value === "FAKE" || value === "DEBUNKED" || value === "RATING_FALSE") return "FALSE";
  if (value === "MISLEADING" || value === "PARTIALLY TRUE" || value === "PARTLY TRUE" || value === "MIXTURE") return "MISLEADING";
  return "UNVERIFIED";
}

// Extract verdict from fact-check article text using keyword heuristics
// Reuters, Snopes etc. use patterns like "FAKE" / "FALSE" / "MISLEADING" as their rating
function extractVerdictFromFactCheckText(content: string): "TRUE" | "FALSE" | "MISLEADING" | null {
  const text = content.slice(0, 1500).toLowerCase();
  // Common fact-check rating patterns
  if (/\b(fake|false|fabricated|debunked|no,?\s|incorrect|inaccurate|wrong)\b/.test(text)) return "FALSE";
  if (/\b(misleading|partially\s+true|partly\s+true|mixture|missing\s+context)\b/.test(text)) return "MISLEADING";
  if (/\b(true|verified|correct|accurate|legitimate)\b/.test(text)) return "TRUE";
  return null;
}

export async function getCorrection(claimId: string) {
  const update = await prisma.verifiedUpdate.findFirst({ where: { claimId }, orderBy: { createdAt: "desc" } });
  if (!update) throw new HttpError(404, "No correction found");
  return update;
}

export async function generateCorrection(claimId: string) {
  const claim = await prisma.claim.findUnique({ where: { id: claimId }, include: { inputs: true, trustedSources: true } });
  if (!claim) throw new HttpError(404, "Claim not found");

  const text = claim.inputs.find((i) => i.rawText)?.rawText ?? claim.title ?? "";
  const inputUrl = claim.inputs.find((i) => i.rawUrl)?.rawUrl ?? null;

  // Detect if the submitted URL is a fact-check page
  const urlIsFactCheck = typeof inputUrl === "string" && isFactCheckUrl(inputUrl);
  const urlIsNewsArticle = typeof inputUrl === "string" && isNewsUrl(inputUrl);

  // Fetch URL content via Jina Reader for fact-check and news URLs
  let urlContent: string | null = null;
  if (inputUrl && (urlIsFactCheck || urlIsNewsArticle)) {
    urlContent = await fetchUrlContent(inputUrl);
  }

  // Extract heuristic verdict from fact-check page content BEFORE calling AI
  let heuristicVerdictFromPage: "TRUE" | "FALSE" | "MISLEADING" | null = null;
  if (urlIsFactCheck && urlContent) {
    heuristicVerdictFromPage = extractVerdictFromFactCheckText(urlContent);
  }

  const dbEvidence = claim.trustedSources.slice(0, 5).map((s) => ({ url: s.url, title: s.title, why: s.excerpt }));
  const webEvidence = dbEvidence.length > 0 ? [] : await getJinaEvidence(text);
  const evidence = [...dbEvidence, ...webEvidence].slice(0, 5);
  const hasGroundingEvidence = evidence.length > 0 || /https?:\/\//i.test(text) || urlContent !== null;

  // Build a rich, context-aware prompt
  const promptParts = [
    "Return ONLY JSON.",
    "You are a fact-checking assistant. Analyze the following and provide a verdict.",
    "",
    urlIsFactCheck
      ? "IMPORTANT: The submitted input is a FACT-CHECK ARTICLE from a trusted fact-checking organization. The article is DEBUNKING or VERIFYING a claim. Read the article content carefully to determine what the fact-checkers concluded. A fact-check saying something is 'FAKE' or 'FALSE' means verdict = FALSE."
      : urlIsNewsArticle
      ? "The submitted input is a news article URL. Assess whether the news article's main claim is credible, verified, or misleading based on the content."
      : "",
    `Input URL: ${inputUrl ?? "(none)"}`,
    `Input text: ${text}`,
    urlContent ? `\nPage content (first 3000 chars):\n${urlContent}` : "",
    evidence.length > 0 ? `\nEvidence: ${JSON.stringify(evidence)}` : "",
    "",
    'Return JSON: { "verdict": "TRUE|FALSE|MISLEADING|UNVERIFIED", "confidence": 0-1, "summary": "...", "eli10": "...", "evidence": [] }'
  ].filter(s => s !== undefined).join("\n");

  // One-pass scan across all providers, then pick best non-mock response.
  const compared = await registry.compareProviders({ task: "final-verdict-summary", input: { text, url: inputUrl ?? undefined }, prompt: promptParts });
  const preferredOrder = ["grok", "openrouter", "gemini", "jina"];
  const nonMock = compared
    .filter((r) => !r.meta.usedMock && typeof (r.json as any)?.verdict !== "undefined")
    .sort((a, b) => preferredOrder.indexOf(a.meta.provider) - preferredOrder.indexOf(b.meta.provider));
  const withVerdict = compared.find((r) => typeof (r.json as any)?.verdict !== "undefined");
  const result = nonMock[0] ?? withVerdict ?? compared[0];

  let verdict = normalizeVerdictLabel((result.json as any)?.verdict);

  // If the AI couldn't determine verdict from limited context, fall back to grounding rules:
  if (!hasGroundingEvidence && verdict !== "UNVERIFIED") {
    verdict = "UNVERIFIED";
  }

  // FACT-CHECK PAGES: Trust heuristic > AI verdict when the page content clearly states an outcome.
  // This prevents reuters.com domain trust from overriding what the article actually says.
  if (urlIsFactCheck) {
    if (heuristicVerdictFromPage) {
      // The page content explicitly says FAKE/FALSE/MISLEADING → trust that
      verdict = heuristicVerdictFromPage;
    } else if (verdict === "UNVERIFIED" && urlContent) {
      // Page was fetched but no clear heuristic — keep AI verdict
    }
    // Do NOT auto-upgrade to TRUE just because reuters.com is a trusted domain
  } else if (urlIsNewsArticle) {
    // For regular news articles (NOT fact-checks), the domain being reputable raises confidence
    // but does NOT force TRUE — the AI verdict takes precedence.
    // Only apply trust boost if AI said TRUE (don't override FALSE/MISLEADING)
    if (verdict === "UNVERIFIED" && urlContent) {
      verdict = "TRUE"; // Reputable news article with content → lean TRUE
    }
  } else {
    // Plain text or unknown URL: use AI verdict directly (no domain override)
    const trustedEvidenceCount = evidence.filter((e) => typeof e.url === "string" && TRUSTED_NEWS_DOMAINS.some(d => e.url.includes(d))).length;
    if (trustedEvidenceCount >= 2 && verdict === "UNVERIFIED") {
      verdict = "TRUE"; // Multiple trusted sources found → lean TRUE only if unverified
    }
  }

  const correction = (result.json as any)?.summary ?? (result.json as any)?.correction_summary ?? null;
  const eli10 = (result.json as any)?.eli10 ?? null;

  const update = await prisma.verifiedUpdate.create({
    data: {
      claimId,
      verdict,
      correction: correction ?? undefined,
      evidenceSnapshot: {
        eli10,
        confidence: (result.json as any)?.confidence,
        provider: result.meta,
        result: result.json,
        heuristicVerdict: heuristicVerdictFromPage,
        urlIsFactCheck,
        urlIsNewsArticle
      } as any,
      generatedBy: result.meta.provider
    }
  });

  // Store final-verdict result as an AIAnalysis row so consensusService
  // can find the real confidence value when recalculating.
  const rawResult = result.json as any;
  const rawConf: number | null = typeof rawResult?.confidence === "number" ? rawResult.confidence
    : typeof rawResult?.result?.confidence === "number" ? rawResult.result.confidence
    : null;
  const rawFake: number | null = typeof rawResult?.fakeProbability === "number" ? rawResult.fakeProbability
    : typeof rawResult?.result?.fakeProbability === "number" ? rawResult.result.fakeProbability
    : null;

  // Map verdict to DB columns correctly for consensusService to read:
  // - TRUE: store in `confidence` (aiTruth = confidence → confidencePercent = confidence*100)
  // - FALSE: store in `fakeProbability` (aiTruth = 1-fakeProbability → confidencePercent = fakeProbability*100)
  // - MISLEADING: store in `confidence` at ~0.5 so consensusService shows medium confidence
  let dbConfidence: number | null = null;
  let dbFakeProbability: number | null = rawFake;

  if (verdict === "TRUE") {
    dbConfidence = rawConf ?? 0.82;
  } else if (verdict === "FALSE") {
    // Store as fakeProbability so consensusService computes: aiTruth = 1 - 0.78 = 0.22, confidencePercent = (1-0.22)*100 = 78%
    dbFakeProbability = rawFake ?? (rawConf != null ? 1 - rawConf : 0.78);
    dbConfidence = null;
  } else if (verdict === "MISLEADING") {
    dbConfidence = rawConf ?? 0.5; // Near 0.5 → MISLEADING confidence
  } else {
    dbConfidence = 0.35; // UNVERIFIED → low confidence
  }

  await prisma.aIAnalysis.create({
    data: {
      claimId,
      provider: result.meta.provider,
      model: result.meta.model,
      task: "final-verdict-summary",
      promptVersion: result.meta.promptVersion ?? "v1",
      rawJson: result.json as any,
      confidence: dbConfidence,
      fakeProbability: dbFakeProbability,
      explanation: correction ?? undefined,
      eli10: eli10 ?? undefined,
    }
  });

  if (webEvidence.length > 0) {
    for (const src of webEvidence) {
      const exists = await prisma.trustedSource.findFirst({ where: { claimId, url: src.url } });
      if (exists) continue;
      await prisma.trustedSource.create({
        data: {
          claimId,
          url: src.url,
          title: src.title,
          publisher: src.title,
          type: "news",
          trust: 0.75,
          excerpt: src.why
        }
      });
    }
  }

  await prisma.claim.update({
    where: { id: claimId },
    data: { status: "reviewed" }
  });

  return { update, provider: result };
}
