import type { Request, Response } from "express";
import * as consensusService from "../services/consensusService";
import { HttpError } from "../middleware/errorMiddleware";

export async function recalculate(req: Request, res: Response) {
  const claimId = typeof req.params.claimId === "string" ? req.params.claimId : req.params.claimId[0];
  const consensus = await consensusService.recalculateConsensus(claimId);
  res.json({ consensus });
}

export async function get(req: Request, res: Response) {
  const claimId = typeof req.params.claimId === "string" ? req.params.claimId : req.params.claimId[0];
  try {
    const consensus = await consensusService.getConsensus(claimId);
    res.json({ consensus });
  } catch (err) {
    // Return null instead of 404 so frontend polling doesn't generate console errors
    // while the AI pipeline is still running
    if (err instanceof HttpError && err.status === 404) {
      return res.json({ consensus: null });
    }
    throw err;
  }
}

