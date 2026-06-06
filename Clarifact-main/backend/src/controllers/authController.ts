import type { Request, Response } from "express";
import { z } from "zod";
import * as authService from "../services/authService";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const loginSchema = z.object({
  email: z.string(),
  password: z.string()
});

export async function register(req: Request, res: Response) {
  const body = registerSchema.parse(req.body);
  const out = await authService.register(body);
  res.status(201).json(out);
}

export async function login(req: Request, res: Response) {
  const body = loginSchema.parse(req.body);
  const out = await authService.login(body);
  res.json(out);
}

export async function me(req: Request, res: Response) {
  const userId = req.user!.id;
  const user = await authService.getMe(userId);
  res.json({ user });
}

export async function logout(_req: Request, res: Response) {
  // JWT is stateless in this initial build; sessions table supports revocation later.
  res.json({ ok: true });
}

