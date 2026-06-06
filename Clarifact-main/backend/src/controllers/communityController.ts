import type { Request, Response } from "express";
import { z } from "zod";
import * as communityService from "../services/communityService";

const voteSchema = z.object({
  claimId: z.string().uuid(),
  value: z.enum(["TRUE", "FALSE", "MISLEADING"]),
  reasoning: z.string().min(5),
  evidenceUrls: z.array(z.string().url()).optional()
});

export async function vote(req: Request, res: Response) {
  const body = voteSchema.parse(req.body);
  const out = await communityService.submitVote({
    claimId: body.claimId,
    userId: req.user!.id,
    value: body.value as any,
    reasoning: body.reasoning,
    evidenceUrls: body.evidenceUrls
  });
  res.status(201).json({ vote: out });
}

export async function votesForClaim(req: Request, res: Response) {
  const claimId = typeof req.params.claimId === "string" ? req.params.claimId : req.params.claimId[0];
  const votes = await communityService.getVotesForClaim(claimId);
  res.json({ votes });
}

