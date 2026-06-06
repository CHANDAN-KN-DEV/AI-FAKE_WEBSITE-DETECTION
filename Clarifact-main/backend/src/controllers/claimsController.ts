import type { Request, Response } from "express";
import { z } from "zod";
import * as claimsService from "../services/claimsService";

const submitSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  contentType: z.enum(["text", "url", "whatsapp", "image", "video", "voice"]),
  text: z.string().min(1).optional(),
  url: z.string().url().optional(),
  metadata: z.record(z.string(), z.any()).optional()
});

export async function submit(req: Request, res: Response) {
  const body = submitSchema.parse(req.body);
  const claim = await claimsService.submitClaim({
    userId: req.user!.id,
    title: body.title,
    contentType: body.contentType as any,
    text: body.text,
    url: body.url,
    metadata: body.metadata
  });
  res.status(201).json({ claim });
}

export async function detail(req: Request, res: Response) {
  const claim = await claimsService.getClaimById(typeof req.params.id === "string" ? req.params.id : req.params.id[0]);
  res.json({ claim });
}

export async function history(req: Request, res: Response) {
  const limit = req.query.limit ? Number(req.query.limit) : 20;
  const claims = await claimsService.getClaimHistory(req.user!.id, Number.isFinite(limit) ? limit : 20);
  res.json({ claims });
}

