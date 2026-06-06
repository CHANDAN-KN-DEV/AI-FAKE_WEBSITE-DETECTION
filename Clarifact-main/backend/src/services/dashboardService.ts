import { prisma } from "../config/prisma";

export async function getTrending(limit = 10) {
  return prisma.claim.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, title: true, status: true, createdAt: true }
  });
}

export async function getCategories() {
  return prisma.categoryStat.findMany({ orderBy: { day: "desc" }, take: 30 });
}

export async function getRegions() {
  return prisma.regionStat.findMany({ orderBy: { day: "desc" }, take: 30 });
}

export async function getAlerts(userId: string) {
  return prisma.alert.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20
  });
}

export async function getLeaderboard(limit = 10) {
  const scores = await prisma.trustScore.findMany({
    orderBy: [{ score: "desc" }, { createdAt: "desc" }],
    take: limit,
    include: { user: { include: { profile: true } } }
  });

  return await Promise.all(
    scores.map(async (score, index) => {
      const claimsVerified = await prisma.claim.count({ where: { userId: score.userId } });
      return {
        rank: index + 1,
        user: {
          id: score.user.id,
          name: score.user.profile?.name || score.user.email.split("@")[0] || "User",
          role: score.user.role,
          avatar: undefined
        },
        score: Math.round(score.score * 100),
        claimsVerified,
        accuracy: Math.round(score.score * 100)
      };
    })
  );
}

export async function getNotifications(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  let adminNotifs: any[] = [];
  if (user?.role === "admin") {
    const pendingExperts = await prisma.expertApplication.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "desc" },
      take: 20
    });
    adminNotifs = pendingExperts.map(app => ({
      id: "admin-app-" + app.id,
      title: "New Authority Application",
      message: `A new application from ${app.category} needs review.`,
      type: "info",
      timestamp: app.createdAt.toISOString(),
      read: false,
      link: "/admin/review"
    }));
  }

  const alerts = await prisma.alert.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { claim: true }
  });

  const regularNotifs = alerts.map((alert) => ({
    id: alert.id,
    title: alert.type === "claimBecameFalse"
      ? "Claim marked false"
      : alert.type === "claimBecameMisleading"
      ? "Claim marked misleading"
      : alert.type === "voteDisputed"
      ? "Vote disputed"
      : "Notification",
    message: alert.message,
    type: alert.type === "claimBecameFalse" ? "error"
      : alert.type === "claimBecameMisleading" ? "warning"
      : "info",
    timestamp: alert.createdAt.toISOString(),
    read: Boolean(alert.readAt),
    link: alert.claimId ? `/result/${alert.claimId}` : undefined
  }));

  const all = [...adminNotifs, ...regularNotifs];
  all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return all.slice(0, 20);
}

export async function markNotificationRead(userId: string, notifId: string) {
  // Admin-generated notifications (prefixed with "admin-app-") are virtual; skip DB update
  if (notifId.startsWith("admin-app-")) return { success: true };

  const alert = await prisma.alert.findFirst({
    where: { id: notifId, userId },
  });
  if (!alert) return { success: false, error: "Not found" };

  await prisma.alert.update({
    where: { id: notifId },
    data: { readAt: new Date() },
  });
  return { success: true };
}

export async function markAllNotificationsRead(userId: string) {
  await prisma.alert.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
  return { success: true };
}

export async function clearAllNotifications(userId: string) {
  await prisma.alert.deleteMany({
    where: { userId },
  });
  return { success: true };
}

