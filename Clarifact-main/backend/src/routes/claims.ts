import { Router } from "express";
import * as claimsController from "../controllers/claimsController";
import { requireAuth } from "../middleware/authMiddleware";

export const claimsRouter = Router();

claimsRouter.post("/submit", requireAuth, claimsController.submit);
claimsRouter.get("/history", requireAuth, claimsController.history);
claimsRouter.get("/:id", requireAuth, claimsController.detail);

