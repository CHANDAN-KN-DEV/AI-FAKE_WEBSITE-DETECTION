import { Router } from "express";
import * as communityController from "../controllers/communityController";
import { requireAuth } from "../middleware/authMiddleware";

export const communityRouter = Router();

communityRouter.post("/vote", requireAuth, communityController.vote);
communityRouter.get("/votes/:claimId", requireAuth, communityController.votesForClaim);

// TODO: leaderboard/report endpoints can be implemented on top of ValidatorProfile/AuditLog.

