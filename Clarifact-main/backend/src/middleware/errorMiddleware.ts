import type { NextFunction, Request, Response } from "express";

export class HttpError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: "Not Found", path: req.path });
}

import { ZodError } from "zod";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    const zodErr = err as any;
    console.error("Zod Validation Error:", JSON.stringify(zodErr.errors, null, 2));
    res.status(400).json({ error: "Validation Error", details: zodErr.errors });
    return;
  }
  const status = err instanceof HttpError ? err.status : 500;
  const message = err instanceof Error ? err.message : "Internal Server Error";
  const details = err instanceof HttpError ? err.details : undefined;
  res.status(status).json({ error: message, details });
}

