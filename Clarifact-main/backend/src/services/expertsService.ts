import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma";
import { HttpError } from "../middleware/errorMiddleware";
import type { ExpertApplicationStatus } from "@prisma/client";

export async function applyExpert(params: {
  userId: string;
  category: string;
  institutionEmail?: string;
  profileUrl?: string;
  expertiseStatement: string;
  proofLinks?: string[];
}) {
  if (!params.category.trim()) throw new HttpError(400, "Category is required");
  if (!params.expertiseStatement.trim()) throw new HttpError(400, "Expertise statement is required");

  return prisma.expertApplication.upsert({
    where: { userId: params.userId },
    create: {
      userId: params.userId,
      category: params.category,
      institutionEmail: params.institutionEmail,
      profileUrl: params.profileUrl,
      expertiseStatement: params.expertiseStatement,
      proofLinks: params.proofLinks ?? undefined
    },
    update: {
      category: params.category,
      institutionEmail: params.institutionEmail,
      profileUrl: params.profileUrl,
      expertiseStatement: params.expertiseStatement,
      proofLinks: params.proofLinks ?? undefined,
      status: "pending"
    }
  });
}

export async function getMyExpertApplication(userId: string) {
  const app = await prisma.expertApplication.findUnique({ where: { userId } });
  if (!app) throw new HttpError(404, "No expert application found");
  return app;
}

export async function listExpertApplications(status?: ExpertApplicationStatus) {
  return prisma.expertApplication.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, email: true, role: true } } }
  });
}

export async function moderateExpertApplication(params: {
  applicationId: string;
  moderatorUserId: string;
  action: "approve" | "reject" | "suspend";
  note?: string;
}) {
  const status: ExpertApplicationStatus =
    params.action === "approve" ? "approved" : params.action === "reject" ? "rejected" : "suspended";

  let generatedPassword = null;

  const updated = await prisma.expertApplication.update({
    where: { id: params.applicationId },
    data: {
      status,
      moderatedByUserId: params.moderatorUserId,
      moderationNote: params.note
    },
    include: {
      user: { select: { email: true } }
    }
  });

  if (params.action === "approve") {
    const rawPassword = "AUTH-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    const newPasswordHash = await bcrypt.hash(rawPassword, 10);
    
    const user = await prisma.user.findUnique({ where: { id: updated.userId } });
    if (user) {
      const currentHash = user.passwordHash.split("||")[0];
      await prisma.user.update({ 
        where: { id: updated.userId }, 
        data: { passwordHash: `${currentHash}||${newPasswordHash}` } 
      });
    }
    
    await prisma.alert.create({
      data: {
        userId: updated.userId,
        type: "voteDisputed", // using an existing enum to avoid Prisma EPERM issues
        message: `Your Authority Application was approved! Login as Authority with Password: ${rawPassword}`
      }
    });

    generatedPassword = rawPassword;
  }

  return { ...updated, generatedPassword };
}

