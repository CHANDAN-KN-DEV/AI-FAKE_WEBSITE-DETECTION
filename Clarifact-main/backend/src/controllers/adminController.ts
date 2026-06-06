import type { Request, Response } from "express";
import { z } from "zod";
import * as expertsService from "../services/expertsService";
import { runFeaturedTrackerOnce } from "../jobs/featuredTracker";
import { asString } from "../utils/http";

export async function listExpertApplications(req: Request, res: Response) {
  const status = asString(req.query.status as any) as any;
  const apps = await expertsService.listExpertApplications(status);
  res.json({ applications: apps });
}

const moderateSchema = z.object({
  note: z.string().optional()
});

export async function approveExpert(req: Request, res: Response) {
  const body = moderateSchema.parse(req.body);
  const updated = await expertsService.moderateExpertApplication({
    applicationId: asString(req.params.id as any)!,
    moderatorUserId: req.user!.id,
    action: "approve",
    note: body.note
  });
  res.json({ application: updated });
}

export async function rejectExpert(req: Request, res: Response) {
  const body = moderateSchema.parse(req.body);
  const updated = await expertsService.moderateExpertApplication({
    applicationId: asString(req.params.id as any)!,
    moderatorUserId: req.user!.id,
    action: "reject",
    note: body.note
  });
  res.json({ application: updated });
}

export async function suspendExpert(req: Request, res: Response) {
  const body = moderateSchema.parse(req.body);
  const updated = await expertsService.moderateExpertApplication({
    applicationId: asString(req.params.id as any)!,
    moderatorUserId: req.user!.id,
    action: "suspend",
    note: body.note
  });
  res.json({ application: updated });
}

export async function refreshFeatured(_req: Request, res: Response) {
  const out = await runFeaturedTrackerOnce();
  res.json({ ok: true, ...out });
}

