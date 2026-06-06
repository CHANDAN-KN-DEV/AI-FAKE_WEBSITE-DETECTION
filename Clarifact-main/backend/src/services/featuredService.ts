import { prisma } from "../config/prisma";

export type FeaturedComponents = {
  recency: number;
  virality: number;
  sourceTrust: number;
  categoryPriority: number;
  userEngagement: number;
};

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

export function computeFeaturedScore(c: FeaturedComponents) {
  const score =
    0.35 * c.recency +
    0.25 * c.virality +
    0.2 * c.sourceTrust +
    0.1 * c.categoryPriority +
    0.1 * c.userEngagement;
  return clamp01(score);
}

export async function listTopPicks(limit = 10) {
  return prisma.featuredClaim.findMany({
    orderBy: { featuredScore: "desc" },
    take: limit,
    include: { claim: true }
  });
}

