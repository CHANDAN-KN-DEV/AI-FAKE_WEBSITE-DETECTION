import { Router } from "express";
import * as aiController from "../controllers/aiController";
import { requireAuth } from "../middleware/authMiddleware";

export const aiRouter = Router();

aiRouter.post("/extract-claims", requireAuth, aiController.extractClaims);
aiRouter.post("/emotional-manipulation", requireAuth, aiController.emotionalManipulation);
aiRouter.post("/source-score", requireAuth, aiController.sourceScore);
aiRouter.post("/provider-compare", requireAuth, aiController.providerCompare);
aiRouter.post("/analyze-image", requireAuth, aiController.analyzeImage);

// Placeholders to satisfy route list; can be expanded to run full pipelines.
aiRouter.post("/analyze-text", requireAuth, aiController.analyzeText);
aiRouter.post("/analyze-url", requireAuth, aiController.analyzeUrl);
aiRouter.post("/analyze-media", requireAuth, aiController.analyzeMedia);
aiRouter.post("/analyze-instagram", requireAuth, aiController.analyzeInstagram);
aiRouter.post("/analyze-video", requireAuth, aiController.analyzeVideo);

