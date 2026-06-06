import { Router } from "express";
import * as expertsController from "../controllers/expertsController";
import { requireAuth } from "../middleware/authMiddleware";

export const expertsRouter = Router();

expertsRouter.post("/apply", requireAuth, expertsController.apply);
expertsRouter.get("/me", requireAuth, expertsController.me);

