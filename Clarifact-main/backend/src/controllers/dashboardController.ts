import type { Request, Response } from "express";
import {
  listTopPicks
} from "../services/featuredService";
import {
  getTrending,
  getCategories,
  getRegions,
  getAlerts,
  getLeaderboard,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  clearAllNotifications as clearAllNotificationsService
} from "../services/dashboardService";

export async function topPicks(_req: Request, res: Response) {
  const items = await listTopPicks(10);
  res.json({ items });
}

export async function trending(_req: Request, res: Response) {
  const items = await getTrending(10);
  res.json({ items });
}

export async function categories(_req: Request, res: Response) {
  const items = await getCategories();
  res.json({ items });
}

export async function regions(_req: Request, res: Response) {
  const items = await getRegions();
  res.json({ items });
}

export async function alerts(req: Request, res: Response) {
  const items = await getAlerts(req.user!.id);
  res.json({ items });
}

export async function leaderboard(_req: Request, res: Response) {
  const items = await getLeaderboard(10);
  res.json({ items });
}

export async function notifications(req: Request, res: Response) {
  const items = await getNotifications(req.user!.id);
  res.json({ items });
}

export async function markRead(req: Request, res: Response) {
  try {
    const id = typeof req.params.id === "string" ? req.params.id : req.params.id[0];
    const result = await markNotificationRead(req.user!.id, id);
    res.json(result);
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to mark as read' });
  }
}

export async function markAllRead(req: Request, res: Response) {
  try {
    const result = await markAllNotificationsRead(req.user!.id);
    res.json(result);
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to mark all as read' });
  }
}

export async function clearAllNotifications(req: Request, res: Response) {
  try {
    const result = await clearAllNotificationsService(req.user!.id);
    res.json(result);
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to clear notifications' });
  }
}

