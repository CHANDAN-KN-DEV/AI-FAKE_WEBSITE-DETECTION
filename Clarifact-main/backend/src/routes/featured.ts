import { Router } from "express";
import * as featuredController from "../controllers/featuredController";
import { requireAuth } from "../middleware/authMiddleware";

export const featuredRouter = Router();

featuredRouter.get("/history", requireAuth, featuredController.history);
featuredRouter.get("/:id", requireAuth, featuredController.detail);

