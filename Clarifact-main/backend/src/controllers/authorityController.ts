import type { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma";
import { HttpError } from "../middleware/errorMiddleware";

export async function getPending(req: Request, res: Response, next: NextFunction) {
  try {
    const userRole = req.user!.role;
    if (userRole !== "admin" && userRole !== "expert") {
      return next(new HttpError(403, "Only authority users can access this"));
    }

    // Pending claims are claims that do NOT have a vote from any authority
    // AND they must be highly important (not silly claims), filtered by high emotional intensity
    const claims = await prisma.claim.findMany({
      where: {
        votes: {
          none: {
            user: {
              role: { in: ["admin", "expert"] }
            }
          }
        },
        emotionalSignals: {
          some: {
            OR: [
              { urgency: { gte: 0.5 } },
              { fear: { gte: 0.5 } },
              { anger: { gte: 0.5 } },
              { outrage: { gte: 0.5 } },
              { authority: { gte: 0.5 } }
            ]
          }
        }
      },
      include: {
        inputs: true,
        aiAnalyses: true
      },
      orderBy: { createdAt: "desc" },
      take: 50
    });

    const formatted = claims.map(c => {
      const input = c.inputs[0];
      const ai = c.aiAnalyses[0];
      return {
        id: c.id,
        title: c.title || input?.rawText?.substring(0, 50) || "Untitled",
        text: input?.rawText,
        url: input?.rawUrl,
        contentType: c.contentType,
        status: "pending",
        createdAt: c.createdAt.toISOString(),
        aiVerdict: ai?.rawJson ? (ai.rawJson as any).verdict || "UNVERIFIED" : "UNVERIFIED",
        aiConfidence: ai?.confidence ? Math.round(ai.confidence * 100) : 0
      };
    });

    res.json({ claims: formatted });
  } catch (err) {
    next(err);
  }
}

export async function getCompleted(req: Request, res: Response, next: NextFunction) {
  try {
    // Completed claims are claims that HAVE a vote from an authority
    const claims = await prisma.claim.findMany({
      where: {
        votes: {
          some: {
            user: {
              role: { in: ["admin", "expert"] }
            }
          }
        }
      },
      include: {
        inputs: true,
        votes: {
          where: {
            user: {
              role: { in: ["admin", "expert"] }
            }
          },
          include: { user: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 50
    });

    const formatted = claims.map(c => {
      const input = c.inputs[0];
      // get current user's vote if logged in
      const myVote = req.user ? c.votes.find(v => v.userId === req.user!.id)?.value : null;

      return {
        id: c.id,
        title: c.title || input?.rawText?.substring(0, 50) || "Untitled",
        text: input?.rawText,
        url: input?.rawUrl,
        contentType: c.contentType,
        status: "reviewed",
        createdAt: c.createdAt.toISOString(),
        myVote,
        authorityVerdicts: c.votes.map(v => ({
          verdict: v.value,
          authorityName: v.user.email || "Authority",
          reviewedAt: v.createdAt.toISOString()
        }))
      };
    });

    res.json({ claims: formatted });
  } catch (err) {
    next(err);
  }
}

export async function vote(req: Request, res: Response, next: NextFunction) {
  try {
    const userRole = req.user!.role;
    if (userRole !== "admin" && userRole !== "expert") {
      return next(new HttpError(403, "Only authority users can access this"));
    }

    const claimId = typeof req.params.claimId === "string" ? req.params.claimId : req.params.claimId[0];
    const { verdict } = req.body;

    const vote = await prisma.communityVote.upsert({
      where: { claimId_userId: { claimId, userId: req.user!.id } },
      create: {
        claimId,
        userId: req.user!.id,
        value: verdict,
        reasoning: "Authority verdict"
      },
      update: {
        value: verdict,
        reasoning: "Authority verdict updated"
      }
    });

    await prisma.claim.update({
      where: { id: claimId },
      data: { status: "reviewed" }
    });

    res.json({ success: true, verdict, claimId });
  } catch (err) {
    next(err);
  }
}
