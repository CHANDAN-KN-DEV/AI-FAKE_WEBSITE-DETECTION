import type { Request, Response } from "express";
import { z } from "zod";
import * as aiService from "../services/aiService";
import type { PromptTask } from "../providers";

const claimIdSchema = z.object({ claimId: z.string().uuid() });

export async function extractClaims(req: Request, res: Response) {
  const { claimId } = claimIdSchema.parse(req.body);
  const result = await aiService.extractClaims(claimId);
  res.json({ result });
}

export async function analyzeImage(req: Request, res: Response) {
  const { claimId, imageBase64, imageMimeType } = z.object({
    claimId: z.string().uuid(),
    imageBase64: z.string().optional(),
    imageMimeType: z.string().optional(),
  }).parse(req.body);
  const result = await aiService.analyzeImageClaim(claimId, { imageBase64, imageMimeType });
  res.json({ result });
}

export async function emotionalManipulation(req: Request, res: Response) {
  const { claimId } = claimIdSchema.parse(req.body);
  const result = await aiService.emotionalManipulation(claimId);
  res.json(result);
}

export async function sourceScore(req: Request, res: Response) {
  const { claimId } = claimIdSchema.parse(req.body);
  const result = await aiService.sourceCredibility(claimId);
  res.json({ result });
}

const compareSchema = z.object({
  task: z.enum(["claim-extraction", "emotional-manipulation-analysis", "source-credibility", "final-verdict-summary"]),
  text: z.string().optional(),
  url: z.string().url().optional()
});

export async function providerCompare(req: Request, res: Response) {
  const body = compareSchema.parse(req.body);
  const results = await aiService.providerCompare(body.task as PromptTask, { text: body.text, url: body.url });
  res.json({ results });
}

const analyzeTextSchema = z.object({ text: z.string().min(1) });
export async function analyzeText(req: Request, res: Response) {
  const { text } = analyzeTextSchema.parse(req.body);
  const result = await aiService.analyzeTextDirect(text);
  res.json({ result });
}

const analyzeUrlSchema = z.object({ url: z.string().url() });
export async function analyzeUrl(req: Request, res: Response) {
  const { url } = analyzeUrlSchema.parse(req.body);
  const result = await aiService.analyzeUrlDirect(url);
  res.json({ result });
}

export async function analyzeMedia(req: Request, res: Response) {
  const body = z.object({
    mediaUrl: z.string().url(),
    mediaType: z.enum(["image", "video"]).optional(),
    context: z.string().optional()
  }).parse(req.body);
  const prompt = [
    `Analyze this ${body.mediaType ?? "media"} reference for potential misinformation signals.`,
    `Media URL: ${body.mediaUrl}`,
    body.context ? `Context: ${body.context}` : undefined
  ]
    .filter(Boolean)
    .join("\n");

  const result = await aiService.analyzeTextDirect(prompt);
  res.json({ result });
}

export async function analyzeInstagram(req: Request, res: Response) {
  const { claimId } = claimIdSchema.parse(req.body);
  const result = await aiService.analyzeInstagramClaim(claimId);
  res.json({ result });
}

export async function analyzeVideo(req: Request, res: Response) {
  const { claimId, sourceUrl } = z.object({
    claimId: z.string().uuid(),
    sourceUrl: z.string().url().optional(),
  }).parse(req.body);
  const result = await aiService.analyzeVideoClaim(claimId, { sourceUrl });
  res.json({ result });
}
