import { Queue, Worker } from "bullmq";
import { redis } from "../config/redis";
import { prisma } from "../config/prisma";
import { ProviderRegistry } from "../providers";
import { computeFeaturedScore } from "../services/featuredService";
import { makeNormalizedKey } from "../utils/normalize";

const QUEUE_NAME = "featured-tracker";
const registry = new ProviderRegistry();

type FeedItem = {
  claimText: string;
  url?: string;
  publisher?: string;
  publishedAt?: Date;
  category?: string;
  region?: string;
  sourceTrust?: number;
  virality?: number;
};

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function recencyScore(publishedAt?: Date) {
  if (!publishedAt) return 0.4;
  const ageMs = Date.now() - publishedAt.getTime();
  const days = ageMs / (1000 * 60 * 60 * 24);
  // 0 days => 1.0, 7 days => ~0.3, 30 days => ~0.1
  return clamp01(1 / (1 + days / 2));
}

async function fetchFeedItemsMock(): Promise<FeedItem[]> {
  return [
    {
      claimText: "A new rule says bank accounts will be frozen if you don't share this message.",
      url: "https://example.com/factcheck/bank-account-share-message",
      publisher: "MockFactCheck",
      publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      category: "scam",
      sourceTrust: 0.7,
      virality: 0.6
    },
    {
      claimText: "Government has announced free laptops for everyone who forwards this link.",
      url: "https://example.com/factcheck/free-laptop-forward",
      publisher: "MockFactCheck",
      publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      category: "scam",
      sourceTrust: 0.65,
      virality: 0.55
    }
  ];
}

async function fetchRecentFactcheckItems(): Promise<FeedItem[]> {
  // In production, wire a list of ClaimReview feeds / sources. For initial build, keep mock-safe.
  // If Jina key is present, you can swap in real fetching/parsing here.
  return fetchFeedItemsMock();
}

async function upsertClaimFromFeed(item: FeedItem) {
  const normalizedKey = makeNormalizedKey({ text: item.claimText, url: item.url });
  const existing = await prisma.claim.findFirst({ where: { normalizedKey } });
  if (existing) return existing;

  // Use a system user placeholder for automated ingestion.
  const systemUser =
    (await prisma.user.findFirst({ where: { email: "system@clarifact.local" } })) ??
    (await prisma.user.create({ data: { email: "system@clarifact.local", passwordHash: "!" } }));

  const claim = await prisma.claim.create({
    data: {
      userId: systemUser.id,
      title: item.claimText.slice(0, 200),
      contentType: "url",
      normalizedKey,
      category: item.category,
      region: item.region,
      inputs: {
        create: {
          type: "url",
          rawText: item.claimText,
          rawUrl: item.url,
          rawMeta: {
            publisher: item.publisher,
            publishedAt: item.publishedAt?.toISOString()
          }
        }
      }
    }
  });

  return claim;
}

async function clusterAndScore(items: FeedItem[]) {
  // Deduplicate by normalized key.
  const byKey = new Map<string, FeedItem>();
  for (const item of items) {
    const key = makeNormalizedKey({ text: item.claimText, url: item.url });
    if (!byKey.has(key)) byKey.set(key, item);
  }

  const unique = Array.from(byKey.values());

  // Placeholder clustering: treat each unique item as its own cluster for now.
  return unique;
}

async function computeAndPersistFeatured(claimId: string, item: FeedItem) {
  const votesCount = await prisma.communityVote.count({ where: { claimId } });
  const userEngagement = clamp01(votesCount / 25);

  const featuredScore = computeFeaturedScore({
    recency: recencyScore(item.publishedAt),
    virality: clamp01(item.virality ?? 0.5),
    sourceTrust: clamp01(item.sourceTrust ?? 0.6),
    categoryPriority: clamp01(item.category === "health" ? 0.9 : item.category === "scam" ? 0.8 : 0.5),
    userEngagement
  });

  await prisma.featuredClaim.create({
    data: {
      claimId,
      featuredScore,
      category: item.category,
      riskLevel: featuredScore >= 0.7 ? "high" : featuredScore >= 0.45 ? "medium" : "low",
      sourceTrust: item.sourceTrust ?? 0.6,
      virality: item.virality ?? 0.5,
      userEngagement,
      whyFeatured: {
        components: {
          recency: recencyScore(item.publishedAt),
          virality: item.virality ?? 0.5,
          sourceTrust: item.sourceTrust ?? 0.6,
          categoryPriority: item.category === "health" ? 0.9 : item.category === "scam" ? 0.8 : 0.5,
          userEngagement
        }
      } as any
    }
  });
}

export async function runFeaturedTrackerOnce() {
  const runKey = `featured:${new Date().toISOString()}`;
  const log = await prisma.ingestionLog.create({ data: { runKey, status: "running" } });

  try {
    const items = await fetchRecentFactcheckItems();
    const clustered = await clusterAndScore(items);

    let upserted = 0;
    for (const item of clustered) {
      const claim = await upsertClaimFromFeed(item);

      const prompt = `Return JSON. Task: classify this claim briefly.\n\nClaim: ${item.claimText}`;
      const enrich = await registry.callWithFallback({ task: "final-verdict-summary", input: { text: item.claimText }, prompt });
      await prisma.aIAnalysis.create({
        data: {
          claimId: claim.id,
          provider: enrich.meta.provider,
          model: enrich.meta.model,
          task: "final-verdict-summary",
          promptVersion: enrich.meta.promptVersion,
          inputSummary: item.claimText.slice(0, 200),
          rawJson: enrich.json as any
        }
      });

      await computeAndPersistFeatured(claim.id, item);
      upserted += 1;
    }

    await prisma.ingestionLog.update({
      where: { id: log.id },
      data: { status: "ok", itemsFetched: items.length, itemsUpserted: upserted }
    });

    return { itemsFetched: items.length, itemsUpserted: upserted };
  } catch (err: any) {
    await prisma.ingestionLog.update({
      where: { id: log.id },
      data: { status: "error", error: err?.message ?? String(err) }
    });
    throw err;
  }
}

export function initFeaturedTrackerQueue() {
  // Probe redis before initializing BullMQ — if it's not connected, skip queue silently.
  if (redis.status !== "ready" && redis.status !== "connecting") {
    console.warn("[Queue] Redis not available — featured tracker queue disabled.");
    return null;
  }

  const queue = new Queue(QUEUE_NAME, { connection: redis });
  queue.on("error", (err: Error) => console.warn("[FeaturedTracker Queue]", err.message));

  // Repeat every 6 hours by default.
  queue.add(
    "refresh",
    {},
    {
      repeat: { pattern: "0 */6 * * *" },
      removeOnComplete: 50,
      removeOnFail: 50
    }
  ).catch((err: Error) => console.warn("[FeaturedTracker] Could not schedule job:", err.message));

  const worker = new Worker(
    QUEUE_NAME,
    async () => {
      await runFeaturedTrackerOnce();
    },
    { connection: redis }
  );
  worker.on("error", (err: Error) => console.warn("[FeaturedTracker Worker]", err.message));

  return { queue, worker };
}
