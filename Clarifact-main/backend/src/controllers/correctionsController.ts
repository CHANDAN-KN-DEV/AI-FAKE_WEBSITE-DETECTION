import type { Request, Response } from "express";
import { z } from "zod";
import * as correctionsService from "../services/correctionsService";
import { HttpError } from "../middleware/errorMiddleware";

export async function get(req: Request, res: Response) {
  const claimId = typeof req.params.claimId === "string" ? req.params.claimId : req.params.claimId[0];
  try {
    const correction = await correctionsService.getCorrection(claimId);
    res.json({ correction });
  } catch (err) {
    // Return null instead of 404 so frontend polling doesn't generate console errors
    // while the AI pipeline is still running
    if (err instanceof HttpError && err.status === 404) {
      return res.json({ correction: null });
    }
    throw err;
  }
}

const generateSchema = z.object({ claimId: z.string().uuid() });

export async function generate(req: Request, res: Response) {
  const { claimId } = generateSchema.parse(req.body);
  const out = await correctionsService.generateCorrection(claimId);
  res.status(201).json(out);
}

