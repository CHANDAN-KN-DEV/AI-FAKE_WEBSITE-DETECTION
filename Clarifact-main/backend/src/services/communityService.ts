import type { VoteValue } from "@prisma/client";
import { prisma } from "../config/prisma";
import { HttpError } from "../middleware/errorMiddleware";

export async function submitVote(params: {
  claimId: string;
  userId: string;
  value: VoteValue;
  reasoning: string;
  evidenceUrls?: string[];
}) {
  if (!params.reasoning?.trim()) throw new HttpError(400, "Reasoning is required");

  const vote = await prisma.$transaction(async (tx) => {
    const savedVote = await tx.communityVote.upsert({
      where: { claimId_userId: { claimId: params.claimId, userId: params.userId } },
      create: {
        claimId: params.claimId,
        userId: params.userId,
        value: params.value,
        reasoning: params.reasoning,
        evidence: params.evidenceUrls?.length
          ? {
              create: params.evidenceUrls.slice(0, 5).map((url) => ({ url, type: "link" }))
            }
          : undefined
      },
      update: {
        value: params.value,
        reasoning: params.reasoning,
        evidence: params.evidenceUrls?.length
          ? {
              deleteMany: {},
              create: params.evidenceUrls.slice(0, 5).map((url) => ({ url, type: "link" }))
            }
          : undefined
      },
      include: { evidence: true }
    });

    // Award a reusable verification badge to community members who participate.
    const badge = await tx.badge.upsert({
      where: { code: "community-verified" },
      update: {},
      create: {
        code: "community-verified",
        name: "Community Verified",
        description: "Verified contributor who submitted community votes."
      }
    });

    await tx.userBadge.upsert({
      where: {
        userId_badgeId: {
          userId: params.userId,
          badgeId: badge.id
        }
      },
      update: {},
      create: {
        userId: params.userId,
        badgeId: badge.id
      }
    });

    return savedVote;
  });

  return vote;
}

export async function getVotesForClaim(claimId: string) {
  return prisma.communityVote.findMany({
    where: { claimId },
    include: { evidence: true, user: { select: { id: true, role: true } } },
    orderBy: { createdAt: "desc" }
  });
}

