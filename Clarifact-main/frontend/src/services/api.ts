import axios from 'axios';
import type {
  ClaimResult, TopPick, CategoryStat, RegionInsight,
  Alert, LeaderboardEntry, Notification, ReviewItem,
} from '@/types';

// ─── Axios instance ───
// In dev, Vite proxy forwards /api → http://localhost:4000
// In prod, set VITE_API_URL to the backend URL
const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor: attach JWT ───
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('clarifact-token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Response interceptor: handle 401 globally ───
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear session
      localStorage.removeItem('clarifact-token');
      // Only redirect if not already on login/register
      const path = window.location.pathname;
      if (path !== '/login' && path !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);


// ════════════════════════════════════════
//  AUTH  — POST /api/auth/*
// ════════════════════════════════════════

export async function loginUser(email: string, password: string) {
  const res = await api.post('/auth/login', { email, password });
  return res.data; // { token, user }
}

export async function registerUser(email: string, password: string) {
  const res = await api.post('/auth/register', { email, password });
  return res.data; // { token, user }
}

export async function getMe() {
  const res = await api.get('/auth/me');
  return res.data; // { user }
}

export async function logoutUser() {
  await api.post('/auth/logout');
}

// ════════════════════════════════════════
//  CLAIMS  — /api/claims/*
// ════════════════════════════════════════

export async function submitClaim(data: {
  contentType: string;
  text?: string;
  url?: string;
  title?: string;
}) {
  const res = await api.post('/claims/submit', data);
  return res.data; // { claim }
}

export async function getClaimById(claimId: string) {
  const res = await api.get(`/claims/${claimId}`);
  return res.data; // { claim }
}

export async function getClaimHistory(limit = 20) {
  const res = await api.get(`/claims/history?limit=${limit}`);
  return res.data; // { claims }
}

// ════════════════════════════════════════
//  AI ANALYSIS  — /api/ai/*
// ════════════════════════════════════════

export async function analyzeText(text: string) {
  const res = await api.post('/ai/analyze-text', { text });
  return res.data; // { result }
}

export async function analyzeUrl(url: string) {
  const res = await api.post('/ai/analyze-url', { url });
  return res.data; // { result }
}

export async function extractClaims(claimId: string) {
  const res = await api.post('/ai/extract-claims', { claimId });
  return res.data; // { result }
}

export async function getEmotionalManipulation(claimId: string) {
  const res = await api.post('/ai/emotional-manipulation', { claimId });
  return res.data; // { fear, anger, urgency, ... riskLabel, triggerPhrases }
}

export async function getSourceScore(claimId: string) {
  const res = await api.post('/ai/source-score', { claimId });
  return res.data; // { result }
}

// ════════════════════════════════════════
//  COMMUNITY  — /api/community/*
// ════════════════════════════════════════

export async function submitVote(data: {
  claimId: string;
  value: 'TRUE' | 'FALSE' | 'MISLEADING';
  reasoning: string;
  evidenceUrls?: string[];
}) {
  const res = await api.post('/community/vote', data);
  return res.data; // { vote }
}

export async function getVotesForClaim(claimId: string) {
  const res = await api.get(`/community/votes/${claimId}`);
  return res.data; // { votes }
}

// ════════════════════════════════════════
//  CONSENSUS  — /api/consensus/*
// ════════════════════════════════════════

export async function getConsensus(claimId: string) {
  const res = await api.get(`/consensus/${claimId}`);
  return res.data; // { consensus }
}

export async function recalculateConsensus(claimId: string) {
  const res = await api.post(`/consensus/recalculate/${claimId}`);
  return res.data; // { consensus }
}

// ════════════════════════════════════════
//  CORRECTIONS  — /api/corrections/*
// ════════════════════════════════════════

export async function generateCorrection(claimId: string) {
  const res = await api.post('/corrections/generate', { claimId });
  return res.data;
}

export async function getCorrection(claimId: string) {
  const res = await api.get(`/corrections/${claimId}`);
  return res.data; // { correction }
}

// ════════════════════════════════════════
//  DASHBOARD  — /api/dashboard/*
// ════════════════════════════════════════

export async function getTopPicks(): Promise<TopPick[]> {
  const res = await api.get('/dashboard/top-picks');
  const items = res.data.items || res.data || [];
  return items.map((item: any) => ({
    id: item.claimId || item.claim?.id || item.id,
    claim: item.claim?.title || item.claim?.inputs?.[0]?.rawText || item.claim?.id || 'Untitled claim',
    verdict: mapVerdict(item.claim?.consensus?.verdict || item.claim?.verifiedUpdates?.[0]?.verdict),
    confidence: Math.round((item.featuredScore ?? item.claim?.consensus?.confidencePercent ?? 0.5) * 100),
    trending: (item.virality ?? 0) > 0.6 || (item.featuredScore ?? 0) > 0.7,
    category: item.category || item.claim?.category || 'General',
  }));
}

export async function getTrending() {
  const res = await api.get('/dashboard/trending');
  return res.data.items || res.data;
}

export async function getCategoryStats(): Promise<CategoryStat[]> {
  const res = await api.get('/dashboard/categories');
  const items = res.data.items || res.data || [];
  return items.map((item: any) => {
    const total = item.totalClaims ?? item.count ?? 0;
    const falseRate = total ? (item.falseClaims ?? 0) / total : 0;
    return {
      category: item.category || 'General',
      count: total,
      trend: falseRate > 0.35 ? 'up' : falseRate < 0.15 ? 'down' : 'stable',
    } as CategoryStat;
  });
}

export async function getRegionInsights(): Promise<RegionInsight[]> {
  const res = await api.get('/dashboard/regions');
  const items = res.data.items || res.data || [];
  return items.map((item: any) => {
    const total = item.totalClaims ?? item.claimCount ?? 0;
    const riskScore = total ? ((item.falseClaims ?? 0) + (item.misleadingClaims ?? 0)) / total : 0;
    return {
      region: item.region || 'Unknown',
      claimCount: total,
      topCategory: item.meta?.topCategory || 'General',
      riskLevel: riskScore > 0.45 ? 'high' : riskScore > 0.2 ? 'medium' : 'low',
    } as RegionInsight;
  });
}

export async function getAlerts(): Promise<Alert[]> {
  const res = await api.get('/dashboard/alerts');
  const items = res.data.items || res.data || [];
  return items.map((item: any) => ({
    id: item.id,
    title: item.title || 'Alert',
    description: item.description || item.message || '',
    severity: item.severity || (item.type === 'claimBecameFalse' ? 'critical' : item.type === 'claimBecameMisleading' ? 'warning' : 'info'),
    timestamp: item.timestamp || item.createdAt || new Date().toISOString(),
    read: typeof item.read === 'boolean' ? item.read : Boolean(item.readAt),
  }));
}

// ════════════════════════════════════════
//  FEATURED  — /api/featured/*
// ════════════════════════════════════════

export async function getFeaturedHistory() {
  const res = await api.get('/featured/history');
  return res.data.items || res.data;
}

// ════════════════════════════════════════
//  EXPERTS  — /api/experts/*
// ════════════════════════════════════════

export async function applyExpert(data: {
  category: string;
  expertiseStatement: string;
  institutionEmail?: string;
  profileUrl?: string;
  proofLinks?: string[];
}) {
  const res = await api.post('/experts/apply', data);
  return res.data; // { application }
}

export async function getMyExpertApplication() {
  const res = await api.get('/experts/me');
  return res.data; // { application }
}

// ════════════════════════════════════════
//  ADMIN  — /api/admin/*
// ════════════════════════════════════════

export async function getExpertApplications(status?: string) {
  const query = status ? `?status=${status}` : '';
  const res = await api.get(`/admin/expert-applications${query}`);
  return res.data.applications || res.data;
}

export async function approveExpert(id: string, note?: string) {
  const res = await api.post(`/admin/experts/${id}/approve`, { note });
  return res.data;
}

export async function rejectExpert(id: string, note?: string) {
  const res = await api.post(`/admin/experts/${id}/reject`, { note });
  return res.data;
}

// ════════════════════════════════════════
//  AUTHORITY DASHBOARD  — /api/authority/*
// ════════════════════════════════════════

export async function getAuthorityPendingClaims(): Promise<any[]> {
  const res = await api.get('/authority/pending');
  return res.data.claims || res.data || [];
}

export async function getAuthorityCompletedClaims(): Promise<any[]> {
  const res = await api.get('/authority/completed');
  return res.data.claims || res.data || [];
}

export async function castAuthorityVote(claimId: string, verdict: string) {
  const res = await api.post(`/authority/vote/${claimId}`, { verdict });
  return res.data;
}

// ════════════════════════════════════════
//  i18n  — /api/i18n/*
// ════════════════════════════════════════

export async function translateText(text: string, targetLang: string) {
  const res = await api.post('/i18n/translate', { text, targetLang });
  return res.data;
}

export async function transcribeAudio(audioUrl: string, targetLang?: string) {
  const res = await api.post('/i18n/transcribe', { audioUrl, targetLang });
  return res.data;
}

// ════════════════════════════════════════
//  COMPOSITE HELPERS (used by pages)
//  These orchestrate multiple backend calls
//  and fall back to mock data if needed
// ════════════════════════════════════════

/**
 * Full claim check flow:
 * 1. Submit claim → get claim ID
 * 2. Run AI analysis pipeline linked to claimId:
 *    a. extract-claims  (stores AIAnalysis row with claimId)
 *    b. corrections/generate (stores VerifiedUpdate row)
 *    c. consensus/recalculate (stores ConsensusResult row)
 * 3. Return claim ID for navigation
 *
 * Steps 2a-2c are fire-and-forget so the user is navigated
 * immediately; the result page will show real data once ready.
 */
export async function checkClaim(
  text: string,
  inputType: string,
  metadata?: Record<string, unknown>
): Promise<{ claimId: string }> {
  const contentType = inputType === 'text' ? 'text'
    : inputType === 'url' ? 'url'
    : inputType === 'whatsapp' ? 'whatsapp'
    : inputType === 'image' ? 'image'
    : inputType === 'video' ? 'video'
    : inputType === 'voice' ? 'voice'
    : 'text';

  // Strip imageBase64 from metadata before sending to DB — store only lightweight fields
  const { imageBase64, imageMimeType, ...lightMetadata } = (metadata ?? {}) as any;

  const submitRes = await api.post('/claims/submit', {
    contentType,
    text: contentType === 'url' ? undefined : text,
    url: contentType === 'url' ? text : undefined,
    metadata: lightMetadata,
  });

  const claimId = submitRes.data.claim?.id || submitRes.data.id;

  // Run the full linked analysis pipeline asynchronously.
  void runClaimPipeline(claimId, { imageBase64, imageMimeType });

  return { claimId };
}

export async function runClaimPipeline(claimId: string, imageData?: { imageBase64?: string; imageMimeType?: string }): Promise<void> {
  try {
    // Fetch claim type (fast, no AI involved)
    const claimRes = await api.get(`/claims/${claimId}`);
    const contentType = claimRes.data?.claim?.contentType;
    const rawUrl: string | undefined = claimRes.data?.claim?.inputs?.[0]?.rawUrl;

    if (contentType === 'image') {
      // Image pipeline: pass base64 directly in the POST body — NOT stored in DB
      await api.post('/ai/analyze-image', {
        claimId,
        imageBase64: imageData?.imageBase64,
        imageMimeType: imageData?.imageMimeType ?? 'image/jpeg',
      });
      await api.post(`/consensus/recalculate/${claimId}`);
      return;
    }

    // Video content type (uploaded video file)
    if (contentType === 'video') {
      await api.post('/ai/analyze-video', { claimId });
      await api.post(`/consensus/recalculate/${claimId}`);
      return;
    }

    // Detect Instagram Reel/Post/Story URL → full video analysis via yt-dlp + Gemini
    if (rawUrl && /instagram\.com\/(reel|reels|p\/|stories\/)/.test(rawUrl)) {
      await api.post('/ai/analyze-video', { claimId, sourceUrl: rawUrl });
      await api.post(`/consensus/recalculate/${claimId}`);
      return;
    }

    // Detect YouTube URL → full video analysis via yt-dlp + Gemini
    if (rawUrl && /(?:youtube\.com\/watch|youtu\.be\/)/.test(rawUrl)) {
      await api.post('/ai/analyze-video', { claimId, sourceUrl: rawUrl });
      await api.post(`/consensus/recalculate/${claimId}`);
      return;
    }

    // Text/URL/WhatsApp pipeline: run extract-claims and corrections in PARALLEL
    const parallelTasks: Promise<any>[] = [
      api.post('/ai/extract-claims', { claimId }),
      api.post('/corrections/generate', { claimId }),
    ];
    if (contentType === 'url') {
      parallelTasks.push(api.post('/ai/source-score', { claimId }));
    }

    await Promise.allSettled(parallelTasks);
    await api.post(`/consensus/recalculate/${claimId}`);
  } catch {
    // Result page polling can retry; keep this non-fatal for submit UX.
  }
}



/**
 * Fetch full result page data for a claim.
 * Aggregates: claim detail, AI analysis, emotional signals,
 * community votes, consensus, correction, sources.
 */
export async function getFullClaimResult(claimId: string): Promise<ClaimResult> {
  // Wrap each call so 404s become null instead of rejected promises.
  const safeGet = (promise: Promise<any>) =>
    promise.then((r) => r).catch((e) => {
      if (e?.response?.status === 404) return null;
      throw e;
    });

  const [claimRes, consensusRes, votesRes, correctionRes] = await Promise.allSettled([
    api.get(`/claims/${claimId}`),
    safeGet(api.get(`/consensus/${claimId}`)),
    api.get(`/community/votes/${claimId}`),
    safeGet(api.get(`/corrections/${claimId}`)),
  ]);

  const claim = claimRes.status === 'fulfilled' ? claimRes.value?.data?.claim : null;
  const consensus = consensusRes.status === 'fulfilled' ? consensusRes.value?.data?.consensus : null;
  const votes = votesRes.status === 'fulfilled' ? votesRes.value?.data?.votes ?? [] : [];
  const correction = correctionRes.status === 'fulfilled' ? correctionRes.value?.data?.correction : null;

  const aiAnalyses = claim?.aiAnalyses || [];
  // Prioritize final-verdict-summary analyses for credibility scores
  const verdictAnalyses = aiAnalyses.filter((a: any) => a.task === 'final-verdict-summary');
  const fallbackAnalyses = aiAnalyses.filter((a: any) => a.task !== 'final-verdict-summary');
  const orderedForCredibility = [...verdictAnalyses, ...fallbackAnalyses];

  const latestAnalysis = verdictAnalyses[0] || aiAnalyses[0] || {};

  // Determine verdict for direction-aware AI credibility display
  const verdictLabel = consensus?.verdict || (correction as any)?.verdict;

  const aiCredibilityScores = orderedForCredibility
    .reduce((acc: Array<{ provider: string; score: number; verdict?: string }>, item: any) => {
      if (acc.some((x) => x.provider === item.provider)) return acc;
      const raw = item.rawJson || {};
      // Get raw confidence from DB column first (populated by our fix), then rawJson
      const rawScore =
        typeof item.confidence === 'number' ? item.confidence
          : typeof item.fakeProbability === 'number' ? 1 - item.fakeProbability
            : typeof raw.confidence === 'number' ? raw.confidence
              : typeof raw.fakeProbability === 'number' ? 1 - raw.fakeProbability
                : typeof raw?.result?.confidence === 'number' ? raw.result.confidence
                  : typeof raw?.result?.fakeProbability === 'number' ? 1 - raw.result.fakeProbability
                    : null;
      if (typeof rawScore !== 'number') return acc;
      const clampedScore = Math.max(0, Math.min(1, rawScore));
      // For FALSE claims: confidence should reflect how false it is (invert truthiness)
      const displayScore = verdictLabel === 'FALSE'
        ? 1 - clampedScore
        : clampedScore;
      acc.push({ provider: item.provider, score: displayScore, verdict: item.task === 'final-verdict-summary' ? verdictLabel : undefined });
      return acc;
    }, [])
    .map((x: { provider: string; score: number; verdict?: string }) => ({ ...x, score: Math.round(x.score * 100) }));

  const emotionalSignals = claim?.emotionalSignals || [];
  const trustedSources = claim?.trustedSources || [];

  // Derive confidence: use consensus as primary, then evidenceSnapshot, then 50
  const evidenceConf = (correction as any)?.evidenceSnapshot?.confidence;
  const computedConfidence = consensus?.confidencePercent
    ?? (typeof evidenceConf === 'number' ? evidenceConf * 100 : null)
    ?? ((correction as any)?.evidenceSnapshot?.result?.result?.confidence
      ? (correction as any).evidenceSnapshot.result.result.confidence * 100
      : null)
    ?? 50;

  const result: ClaimResult = {
    id: claimId,
    claim: {
      id: claim?.id || claimId,
      text: claim?.inputs?.[0]?.rawText || claim?.inputs?.[0]?.rawUrl || claim?.title || '',
      inputType: claim?.contentType || 'text',
      language: claim?.language || 'en',
      submittedAt: claim?.createdAt || new Date().toISOString(),
      submittedBy: claim?.userId || '',
      status: claim?.status === 'reviewed'
        ? 'completed'
        : claim?.status === 'analyzing'
          ? 'processing'
          : claim?.status || 'pending',
    },
    verdict: mapVerdict(consensus?.verdict || (correction as any)?.verdict || (correction as any)?.evidenceSnapshot?.result?.result?.verdict || (latestAnalysis.rawJson as any)?.verdict),
    confidence: Math.round(computedConfidence),
    explanation: (correction as any)?.correction
      || (correction as any)?.evidenceSnapshot?.result?.result?.summary
      || (correction as any)?.evidenceSnapshot?.result?.summary
      || (latestAnalysis.rawJson as any)?.summary  // image-analysis uses 'summary'
      || (latestAnalysis.rawJson as any)?.explanation
      || 'Analysis pending...',
    explainLikeIm10: (correction as any)?.evidenceSnapshot?.result?.result?.eli10
      || (correction as any)?.evidenceSnapshot?.eli10
      || (latestAnalysis.rawJson as any)?.eli10
      || 'Simple explanation pending...',
    suspiciousSentences: [
      // From regular text analysis
      ...((latestAnalysis.rawJson as any)?.suspiciousSentences || []).map((s: any) => ({
        text: s.text || s,
        reason: s.reason || 'Flagged by AI',
        severity: s.severity || 'medium',
      })),
      // From image/instagram analysis: manipulationSignals become suspicious sentences
      ...((latestAnalysis.rawJson as any)?.manipulationSignals || []).map((signal: string) => ({
        text: signal,
        reason: 'Visual manipulation signal detected',
        severity: 'high',
      })),
      // From instagram: riskFactors also surfaced as suspicious
      ...((latestAnalysis.rawJson as any)?.riskFactors || []).map((factor: string) => ({
        text: factor,
        reason: 'Instagram risk factor flagged by AI',
        severity: 'medium',
      })),
    ],
    emotionalSignals: emotionalSignals.map((s: any) => ({
      type: s.riskLabel || 'Signal',
      intensity: Math.max(s.fear, s.anger, s.urgency, s.outrage, s.authority) || 0,
      description: s.riskLabel,
    })),
    manipulationTriggers: emotionalSignals.flatMap((s: any) => Array.isArray(s.triggerPhrases) ? s.triggerPhrases : []),

    sourceCredibility: trustedSources.map((s: any) => ({
      name: s.publisher || s.title || 'Source',
      url: s.url,
      trustScore: Math.round((s.trust || 0.5) * 100),
      stance: s.trust > 0.7 ? 'contradicts' : s.trust > 0.4 ? 'neutral' : 'supports',
    })),
    verifiedCorrection: correction?.correction || 'Correction pending...',
    communityVotes: {
      verified: votes.filter((v: any) => v.value === 'TRUE').length,
      misleading: votes.filter((v: any) => v.value === 'MISLEADING').length,
      false: votes.filter((v: any) => v.value === 'FALSE').length,
      total: votes.length,
    },
    consensus: {
      score: consensus?.finalScore ? Math.round(consensus.finalScore * 100) : 0,
      totalValidators: votes.length,
      expertCount: votes.filter((v: any) => v.user?.role === 'expert').length,
      communityCount: votes.filter((v: any) => v.user?.role !== 'expert').length,
      agreement: consensus?.confidencePercent || 0,
    },
    aiCredibilityScores,
    timeline: [],
    auditTrail: [],
    // Extra fields for the provider badge in the Result page
    _provider: latestAnalysis.provider,
    _model: latestAnalysis.model,
  } as unknown as ClaimResult;

  // ── Instagram meta from instagram-analysis OR video-analysis task ──
  const igAnalysis = aiAnalyses.find((a: any) => a.task === 'instagram-analysis' || a.task === 'video-analysis');
  if (igAnalysis) {
    const igRaw = igAnalysis.rawJson as any;
    const isVideo = igAnalysis.task === 'video-analysis';
    (result as any).instagramMeta = {
      platform: 'instagram',
      mediaType: igRaw?.mediaType || (isVideo ? 'reel' : 'post'),
      username: igRaw?.username || undefined,
      caption: igRaw?.summary?.split('\n')[0]?.slice(0, 200) || undefined,
      hashtags: Array.isArray(igRaw?.riskFactors) && igRaw.riskFactors.length ? igRaw.riskFactors : undefined,
      thumbnailUrl: igRaw?.thumbnailUrl || undefined,
      uploadedAt: igRaw?.uploadedAt || undefined,
      authenticityScore: typeof igRaw?.authenticityScore === 'number'
        ? Math.round(igRaw.authenticityScore * 100)
        : typeof igRaw?.confidence === 'number'
        ? Math.round((1 - (igRaw.fakeProbability ?? 0)) * 100)
        : undefined,
    };
  }

  return result;
}



function mapVerdict(v: string | undefined): 'verified' | 'misleading' | 'false' | 'unverified' {
  if (!v) return 'unverified';
  const lower = v.toLowerCase();
  if (lower === 'true') return 'verified';
  if (lower === 'false') return 'false';
  if (lower === 'misleading') return 'misleading';
  return 'unverified';
}

// ════════════════════════════════════════
//  LEGACY COMPAT — functions pages still import
// ════════════════════════════════════════

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const res = await api.get('/dashboard/leaderboard');
  return res.data.items || res.data;
}

export async function getNotifications(): Promise<Notification[]> {
  try {
    const res = await api.get('/dashboard/notifications');
    return res.data.items || res.data || [];
  } catch {
    return [];
  }
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.patch(`/dashboard/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.patch('/dashboard/notifications/read-all');
}

export async function clearAllNotifications(): Promise<void> {
  await api.delete('/dashboard/notifications/clear-all');
}

export async function getReviewQueue(): Promise<ReviewItem[]> {
  const res = await api.get('/admin/expert-applications?status=pending');
  const apps = res.data.applications || [];
  return apps.map((app: any) => ({
    id: app.id,
    claim: {
      id: app.id,
      text: `Expert application: ${app.category}`,
      inputType: 'text',
      language: 'en',
      submittedAt: app.createdAt,
      submittedBy: app.userId,
      status: 'completed',
    },
    result: { id: app.id, claim: { id: app.id, text: `Expert application: ${app.category}`, inputType: 'text', language: 'en', submittedAt: app.createdAt, submittedBy: app.userId, status: 'completed' }, verdict: 'unverified', confidence: 0, explanation: '', explainLikeIm10: '', suspiciousSentences: [], emotionalSignals: [], manipulationTriggers: [], sourceCredibility: [], verifiedCorrection: '', communityVotes: { verified: 0, misleading: 0, false: 0, total: 0 }, consensus: { score: 0, totalValidators: 0, expertCount: 0, communityCount: 0, agreement: 0 }, timeline: [], auditTrail: [] },
    flagReason: app.expertiseStatement,
    flaggedBy: app.userId,
    flaggedAt: app.createdAt,
    status: app.status,
  }));
}

export async function submitExpertApplication(data: any): Promise<{ success: boolean }> {
  await api.post('/experts/apply', {
    category: data.expertise || data.category || 'General',
    expertiseStatement: data.motivation || data.expertiseStatement || '',
    institutionEmail: data.email || undefined,
    profileUrl: data.linkedIn || undefined,
    proofLinks: [
      data.credentials || '',
      `Name: ${data.name || 'N/A'}`,
      `Mobile: ${data.mobileNumber || 'N/A'}`,
      `Organization: ${data.organizationName || 'N/A'}`,
      `ID Image: ${data.idImageName || 'N/A'}`,
    ],
  });
  return { success: true };
}

export default api;

// ════════════════════════════════════════
//  COMMUNITY POSTS  — /api/community-posts/*
// ════════════════════════════════════════

export async function createCommunityPost(data: {
  title: string;
  content: string;
  category?: string;
  mediaUrl?: string;
  mediaType?: string;
}) {
  const res = await api.post('/community-posts/create', data);
  return res.data; // { post }
}

export async function getCommunityPostsList(params?: {
  status?: string;
  triageLabel?: string;
  limit?: number;
  offset?: number;
}) {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.triageLabel) query.set('triageLabel', params.triageLabel);
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.offset) query.set('offset', String(params.offset));
  const res = await api.get(`/community-posts/list?${query.toString()}`);
  return res.data; // { posts }
}

export async function getCommunityPostById(postId: string) {
  const res = await api.get(`/community-posts/post/${postId}`);
  return res.data; // { post }
}

export async function getCommunityPostStatus(postId: string) {
  const res = await api.get(`/community-posts/post/${postId}/status`);
  return res.data; // { postId, status, triageLabel, scores... }
}

export async function getAuthorityPostQueue() {
  const res = await api.get('/community-posts/authority/queue');
  return res.data; // { posts }
}

export async function submitAuthorityPostVerdict(postId: string, verdict: string, note?: string) {
  const res = await api.post(`/community-posts/authority/verdict/${postId}`, { verdict, note });
  return res.data; // { post }
}

export async function getAuthorityCompletedPostsList() {
  const res = await api.get('/community-posts/authority/completed');
  return res.data; // { posts }
}
