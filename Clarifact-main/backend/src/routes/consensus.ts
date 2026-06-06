import { Router } from "express";
import * as consensusController from "../controllers/consensusController";
import { requireAuth } from "../middleware/authMiddleware";

export const consensusRouter = Router();

consensusRouter.post("/recalculate/:claimId", requireAuth, consensusController.recalculate);
consensusRouter.get("/:claimId", requireAuth, consensusController.get);

