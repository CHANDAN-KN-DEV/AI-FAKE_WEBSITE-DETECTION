import { prisma } from "../config/prisma";
import { HttpError } from "../middleware/errorMiddleware";
import type { TriageLabel, PostStatus } from "@prisma/client";
import { ProviderRegistry } from "../providers";

const registry = new ProviderRegistry();

// ─── Triage prompt (custom, not part of PromptTask) ───

function buildTriagePrompt(title: string, content: string, category?: string): string {
  return [
    "You are an expert news triage AI for a community fact-checking platform called Clarifact.",
    "Your job is to evaluate a community post and decide its priority level.",
    "",
    "Evaluate the following community post and return a JSON response.",
    "",
    "SCORING (each 0-10):",
    "- importanceScore: How important is this information? (10 = critical public safety, 0 = trivial)",
    "- urgencyScore: How time-sensitive is this? (10 = needs immediate action, 0 = can wait)",
    "- intensityScore: How emotionally charged or potentially inflammatory? (10 = extremely, 0 = neutral)",
    "- credibilityScore: How credible does this appear? (0.0 to 1.0, where 1.0 = very credible)",
    "- ambiguityScore: How vague or unclear is the post? (0.0 to 1.0, where 1.0 = very ambiguous)",
    "",
    "TRIAGE LABELS (pick one):",
    "- send_to_authority: ONLY if truly important (importance ≥ 7), urgent (urgency ≥ 6), or poses public safety risk. This should be RARE — only genuinely critical posts.",
    "- ai_comment_only: Post is clear and not critical enough for authority. AI can comment with a verdict.",
    "- needs_more_context: Post is too vague or ambiguous (ambiguity > 0.6). Ask for clarification.",
    "- duplicate: Post appears to repeat known/viral information already widely covered.",
    "- low_priority: Post is trivial, off-topic, or not newsworthy.",
    "",
    "CRITICAL RULES:",
    "1. Do NOT label unclear content as 'misleading'. If unsure, use 'needs_more_context'.",
    "2. Only 'send_to_authority' if the post is GENUINELY high-impact. Authority workload must stay low.",
    "3. Provide a clear, specific reason for your label decision.",
    "4. Generate an AI comment that is informative and helpful (2-3 sentences).",
    "5. If the post is about a sensitive political or public safety issue, be extra careful with scoring.",
    "",
    "Return ONLY valid JSON with this shape:",
    '{ "importanceScore": 0, "urgencyScore": 0, "intensityScore": 0, "credibilityScore": 0.0, "ambiguityScore": 0.0, "triageLabel": "ai_comment_only", "reason": "...", "aiComment": "..." }',
    "",
    `POST TITLE: ${title}`,
    `POST CONTENT: ${content}`,
    category ? `CATEGORY: ${category}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export interface TriageResult {
  importanceScore: number;
  urgencyScore: number;
  intensityScore: number;
  credibilityScore: number;
  ambiguityScore: number;
  triageLabel: TriageLabel;
  reason: string;
  aiComment: string;
}

function parseTriageResult(raw: any): TriageResult {
  const validLabels: TriageLabel[] = [
    "send_to_authority",
    "ai_comment_only",
    "needs_more_context",
    "duplicate",
    "low_priority",
  ];

  const label = validLabels.includes(raw?.triageLabel)
    ? raw.triageLabel
    : "ai_comment_only";

  return {
    importanceScore: Math.min(10, Math.max(0, Number(raw?.importanceScore) || 0)),
    urgencyScore: Math.min(10, Math.max(0, Number(raw?.urgencyScore) || 0)),
    intensityScore: Math.min(10, Math.max(0, Number(raw?.intensityScore) || 0)),
    credibilityScore: Math.min(1, Math.max(0, Number(raw?.credibilityScore) || 0)),
    ambiguityScore: Math.min(1, Math.max(0, Number(raw?.ambiguityScore) || 0)),
    triageLabel: label,
    reason: raw?.reason || "Post evaluated by AI triage system.",
    aiComment: raw?.aiComment || "This post has been reviewed by AI.",
  };
}

// ─── Create a community post ───

export async function createCommunityPost(data: {
  userId: string;
  title: string;
  content: string;
  category?: string;
  mediaUrl?: string;
  mediaType?: string;
}) {
  const post = await prisma.communityPost.create({
    data: {
      userId: data.userId,
      title: data.title,
      content: data.content,
      category: data.category,
      mediaUrl: data.mediaUrl,
      mediaType: data.mediaType,
      status: "pending_triage",
    },
    include: {
      user: {
        select: { id: true, email: true, role: true, profile: true },
      },
    },
  });

  return post;
}

// ─── Run AI Triage on a post ───

export async function triagePost(postId: string): Promise<TriageResult> {
  const post = await prisma.communityPost.findUnique({ where: { id: postId } });
  if (!post) throw new HttpError(404, "Post not found");

  const prompt = buildTriagePrompt(post.title, post.content, post.category ?? undefined);

  // Use the provider registry directly — call OpenRouter/Grok for text reasoning
  let triageResult: TriageResult;

  try {
    const result = await registry.callWithFallback({
      task: "claim-extraction", // We reuse the text task but with custom prompt
      prompt,
      input: { text: `${post.title}\n\n${post.content}` },
    });

    const raw = result.json as any;
    // Handle nested results from fallback wrapping
    const parsed = raw?.result ? raw.result : raw;
    triageResult = parseTriageResult(parsed);
  } catch (err) {
    console.error("[Triage] AI triage failed, using conservative defaults:", err);
    triageResult = {
      importanceScore: 3,
      urgencyScore: 2,
      intensityScore: 3,
      credibilityScore: 0.5,
      ambiguityScore: 0.5,
      triageLabel: "ai_comment_only",
      reason: "AI triage service temporarily unavailable. Defaulting to community review.",
      aiComment: "This post has been received and will be reviewed. Thank you for sharing.",
    };
  }

  // Determine status based on triage label
  let status: PostStatus;
  let sentToAuthority = false;

  switch (triageResult.triageLabel) {
    case "send_to_authority":
      status = "sent_to_authority";
      sentToAuthority = true;
      break;
    case "needs_more_context":
      status = "needs_context";
      break;
    case "ai_comment_only":
    case "duplicate":
    case "low_priority":
    default:
      status = "ai_commented";
      break;
  }

  // Update the post with triage results
  await prisma.communityPost.update({
    where: { id: postId },
    data: {
      importanceScore: triageResult.importanceScore,
      urgencyScore: triageResult.urgencyScore,
      intensityScore: triageResult.intensityScore,
      credibilityScore: triageResult.credibilityScore,
      ambiguityScore: triageResult.ambiguityScore,
      triageLabel: triageResult.triageLabel,
      triageReason: triageResult.reason,
      status,
      sentToAuthority,
    },
  });

  // Create AI comment on the post
  await prisma.communityPostComment.create({
    data: {
      postId,
      isAI: true,
      content: triageResult.aiComment,
      commentType:
        triageResult.triageLabel === "send_to_authority"
          ? "authority_referral"
          : triageResult.triageLabel === "needs_more_context"
          ? "clarification_request"
          : "verdict",
    },
  });

  return triageResult;
}

// ─── Get all community posts (with optional filters) ───

export async function getCommunityPosts(opts?: {
  status?: PostStatus;
  triageLabel?: TriageLabel;
  userId?: string;
  limit?: number;
  offset?: number;
}) {
  const where: any = {};
  if (opts?.status) where.status = opts.status;
  if (opts?.triageLabel) where.triageLabel = opts.triageLabel;
  if (opts?.userId) where.userId = opts.userId;

  return prisma.communityPost.findMany({
    where,
    include: {
      user: {
        select: { id: true, email: true, role: true, profile: true },
      },
      comments: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
    take: opts?.limit ?? 50,
    skip: opts?.offset ?? 0,
  });
}

// ─── Get single post by ID ───

export async function getCommunityPostById(postId: string) {
  const post = await prisma.communityPost.findUnique({
    where: { id: postId },
    include: {
      user: {
        select: { id: true, email: true, role: true, profile: true },
      },
      comments: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!post) throw new HttpError(404, "Post not found");
  return post;
}

// ─── Get authority queue (only sent_to_authority posts) ───

export async function getAuthorityQueue(limit = 50, offset = 0) {
  return prisma.communityPost.findMany({
    where: {
      sentToAuthority: true,
      status: { in: ["sent_to_authority"] },
    },
    include: {
      user: {
        select: { id: true, email: true, role: true, profile: true },
      },
      comments: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: [
      { urgencyScore: "desc" },
      { importanceScore: "desc" },
      { createdAt: "desc" },
    ],
    take: limit,
    skip: offset,
  });
}

// ─── Authority verdict on a post ───

export async function submitAuthorityVerdict(data: {
  postId: string;
  authorityUserId: string;
  verdict: string;
  note?: string;
}) {
  const post = await prisma.communityPost.findUnique({ where: { id: data.postId } });
  if (!post) throw new HttpError(404, "Post not found");
  if (!post.sentToAuthority)
    throw new HttpError(400, "This post was not sent to authority");

  const updated = await prisma.communityPost.update({
    where: { id: data.postId },
    data: {
      authorityUserId: data.authorityUserId,
      authorityVerdict: data.verdict,
      authorityNote: data.note,
      authorityAt: new Date(),
      status:
        data.verdict === "approved"
          ? "authority_approved"
          : "authority_rejected",
    },
    include: {
      user: {
        select: { id: true, email: true, role: true, profile: true },
      },
      comments: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  // Add authority comment
  await prisma.communityPostComment.create({
    data: {
      postId: data.postId,
      authorId: data.authorityUserId,
      isAI: false,
      content: data.note || `Authority ${data.verdict} this post.`,
      commentType: "authority_verdict",
    },
  });

  return updated;
}

// ─── Get authority-completed posts ───

export async function getAuthorityCompletedPosts(limit = 50) {
  return prisma.communityPost.findMany({
    where: {
      sentToAuthority: true,
      status: { in: ["authority_approved", "authority_rejected"] },
    },
    include: {
      user: {
        select: { id: true, email: true, role: true, profile: true },
      },
      comments: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { authorityAt: "desc" },
    take: limit,
  });
}
