import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { HttpError } from "../middleware/errorMiddleware";
import type { Role } from "@prisma/client";

export type JwtPayload = { sub: string; role: Role };

export function signJwt(user: { id: string; role: Role }) {
  const payload: JwtPayload = { sub: user.id, role: user.role };
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "7d" });
}

export function verifyJwt(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

export async function register(params: { email: string; password: string }) {
  const email = params.email.trim().toLowerCase();
  if (!email.includes("@")) throw new HttpError(400, "Invalid email");
  if (params.password.length < 8) throw new HttpError(400, "Password must be at least 8 chars");

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new HttpError(409, "Email already registered");

  const passwordHash = await bcrypt.hash(params.password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash, role: "user" }
  });
  const token = signJwt(user);
  return { user: { id: user.id, email: user.email, role: user.role }, token };
}

export async function login(params: { email: string; password: string }) {
  const email = params.email.trim().toLowerCase();

  // SPECIAL ADMIN LOGIN
  if ((email === "admin" || email === "admin@clarifact.local") && params.password === "050502") {
    let adminUser = await prisma.user.findUnique({ where: { email: "admin@clarifact.local" } });
    if (!adminUser) {
      const passwordHash = await bcrypt.hash("050502", 10);
      adminUser = await prisma.user.create({
        data: {
          email: "admin@clarifact.local",
          passwordHash,
          role: "admin",
          isActive: true
        }
      });
    } else if (adminUser.role !== "admin") {
      // Fix: Ensure the admin user stays an admin permanently
      adminUser = await prisma.user.update({
        where: { id: adminUser.id },
        data: { role: "admin" }
      });
    }
    const token = signJwt(adminUser);
    return { user: { id: adminUser.id, email: "admin", role: adminUser.role }, token };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new HttpError(401, "Invalid credentials");
  if (!user.isActive) throw new HttpError(403, "User is inactive");

  const trimmedPassword = params.password.trim();
  
  const hashes = user.passwordHash.split("||");
  const currentHash = hashes[0];
  const pendingHash = hashes[1];

  let ok = false;
  let finalUser = user;

  if (pendingHash && await bcrypt.compare(trimmedPassword, pendingHash)) {
    // Logged in with the NEW authority password!
    ok = true;
    finalUser = await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: pendingHash, role: "expert" }
    });
  } else if (await bcrypt.compare(trimmedPassword, currentHash)) {
    // Logged in with the OLD password
    ok = true;
  }

  if (!ok) throw new HttpError(401, "Invalid credentials");

  const token = signJwt(finalUser);
  return { user: { id: finalUser.id, email: finalUser.email, role: finalUser.role }, token };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      trustScores: { orderBy: { createdAt: "desc" }, take: 1 },
      badges: { include: { badge: true }, orderBy: { awardedAt: "desc" } },
      _count: { select: { claims: true } }
    }
  });
  if (!user) throw new HttpError(404, "User not found");
  return user;
}

