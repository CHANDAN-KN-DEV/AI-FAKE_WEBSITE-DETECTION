import { Router } from "express";
import * as dashboardController from "../controllers/dashboardController";
import { requireAuth } from "../middleware/authMiddleware";

export const dashboardRouter = Router();

dashboardRouter.get("/top-picks", requireAuth, dashboardController.topPicks);
dashboardRouter.get("/trending", requireAuth, dashboardController.trending);
dashboardRouter.get("/categories", requireAuth, dashboardController.categories);
dashboardRouter.get("/regions", requireAuth, dashboardController.regions);
dashboardRouter.get("/alerts", requireAuth, dashboardController.alerts);
dashboardRouter.get("/leaderboard", requireAuth, dashboardController.leaderboard);
dashboardRouter.get("/notifications", requireAuth, dashboardController.notifications);
dashboardRouter.patch("/notifications/read-all", requireAuth, dashboardController.markAllRead);
dashboardRouter.patch("/notifications/:id/read", requireAuth, dashboardController.markRead);
dashboardRouter.delete("/notifications/clear-all", requireAuth, dashboardController.clearAllNotifications);

