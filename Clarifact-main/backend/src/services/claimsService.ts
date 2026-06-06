import type { ContentType } from "@prisma/client";
import { prisma } from "../config/prisma";
import { guessLanguage, makeNormalizedKey } from "../utils/normalize";
import { HttpError } from "../middleware/errorMiddleware";

export type ClaimSubmitInput = {
  userId: string;
  title?: string;
  contentType: ContentType;
  text?: string;
  url?: string;
  metadata?: Record<string, unknown>;
};

export async function submitClaim(input: ClaimSubmitInput) {
  // Image and video claims store data in metadata — text is a descriptive label, not required
  const isMediaClaim = input.contentType === 'image' || input.contentType === 'video';
  if (!input.text && !input.url && !isMediaClaim) {
    throw new HttpError(400, "Either text or url is required");
  }

  const language = guessLanguage(input.text ?? input.url ?? "");
  const normalizedKey = makeNormalizedKey({ text: input.text, url: input.url });

  const claim = await prisma.claim.create({
    data: {
      userId: input.userId,
      title: input.title,
      contentType: input.contentType,
      language,
      normalizedKey,
      inputs: {
        create: {
          type: input.contentType,
          rawText: input.text,
          rawUrl: input.url,
          rawMeta: (input.metadata ?? undefined) as any
        }
      }
    },
    include: { inputs: true }
  });

  return claim;
}

export async function getClaimById(claimId: string) {
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    include: {
      inputs: true,
      aiAnalyses: { orderBy: { createdAt: "desc" } },
      emotionalSignals: { orderBy: { createdAt: "desc" } },
      trustedSources: { orderBy: { createdAt: "desc" } },
      verifiedUpdates: { orderBy: { createdAt: "desc" }, take: 1 },
      votes: { include: { evidence: true }, orderBy: { createdAt: "desc" } },
      consensus: true,
      featuredItems: { orderBy: { featuredAt: "desc" } }
    }
  });
  if (!claim) throw new HttpError(404, "Claim not found");
  return claim;
}

export async function getClaimHistory(userId: string, limit = 20) {
  return prisma.claim.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { consensus: true }
  });
}

