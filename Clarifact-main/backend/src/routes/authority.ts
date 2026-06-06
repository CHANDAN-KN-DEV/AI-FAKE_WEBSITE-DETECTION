import { Router } from "express";
import * as authorityController from "../controllers/authorityController";
import { requireAuth, optionalAuth } from "../middleware/authMiddleware";

export const authorityRouter = Router();

authorityRouter.get("/pending", requireAuth, authorityController.getPending);
authorityRouter.get("/completed", optionalAuth, authorityController.getCompleted);
authorityRouter.post("/vote/:claimId", requireAuth, authorityController.vote);
