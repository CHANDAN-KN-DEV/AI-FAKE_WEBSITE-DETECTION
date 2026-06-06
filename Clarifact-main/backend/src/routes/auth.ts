import { Router } from "express";
import * as authController from "../controllers/authController";
import { requireAuth } from "../middleware/authMiddleware";

export const authRouter = Router();

authRouter.post("/register", authController.register);
authRouter.post("/login", authController.login);
authRouter.get("/me", requireAuth, authController.me);
authRouter.post("/logout", requireAuth, authController.logout);

