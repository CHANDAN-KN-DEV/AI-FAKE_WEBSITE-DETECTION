import type { Request, Response } from "express";
import { prisma } from "../config/prisma";

export async function history(_req: Request, res: Response) {
  const items = await prisma.featuredClaim.findMany({
    orderBy: { featuredAt: "desc" },
    take: 50,
    include: { claim: true }
  });
  res.json({ items });
}

export async function detail(req: Request, res: Response) {
  const item = await prisma.featuredClaim.findUnique({
    where: { id: typeof req.params.id === "string" ? req.params.id : req.params.id[0] },
    include: { claim: true }
  });
  res.json({ item });
}

