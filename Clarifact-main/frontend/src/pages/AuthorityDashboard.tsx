import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, Clock, CheckCircle2, XCircle, AlertTriangle,
  ExternalLink, ChevronRight, BarChart3, Vote, Gavel,
  BadgeCheck, FileText, Eye, ThumbsUp, ThumbsDown, MessageSquare, Zap, Shield
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { getAuthorityPendingClaims, getAuthorityCompletedClaims, castAuthorityVote, getAuthorityPostQueue, submitAuthorityPostVerdict } from '@/services/api';
import { formatTimeAgo, cn } from '@/lib/utils';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import toast from 'react-hot-toast';

type VerdictType = 'TRUE' | 'FALSE' | 'MISLEADING' | 'UNVERIFIED';

interface AuthorityClaim {
  id: string;
  title?: string;
  text?: string;
  url?: string;
  contentType: string;
  status: string;
  createdAt: string;
  aiVerdict?: VerdictType;
  aiConfidence?: number;
  authorityVerdicts?: { verdict: VerdictType; authorityName: string; reviewedAt: string }[];
  myVote?: VerdictType | null;
}

const VERDICT_CONFIG: Record<VerdictType, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  TRUE:        { label: 'Real / Verified',   color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-400/30', icon: <CheckCircle2 className="w-4 h-4" /> },
  FALSE:       { label: 'Fake / False',      color: 'text-red-400',     bg: 'bg-red-500/15 border-red-400/30',         icon: <XCircle className="w-4 h-4" /> },
  MISLEADING:  { label: 'Misleading',        color: 'text-orange-400',  bg: 'bg-orange-500/15 border-orange-400/30',   icon: <AlertTriangle className="w-4 h-4" /> },
  UNVERIFIED:  { label: 'Unverified',        color: 'text-gray-400',    bg: 'bg-gray-500/15 border-gray-400/30',       icon: <Clock className="w-4 h-4" /> },
};

export default function AuthorityDashboard() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'pending' | 'completed' | 'community'>('pending');
  const [pendingClaims, setPendingClaims] = useState<AuthorityClaim[]>([]);
  const [completedClaims, setCompletedClaims] = useState<AuthorityClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [communityPosts, setCommunityPosts] = useState<any[]>([]);
  const [postVotingId, setPostVotingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [pending, completed, posts] = await Promise.allSettled([
      getAuthorityPendingClaims(),
      getAuthorityCompletedClaims(),
      getAuthorityPostQueue(),
    ]);
    setPendingClaims(pending.status === 'fulfilled' ? (pending.value as AuthorityClaim[]) : []);
    setCompletedClaims(completed.status === 'fulfilled' ? (completed.value as AuthorityClaim[]) : []);
    setCommunityPosts(posts.status === 'fulfilled' ? ((posts.value as any)?.posts || []) : []);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { const iv = setInterval(loadData, 15000); return () => clearInterval(iv); }, [loadData]);

  const handlePostVerdict = async (postId: string, verdict: string) => {
    setPostVotingId(postId);
    try {
      await submitAuthorityPostVerdict(postId, verdict, `Authority ${verdict} this community post.`);
      setCommunityPosts(prev => prev.filter(p => p.id !== postId));
      toast.success(`Post ${verdict}!`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed');
    } finally {
      setPostVotingId(null);
    }
  };

  const handleVote = async (claimId: string, verdict: VerdictType) => {
    setVotingId(claimId);
    try {
      await castAuthorityVote(claimId, verdict);
      // Move from pending to completed with the verdict
      const claim = pendingClaims.find(c => c.id === claimId);
      if (claim) {
        const updated = { ...claim, myVote: verdict, status: 'reviewed', authorityVerdicts: [
          ...(claim.authorityVerdicts || []),
          { verdict, authorityName: user?.name || 'Authority', reviewedAt: new Date().toISOString() }
        ]};
        setPendingClaims(prev => prev.filter(c => c.id !== claimId));
        setCompletedClaims(prev => [updated, ...prev]);
      }
      toast.success(`Declared as: ${VERDICT_CONFIG[verdict].label}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Vote failed');
    } finally {
      setVotingId(null);
    }
  };

  const stats = [
    { label: 'Pending Review', value: pendingClaims.length, color: 'from-orange-500 to-amber-500', icon: <Clock className="w-5 h-5" /> },
    { label: 'Completed', value: completedClaims.length, color: 'from-emerald-500 to-green-500', icon: <CheckCircle2 className="w-5 h-5" /> },
    { label: 'Fake Detected', value: completedClaims.filter(c => c.myVote === 'FALSE').length, color: 'from-red-500 to-rose-500', icon: <XCircle className="w-5 h-5" /> },
    { label: 'Verified Real', value: completedClaims.filter(c => c.myVote === 'TRUE').length, color: 'from-blue-500 to-violet-500', icon: <BadgeCheck className="w-5 h-5" /> },
  ];

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 pb-24 lg:pb-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <Gavel className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Authority Dashboard</h1>
            <p className="text-xs text-foreground/40">
              <ShieldCheck className="w-3 h-3 inline mr-1 text-violet-400" />
              Verified Authority · {user?.name}
            </p>
          </div>
        </div>
        <p className="text-sm text-foreground/50">
          Review AI-flagged news and cast your official verdict. Your decisions are featured in the public "Verified By Authorities" feed.
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="p-4 rounded-2xl bg-card border border-border"
          >
            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white mb-3`}>
              {stat.icon}
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-foreground/50 mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {[
          { key: 'pending', label: 'Pending Review', count: pendingClaims.length, icon: <Vote className="w-4 h-4" /> },
          { key: 'community', label: 'Community Posts', count: communityPosts.length, icon: <MessageSquare className="w-4 h-4" /> },
          { key: 'completed', label: 'Completed', count: completedClaims.length, icon: <BarChart3 className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-violet-500/15 text-violet-400 border border-violet-400/30'
                : 'bg-secondary text-foreground/60 hover:text-foreground border border-transparent'
            }`}
          >
            {tab.icon}
            {tab.label}
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === tab.key ? 'bg-violet-400/20 text-violet-300' : 'bg-secondary text-foreground/40'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSkeleton count={4} />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {activeTab === 'pending' && (
              <PendingList
                claims={pendingClaims}
                votingId={votingId}
                expandedId={expandedId}
                onExpand={setExpandedId}
                onVote={handleVote}
              />
            )}
            {activeTab === 'community' && (
              <CommunityPostQueue posts={communityPosts} votingId={postVotingId} onVerdict={handlePostVerdict} />
            )}
            {activeTab === 'completed' && (
              <CompletedList claims={completedClaims} />
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

// ─── Pending Claims List ───
function PendingList({ claims, votingId, expandedId, onExpand, onVote }: {
  claims: AuthorityClaim[];
  votingId: string | null;
  expandedId: string | null;
  onExpand: (id: string | null) => void;
  onVote: (id: string, verdict: VerdictType) => void;
}) {
  if (claims.length === 0) {
    return (
      <div className="text-center py-16">
        <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-50" />
        <p className="text-foreground/50 font-medium">All caught up! No pending claims to review.</p>
        <p className="text-sm text-foreground/30 mt-1">New claims will appear here as users submit them.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {claims.map((claim, i) => {
        const isExpanded = expandedId === claim.id;
        const isVoting = votingId === claim.id;
        const aiCfg = claim.aiVerdict ? VERDICT_CONFIG[claim.aiVerdict] : null;

        return (
          <motion.div
            key={claim.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-border bg-card overflow-hidden"
          >
            {/* Header row */}
            <div
              className="p-4 cursor-pointer hover:bg-secondary/30 transition-colors"
              onClick={() => onExpand(isExpanded ? null : claim.id)}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-orange-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FileText className="w-4 h-4 text-orange-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-2">
                    {claim.title || claim.text?.slice(0, 120) || claim.url || 'Untitled Claim'}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="text-xs text-foreground/40">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {new Date(claim.createdAt).toLocaleDateString()}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-foreground/50 capitalize">
                      {claim.contentType}
                    </span>
                    {aiCfg && (
                      <span className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 ${aiCfg.bg} ${aiCfg.color}`}>
                        {aiCfg.icon} AI: {aiCfg.label}
                        {claim.aiConfidence && <span className="opacity-60">({claim.aiConfidence}%)</span>}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 text-foreground/30 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              </div>
            </div>

            {/* Expanded panel: full text + voting */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 pt-1 border-t border-border bg-secondary/20">
                    {/* Full content */}
                    {claim.url && (
                      <a
                        href={claim.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-primary hover:underline mb-3"
                      >
                        <ExternalLink className="w-3 h-3" /> View original source
                      </a>
                    )}
                    {claim.text && (
                      <p className="text-sm text-foreground/70 mb-4 leading-relaxed bg-secondary/30 p-3 rounded-xl">
                        {claim.text}
                      </p>
                    )}
                    <Link
                      to={`/result/${claim.id}`}
                      className="flex items-center gap-1.5 text-xs text-foreground/50 hover:text-primary mb-4"
                    >
                      <Eye className="w-3.5 h-3.5" /> View full AI analysis report
                    </Link>

                    {/* Verdict buttons */}
                    <div>
                      <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wide mb-3">Cast Your Official Verdict</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          disabled={isVoting}
                          onClick={() => onVote(claim.id, 'TRUE')}
                          className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-400/30 hover:bg-emerald-500/25 transition-all disabled:opacity-40"
                        >
                          <ThumbsUp className="w-4 h-4" /> Real / Verified
                        </button>
                        <button
                          disabled={isVoting}
                          onClick={() => onVote(claim.id, 'FALSE')}
                          className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-red-500/15 text-red-400 border border-red-400/30 hover:bg-red-500/25 transition-all disabled:opacity-40"
                        >
                          <ThumbsDown className="w-4 h-4" /> Fake / False
                        </button>
                        <button
                          disabled={isVoting}
                          onClick={() => onVote(claim.id, 'MISLEADING')}
                          className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-orange-500/15 text-orange-400 border border-orange-400/30 hover:bg-orange-500/25 transition-all disabled:opacity-40"
                        >
                          <AlertTriangle className="w-4 h-4" /> Misleading
                        </button>
                        <button
                          disabled={isVoting}
                          onClick={() => onVote(claim.id, 'UNVERIFIED')}
                          className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-secondary text-foreground/50 border border-border hover:bg-secondary/80 transition-all disabled:opacity-40"
                        >
                          <Clock className="w-4 h-4" /> Needs More Info
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Completed Claims List ───
function CompletedList({ claims }: { claims: AuthorityClaim[] }) {
  if (claims.length === 0) {
    return (
      <div className="text-center py-16">
        <BarChart3 className="w-12 h-12 text-foreground/20 mx-auto mb-3" />
        <p className="text-foreground/50 font-medium">No completed reviews yet.</p>
        <p className="text-sm text-foreground/30 mt-1">Claims you review will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {claims.map((claim, i) => {
        const verdict = claim.myVote || claim.authorityVerdicts?.[0]?.verdict;
        const cfg = verdict ? VERDICT_CONFIG[verdict] : VERDICT_CONFIG['UNVERIFIED'];

        return (
          <motion.div
            key={claim.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="p-4 rounded-2xl border border-border bg-card flex items-start gap-3"
          >
            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border flex-shrink-0 ${cfg.bg} ${cfg.color}`}>
              {cfg.icon} {cfg.label}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium line-clamp-1">
                {claim.title || claim.text?.slice(0, 100) || claim.url || 'Claim'}
              </p>
              <p className="text-xs text-foreground/40 mt-1">
                Reviewed · {new Date(claim.createdAt).toLocaleDateString()}
              </p>
            </div>
            <Link to={`/result/${claim.id}`} className="p-1.5 hover:bg-secondary rounded-lg transition-colors flex-shrink-0">
              <Eye className="w-4 h-4 text-foreground/40" />
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Community Posts Queue ───
function CommunityPostQueue({ posts, votingId, onVerdict }: {
  posts: any[];
  votingId: string | null;
  onVerdict: (postId: string, verdict: string) => void;
}) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-16">
        <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-50" />
        <p className="text-foreground/50 font-medium">No community posts pending review.</p>
        <p className="text-sm text-foreground/30 mt-1">AI-flagged important posts will appear here.</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {posts.map((post: any, i: number) => {
        const isVoting = votingId === post.id;
        return (
          <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-violet-500/15 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-4 h-4 text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold line-clamp-1">{post.title}</p>
                  <p className="text-xs text-foreground/60 mt-1 line-clamp-2">{post.content}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-[11px] text-foreground/40">{post.user?.profile?.name || post.user?.email?.split('@')[0]}</span>
                    <span className="text-[11px] text-foreground/30">·</span>
                    <span className="text-[11px] text-foreground/40">{formatTimeAgo(post.createdAt)}</span>
                    {post.category && <span className="px-2 py-0.5 bg-secondary rounded-full text-[10px]">{post.category}</span>}
                    <span className="text-[11px] font-mono text-amber-400">IMP:{post.importanceScore?.toFixed(1)}</span>
                    <span className="text-[11px] font-mono text-red-400">URG:{post.urgencyScore?.toFixed(1)}</span>
                  </div>
                  {post.comments?.find((c: any) => c.isAI) && (
                    <div className="mt-2 bg-blue-500/5 border border-blue-500/15 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-1 mb-0.5"><Zap className="w-3 h-3 text-blue-400" /><span className="text-[10px] font-bold text-blue-400">AI</span></div>
                      <p className="text-xs text-foreground/60">{post.comments.find((c: any) => c.isAI)?.content}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-4 ml-11">
                <button disabled={isVoting} onClick={() => onVerdict(post.id, 'approved')} className="flex-1 py-2 rounded-xl text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-400/30 hover:bg-emerald-500/25 transition-all disabled:opacity-40 flex items-center justify-center gap-1.5">
                  <ThumbsUp className="w-3.5 h-3.5" /> Approve
                </button>
                <button disabled={isVoting} onClick={() => onVerdict(post.id, 'rejected')} className="flex-1 py-2 rounded-xl text-xs font-semibold bg-red-500/15 text-red-400 border border-red-400/30 hover:bg-red-500/25 transition-all disabled:opacity-40 flex items-center justify-center gap-1.5">
                  <ThumbsDown className="w-3.5 h-3.5" /> Reject
                </button>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
