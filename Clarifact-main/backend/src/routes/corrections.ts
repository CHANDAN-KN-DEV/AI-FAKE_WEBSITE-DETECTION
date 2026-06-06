import { Router } from "express";
import * as correctionsController from "../controllers/correctionsController";
import { requireAuth } from "../middleware/authMiddleware";

export const correctionsRouter = Router();

correctionsRouter.get("/:claimId", requireAuth, correctionsController.get);
correctionsRouter.post("/generate", requireAuth, correctionsController.generate);

