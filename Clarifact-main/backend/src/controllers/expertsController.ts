import type { Request, Response } from "express";
import { z } from "zod";
import * as expertsService from "../services/expertsService";

const applySchema = z.object({
  category: z.string().min(1),
  institutionEmail: z.string().optional().or(z.literal('')),
  profileUrl: z.string().optional().or(z.literal('')),
  expertiseStatement: z.string().min(1),
  proofLinks: z.array(z.string()).optional()
});

export async function apply(req: Request, res: Response) {
  const body = applySchema.parse(req.body);
  const app = await expertsService.applyExpert({
    userId: req.user!.id,
    category: body.category,
    institutionEmail: body.institutionEmail,
    profileUrl: body.profileUrl,
    expertiseStatement: body.expertiseStatement,
    proofLinks: body.proofLinks
  });
  res.status(201).json({ application: app });
}

export async function me(req: Request, res: Response) {
  const app = await expertsService.getMyExpertApplication(req.user!.id);
  res.json({ application: app });
}

