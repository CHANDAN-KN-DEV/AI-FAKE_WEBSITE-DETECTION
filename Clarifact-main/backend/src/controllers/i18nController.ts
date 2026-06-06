import type { Request, Response } from "express";
import { z } from "zod";
import * as i18nService from "../services/i18nService";

const translateSchema = z.object({
  text: z.string().min(1),
  targetLang: z.enum(["en", "hi", "kn"])
});

export async function translate(req: Request, res: Response) {
  const body = translateSchema.parse(req.body);
  const result = await i18nService.translateText(body.text, body.targetLang);
  res.json(result);
}

const transcribeSchema = z.object({
  audioUrl: z.string().url(),
  targetLang: z.enum(["en", "hi", "kn"]).optional()
});

export async function transcribe(req: Request, res: Response) {
  const body = transcribeSchema.parse(req.body);
  const result = await i18nService.transcribeAudio(body.audioUrl, body.targetLang);
  res.json(result);
}
