import type { Request, Response, NextFunction } from "express";
import * as communityPostService from "../services/communityPostService";
import { HttpError } from "../middleware/errorMiddleware";

// ─── Create a community post + trigger AI triage ───
export async function createPost(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { title, content, category, mediaUrl, mediaType } = req.body;

    if (!title || !content) {
      return next(new HttpError(400, "Title and content are required"));
    }

    // 1. Create the post
    const post = await communityPostService.createCommunityPost({
      userId,
      title,
      content,
      category,
      mediaUrl,
      mediaType,
    });

    // 2. Run AI triage (non-blocking to return post immediately, then update)
    const triagePromise = communityPostService.triagePost(post.id);

    // Return the post immediately with pending_triage status
    res.status(201).json({ post });

    // Await triage in the background (will update DB)
    await triagePromise.catch((err) => {
      console.error("[CommunityPost] Triage failed for post:", post.id, err);
    });
  } catch (err) {
    next(err);
  }
}

// ─── Get all community posts ───
export async function listPosts(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, triageLabel, userId, limit, offset } = req.query;
    const posts = await communityPostService.getCommunityPosts({
      status: status as any,
      triageLabel: triageLabel as any,
      userId: userId as string,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
    res.json({ posts });
  } catch (err) {
    next(err);
  }
}

// ─── Get single post ───
export async function getPost(req: Request, res: Response, next: NextFunction) {
  try {
    const post = await communityPostService.getCommunityPostById(req.params.postId as string);
    res.json({ post });
  } catch (err) {
    next(err);
  }
}

// ─── Get post with real-time triage status ───
export async function getPostStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const post = await communityPostService.getCommunityPostById(req.params.postId as string);
    res.json({
      postId: post.id,
      status: post.status,
      triageLabel: post.triageLabel,
      importanceScore: post.importanceScore,
      urgencyScore: post.urgencyScore,
      intensityScore: post.intensityScore,
      credibilityScore: post.credibilityScore,
      ambiguityScore: post.ambiguityScore,
      reason: post.triageReason,
      sentToAuthority: post.sentToAuthority,
      aiComment: post.comments.find((c) => c.isAI)?.content || null,
    });
  } catch (err) {
    next(err);
  }
}

// ─── Authority queue ───
export async function authorityQueue(req: Request, res: Response, next: NextFunction) {
  try {
    const userRole = req.user!.role;
    if (userRole !== "admin" && userRole !== "expert") {
      return next(new HttpError(403, "Only authority users can access this"));
    }

    const { limit, offset } = req.query;
    const posts = await communityPostService.getAuthorityQueue(
      limit ? Number(limit) : undefined,
      offset ? Number(offset) : undefined
    );
    res.json({ posts });
  } catch (err) {
    next(err);
  }
}

// ─── Authority verdict ───
export async function authorityVerdict(req: Request, res: Response, next: NextFunction) {
  try {
    const userRole = req.user!.role;
    if (userRole !== "admin" && userRole !== "expert") {
      return next(new HttpError(403, "Only authority users can submit verdicts"));
    }

    const postId = req.params.postId as string;
    const { verdict, note } = req.body;

    if (!verdict || !["approved", "rejected"].includes(verdict)) {
      return next(new HttpError(400, "Verdict must be 'approved' or 'rejected'"));
    }

    const post = await communityPostService.submitAuthorityVerdict({
      postId,
      authorityUserId: req.user!.id,
      verdict,
      note,
    });

    res.json({ post });
  } catch (err) {
    next(err);
  }
}

// ─── Authority completed posts ───
export async function authorityCompleted(req: Request, res: Response, next: NextFunction) {
  try {
    const userRole = req.user!.role;
    if (userRole !== "admin" && userRole !== "expert") {
      return next(new HttpError(403, "Only authority users can access this"));
    }

    const posts = await communityPostService.getAuthorityCompletedPosts();
    res.json({ posts });
  } catch (err) {
    next(err);
  }
}
