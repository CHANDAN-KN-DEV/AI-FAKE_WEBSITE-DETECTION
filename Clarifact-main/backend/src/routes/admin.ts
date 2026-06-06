import { Router } from "express";
import * as adminController from "../controllers/adminController";
import { requireAuth, requireRole } from "../middleware/authMiddleware";

export const adminRouter = Router();

adminRouter.get("/expert-applications", requireAuth, requireRole(["admin"]), adminController.listExpertApplications);
adminRouter.post("/experts/:id/approve", requireAuth, requireRole(["admin"]), adminController.approveExpert);
adminRouter.post("/experts/:id/reject", requireAuth, requireRole(["admin"]), adminController.rejectExpert);
adminRouter.post("/experts/:id/suspend", requireAuth, requireRole(["admin"]), adminController.suspendExpert);

adminRouter.post("/featured/refresh", requireAuth, requireRole(["admin"]), adminController.refreshFeatured);

