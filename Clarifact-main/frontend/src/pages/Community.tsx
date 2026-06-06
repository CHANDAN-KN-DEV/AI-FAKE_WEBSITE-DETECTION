import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Zap, Shield, Clock, Eye, AlertTriangle, MessageSquare,
  RefreshCw, ChevronDown, CheckCircle2, XCircle, Filter
} from 'lucide-react';
import { useLanguageStore } from '@/store/languageStore';
import { useAuthStore } from '@/store/authStore';
import { getCommunityPostsList } from '@/services/api';
import { cn, formatTimeAgo } from '@/lib/utils';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import CreatePostModal from '@/components/community/CreatePostModal';

interface CommunityPost {
  id: string;
  title: string;
  content: string;
  category: string | null;
  status: string;
  triageLabel: string | null;
  importanceScore: number | null;
  urgencyScore: number | null;
  intensityScore: number | null;
  credibilityScore: number | null;
  ambiguityScore: number | null;
  triageReason: string | null;
  sentToAuthority: boolean;
  authorityVerdict: string | null;
  authorityNote: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    role: string;
    profile: { name: string | null } | null;
  };
  comments: Array<{
    id: string;
    isAI: boolean;
    content: string;
    commentType: string;
    createdAt: string;
  }>;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending_triage: { label: 'Analyzing...', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: RefreshCw },
  triaged: { label: 'Triaged', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CheckCircle2 },
  sent_to_authority: { label: 'Sent to Authority', color: 'bg-violet-500/20 text-violet-400 border-violet-500/30', icon: Shield },
  authority_approved: { label: 'Authority Approved', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CheckCircle2 },
  authority_rejected: { label: 'Authority Rejected', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle },
  ai_commented: { label: 'AI Commented', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Zap },
  needs_context: { label: 'Needs More Context', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Eye },
};

const TRIAGE_LABEL_CONFIG: Record<string, { label: string; color: string }> = {
  send_to_authority: { label: 'Authority', color: 'text-violet-400' },
  ai_comment_only: { label: 'AI Review', color: 'text-blue-400' },
  needs_more_context: { label: 'Needs Context', color: 'text-amber-400' },
  duplicate: { label: 'Duplicate', color: 'text-gray-400' },
  low_priority: { label: 'Low Priority', color: 'text-gray-400' },
};

const FILTER_OPTIONS = [
  { value: '', label: 'All Posts' },
  { value: 'ai_commented', label: 'AI Commented' },
  { value: 'sent_to_authority', label: 'Sent to Authority' },
  { value: 'needs_context', label: 'Needs Context' },
  { value: 'authority_approved', label: 'Approved' },
  { value: 'authority_rejected', label: 'Rejected' },
];

export default function Community() {
  const { t } = useLanguageStore();
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);

  const loadPosts = useCallback(async () => {
    try {
      const res = await getCommunityPostsList({
        status: filter || undefined,
        limit: 50,
      });
      setPosts(res.posts || []);
    } catch (err) {
      console.error('Failed to load community posts:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    loadPosts();
  }, [loadPosts]);

  // Auto-refresh every 10 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(loadPosts, 10000);
    return () => clearInterval(interval);
  }, [loadPosts]);

  const ScorePill = ({ label, value, max = 10 }: { label: string; value: number | null; max?: number }) => {
    if (value == null) return null;
    const pct = (value / max) * 100;
    const color = pct >= 70 ? 'text-red-400' : pct >= 40 ? 'text-amber-400' : 'text-emerald-400';
    return (
      <span className={cn('text-xs font-mono', color)}>
        {label}: {max === 1 ? `${Math.round(value * 100)}%` : value.toFixed(1)}
      </span>
    );
  };

  if (loading) return <div className="max-w-4xl mx-auto p-6"><LoadingSkeleton count={4} /></div>;

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 pb-24 lg:pb-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">{t('community.title')}</h1>
          </div>
          <button
            onClick={() => setShowCreatePost(true)}
            className="btn-3d-primary btn-md"
          >
            + New Post
          </button>
        </div>
        <p className="text-sm text-foreground/50 mb-4">Community posts with real-time AI triage and authority routing.</p>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          <Filter className="w-4 h-4 text-foreground/40 flex-shrink-0" />
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={cn(
                'btn-3d btn-sm whitespace-nowrap',
                filter === opt.value ? 'btn-3d-primary' : 'btn-3d-ghost'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </motion.div>

      {posts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-secondary/50 flex items-center justify-center">
            <MessageSquare className="w-8 h-8 text-foreground/30" />
          </div>
          <h3 className="text-lg font-bold text-foreground/50">No Posts Yet</h3>
          <p className="text-sm text-foreground/30 mt-1">Create the first community post to get started.</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {posts.map((post, i) => {
            const statusConf = STATUS_CONFIG[post.status] || STATUS_CONFIG.pending_triage;
            const StatusIcon = statusConf.icon;
            const isExpanded = expandedPost === post.id;
            const aiComment = post.comments.find((c) => c.isAI);
            const authorityComment = post.comments.find((c) => c.commentType === 'authority_verdict');

            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/20 transition-colors"
              >
                {/* Post header */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm leading-snug line-clamp-2">{post.title}</h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[11px] text-foreground/40">
                          {post.user?.profile?.name || post.user?.email?.split('@')[0] || 'User'}
                        </span>
                        <span className="text-[11px] text-foreground/30">·</span>
                        <span className="text-[11px] text-foreground/40">{formatTimeAgo(post.createdAt)}</span>
                        {post.category && (
                          <>
                            <span className="text-[11px] text-foreground/30">·</span>
                            <span className="px-2 py-0.5 bg-secondary rounded-full text-[10px] font-medium text-foreground/50">{post.category}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Status badge */}
                    <div className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium whitespace-nowrap', statusConf.color)}>
                      <StatusIcon className={cn('w-3.5 h-3.5', post.status === 'pending_triage' && 'animate-spin')} />
                      {statusConf.label}
                    </div>
                  </div>

                  {/* Content preview */}
                  <p className="text-sm text-foreground/70 line-clamp-2 mb-3">{post.content}</p>

                  {/* Triage scores pills */}
                  {post.triageLabel && (
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {(() => {
                        const conf = TRIAGE_LABEL_CONFIG[post.triageLabel] || { label: post.triageLabel, color: 'text-foreground/50' };
                        return (
                          <span className={cn('px-2 py-0.5 bg-secondary rounded-full text-[10px] font-bold uppercase tracking-wider', conf.color)}>
                            {conf.label}
                          </span>
                        );
                      })()}
                      <span className="text-foreground/20">|</span>
                      <ScorePill label="IMP" value={post.importanceScore} />
                      <ScorePill label="URG" value={post.urgencyScore} />
                      <ScorePill label="CRED" value={post.credibilityScore} max={1} />
                    </div>
                  )}

                  {/* AI Comment inline preview */}
                  {aiComment && (
                    <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl px-4 py-3 mb-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Zap className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">AI Verdict</span>
                      </div>
                      <p className="text-xs text-foreground/70 line-clamp-2">{aiComment.content}</p>
                    </div>
                  )}

                  {/* Authority verdict */}
                  {post.authorityVerdict && (
                    <div className={cn(
                      'rounded-xl px-4 py-3 mb-2 border',
                      post.authorityVerdict === 'approved'
                        ? 'bg-emerald-500/5 border-emerald-500/15'
                        : 'bg-red-500/5 border-red-500/15'
                    )}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Shield className={cn('w-3.5 h-3.5', post.authorityVerdict === 'approved' ? 'text-emerald-400' : 'text-red-400')} />
                        <span className={cn('text-[11px] font-bold uppercase tracking-wider', post.authorityVerdict === 'approved' ? 'text-emerald-400' : 'text-red-400')}>
                          Authority {post.authorityVerdict}
                        </span>
                      </div>
                      {post.authorityNote && (
                        <p className="text-xs text-foreground/70">{post.authorityNote}</p>
                      )}
                    </div>
                  )}

                  {/* Expand button */}
                  <button
                    onClick={() => setExpandedPost(isExpanded ? null : post.id)}
                    className="flex items-center gap-1 text-xs text-foreground/40 hover:text-foreground/60 transition-colors mt-1"
                  >
                    <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', isExpanded && 'rotate-180')} />
                    {isExpanded ? 'Less' : 'More details'}
                  </button>
                </div>

                {/* Expanded detail */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-border"
                    >
                      <div className="p-5 bg-secondary/20 space-y-4">
                        {/* Full content */}
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground/40 mb-1">Full Content</h4>
                          <p className="text-sm text-foreground/80 whitespace-pre-wrap">{post.content}</p>
                        </div>

                        {/* All triage scores */}
                        {post.triageLabel && (
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                            {[
                              { label: 'Importance', value: post.importanceScore, max: 10 },
                              { label: 'Urgency', value: post.urgencyScore, max: 10 },
                              { label: 'Intensity', value: post.intensityScore, max: 10 },
                              { label: 'Credibility', value: post.credibilityScore, max: 1 },
                              { label: 'Ambiguity', value: post.ambiguityScore, max: 1 },
                            ].map((s) => {
                              const pct = s.value != null ? (s.value / s.max) * 100 : 0;
                              const color = pct >= 70 ? 'text-red-400' : pct >= 40 ? 'text-amber-400' : 'text-emerald-400';
                              const barColor = pct >= 70 ? 'bg-red-500' : pct >= 40 ? 'bg-amber-500' : 'bg-emerald-500';
                              return (
                                <div key={s.label} className="bg-card/50 rounded-xl p-3 border border-border/50">
                                  <div className="text-[10px] text-foreground/40 uppercase tracking-wider">{s.label}</div>
                                  <div className={cn('text-lg font-bold font-mono', color)}>
                                    {s.value != null ? (s.max === 1 ? `${Math.round(s.value * 100)}%` : s.value.toFixed(1)) : '—'}
                                  </div>
                                  <div className="h-1 bg-secondary rounded-full mt-1 overflow-hidden">
                                    <div className={cn('h-full rounded-full', barColor)} style={{ width: `${pct}%` }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Triage reason */}
                        {post.triageReason && (
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground/40 mb-1">Triage Reason</h4>
                            <p className="text-sm text-foreground/70">{post.triageReason}</p>
                          </div>
                        )}

                        {/* All comments */}
                        {post.comments.length > 0 && (
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground/40 mb-2">Comments ({post.comments.length})</h4>
                            <div className="space-y-2">
                              {post.comments.map((comment) => (
                                <div key={comment.id} className={cn(
                                  'rounded-lg px-4 py-3 border',
                                  comment.isAI ? 'bg-blue-500/5 border-blue-500/15' : 'bg-violet-500/5 border-violet-500/15'
                                )}>
                                  <div className="flex items-center gap-1.5 mb-1">
                                    {comment.isAI ? (
                                      <Zap className="w-3 h-3 text-blue-400" />
                                    ) : (
                                      <Shield className="w-3 h-3 text-violet-400" />
                                    )}
                                    <span className={cn('text-[10px] font-bold uppercase tracking-wider', comment.isAI ? 'text-blue-400' : 'text-violet-400')}>
                                      {comment.isAI ? 'AI' : 'Authority'} · {comment.commentType}
                                    </span>
                                    <span className="text-[10px] text-foreground/30 ml-auto">{formatTimeAgo(comment.createdAt)}</span>
                                  </div>
                                  <p className="text-xs text-foreground/70">{comment.content}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      <CreatePostModal
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        onPostCreated={() => {
          loadPosts();
        }}
      />
    </div>
  );
}
