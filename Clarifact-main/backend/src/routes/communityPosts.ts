import { Router } from "express";
import * as communityPostController from "../controllers/communityPostController";
import { requireAuth } from "../middleware/authMiddleware";

export const communityPostsRouter = Router();

// Public-ish (auth required) endpoints
communityPostsRouter.post("/create", requireAuth, communityPostController.createPost);
communityPostsRouter.get("/list", requireAuth, communityPostController.listPosts);
communityPostsRouter.get("/post/:postId", requireAuth, communityPostController.getPost);
communityPostsRouter.get("/post/:postId/status", requireAuth, communityPostController.getPostStatus);

// Authority-only endpoints
communityPostsRouter.get("/authority/queue", requireAuth, communityPostController.authorityQueue);
communityPostsRouter.post("/authority/verdict/:postId", requireAuth, communityPostController.authorityVerdict);
communityPostsRouter.get("/authority/completed", requireAuth, communityPostController.authorityCompleted);
