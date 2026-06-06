import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware";
import * as i18nController from "../controllers/i18nController";

export const i18nRouter = Router();

i18nRouter.post("/translate", requireAuth, i18nController.translate);
i18nRouter.post("/transcribe", requireAuth, i18nController.transcribe);

