import type { NextFunction, Request, Response } from "express";
import { HttpError } from "./errorMiddleware";
import { verifyJwt } from "../services/authService";
import type { Role } from "@prisma/client";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
  if (!token) return next(new HttpError(401, "Missing Authorization header"));

  try {
    const payload = verifyJwt(token);
    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch {
    return next(new HttpError(401, "Invalid token"));
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
  if (!token) return next();

  try {
    const payload = verifyJwt(token);
    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch {
    return next();
  }
}

export function requireRole(roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new HttpError(401, "Unauthorized"));
    if (!roles.includes(req.user.role)) return next(new HttpError(403, "Forbidden"));
    return next();
  };
}

