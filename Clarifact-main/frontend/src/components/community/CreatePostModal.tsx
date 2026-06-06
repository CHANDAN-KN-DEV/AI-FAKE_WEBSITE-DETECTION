import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, Zap, AlertTriangle, Shield, Clock, Eye } from 'lucide-react';
import { createCommunityPost, getCommunityPostStatus } from '@/services/api';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: (post: any) => void;
}

const CATEGORIES = [
  'Breaking News',
  'Public Safety',
  'Politics',
  'Health',
  'Technology',
  'Environment',
  'Economy',
  'Social Media',
  'RRCE',
];

type TriageStatus = 'idle' | 'submitting' | 'triaging' | 'done';

interface TriageResult {
  postId: string;
  status: string;
  triageLabel: string | null;
  importanceScore: number | null;
  urgencyScore: number | null;
  intensityScore: number | null;
  credibilityScore: number | null;
  ambiguityScore: number | null;
  reason: string | null;
  sentToAuthority: boolean;
  aiComment: string | null;
}

export default function CreatePostModal({ isOpen, onClose, onPostCreated }: Props) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [triageStatus, setTriageStatus] = useState<TriageStatus>('idle');
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    setTriageStatus('submitting');

    try {
      const res = await createCommunityPost({
        title: title.trim(),
        content: content.trim(),
        category: category || undefined,
      });

      const postId = res.post?.id;
      if (!postId) throw new Error('No post ID returned');

      setTriageStatus('triaging');
      toast.success('Post submitted! AI is analyzing...');

      // Poll for triage result
      let attempts = 0;
      const maxAttempts = 20;
      const pollInterval = 2000;

      const poll = async () => {
        attempts++;
        try {
          const statusRes = await getCommunityPostStatus(postId);
          if (statusRes.status !== 'pending_triage' || attempts >= maxAttempts) {
            setTriageResult(statusRes);
            setTriageStatus('done');
            onPostCreated?.(statusRes);
            return;
          }
          setTimeout(poll, pollInterval);
        } catch {
          if (attempts >= maxAttempts) {
            setTriageStatus('done');
            toast.error('Triage polling timed out');
          } else {
            setTimeout(poll, pollInterval);
          }
        }
      };

      poll();
    } catch (err: any) {
      setTriageStatus('idle');
      toast.error(err?.response?.data?.error || 'Failed to create post');
    }
  };

  const resetAndClose = () => {
    setTitle('');
    setContent('');
    setCategory('');
    setTriageStatus('idle');
    setTriageResult(null);
    onClose();
  };

  const getStatusBadge = (label: string | null) => {
    switch (label) {
      case 'send_to_authority':
        return { text: 'Sent to Authority', color: 'bg-violet-500/20 text-violet-400 border-violet-500/30', icon: Shield };
      case 'ai_comment_only':
        return { text: 'AI Commented', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Zap };
      case 'needs_more_context':
        return { text: 'Needs More Context', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Eye };
      case 'duplicate':
        return { text: 'Duplicate', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: AlertTriangle };
      case 'low_priority':
        return { text: 'Low Priority', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: Clock };
      default:
        return { text: 'Processing', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Loader2 };
    }
  };

  const ScoreBar = ({ label, value, max = 10 }: { label: string; value: number | null; max?: number }) => {
    const pct = value != null ? (value / max) * 100 : 0;
    const color = pct >= 70 ? 'bg-red-500' : pct >= 40 ? 'bg-amber-500' : 'bg-emerald-500';
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-foreground/60">{label}</span>
          <span className="font-mono font-medium">{value != null ? (max === 1 ? `${Math.round(value * 100)}%` : value.toFixed(1)) : '—'}</span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={cn('h-full rounded-full', color)}
          />
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && triageStatus === 'idle' && resetAndClose()}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-card border border-border rounded-2xl shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-border bg-card rounded-t-2xl">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                  <Send className="w-4 h-4 text-white" />
                </div>
                Create Community Post
              </h2>
              <button
                onClick={resetAndClose}
                className="p-2 rounded-xl hover:bg-secondary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {triageStatus === 'idle' || triageStatus === 'submitting' ? (
                <>
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-foreground/70">
                      Title <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Breaking: New policy announced..."
                      className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-foreground/30"
                      disabled={triageStatus === 'submitting'}
                    />
                  </div>

                  {/* Content */}
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-foreground/70">
                      Content <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Describe the news, event, or information you want to share with the community..."
                      rows={4}
                      className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none placeholder:text-foreground/30"
                      disabled={triageStatus === 'submitting'}
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-foreground/70">
                      Category
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setCategory(category === cat ? '' : cat)}
                          className={cn(
                            'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                            category === cat
                              ? 'bg-primary/20 text-primary border-primary/40'
                              : 'bg-secondary/50 text-foreground/50 border-border hover:border-primary/30'
                          )}
                          disabled={triageStatus === 'submitting'}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    onClick={handleSubmit}
                    disabled={triageStatus === 'submitting' || !title.trim() || !content.trim()}
                    className={cn(
                      'w-full py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2',
                      triageStatus === 'submitting'
                        ? 'bg-primary/50 text-white cursor-wait'
                        : 'bg-gradient-to-r from-blue-500 to-violet-600 text-white hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98]'
                    )}
                  >
                    {triageStatus === 'submitting' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Submit & Analyze
                      </>
                    )}
                  </button>
                </>
              ) : triageStatus === 'triaging' ? (
                <div className="py-8 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">AI Triage in Progress</h3>
                    <p className="text-sm text-foreground/50 mt-1">
                      Evaluating importance, urgency, credibility, and sensitivity...
                    </p>
                  </div>
                  <div className="flex justify-center gap-1">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-primary"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </div>
              ) : triageResult ? (
                <div className="space-y-5">
                  {/* Status badge */}
                  {(() => {
                    const badge = getStatusBadge(triageResult.triageLabel);
                    const BadgeIcon = badge.icon;
                    return (
                      <div className={cn('flex items-center gap-2 px-4 py-3 rounded-xl border', badge.color)}>
                        <BadgeIcon className="w-5 h-5" />
                        <span className="text-sm font-bold">{badge.text}</span>
                      </div>
                    );
                  })()}

                  {/* Scores grid */}
                  <div className="bg-secondary/30 rounded-xl p-4 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground/40">AI Triage Scores</h4>
                    <ScoreBar label="Importance" value={triageResult.importanceScore} max={10} />
                    <ScoreBar label="Urgency" value={triageResult.urgencyScore} max={10} />
                    <ScoreBar label="Intensity" value={triageResult.intensityScore} max={10} />
                    <ScoreBar label="Credibility" value={triageResult.credibilityScore} max={1} />
                    <ScoreBar label="Ambiguity" value={triageResult.ambiguityScore} max={1} />
                  </div>

                  {/* Reason */}
                  {triageResult.reason && (
                    <div className="bg-secondary/30 rounded-xl p-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground/40 mb-2">Triage Reason</h4>
                      <p className="text-sm text-foreground/80">{triageResult.reason}</p>
                    </div>
                  )}

                  {/* AI Comment */}
                  {triageResult.aiComment && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-2 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5" />
                        AI Comment
                      </h4>
                      <p className="text-sm text-foreground/80">{triageResult.aiComment}</p>
                    </div>
                  )}

                  {/* Authority badge */}
                  {triageResult.sentToAuthority && (
                    <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4 flex items-center gap-3">
                      <Shield className="w-5 h-5 text-violet-400" />
                      <div>
                        <p className="text-sm font-medium text-violet-300">Sent to Authority Queue</p>
                        <p className="text-xs text-foreground/50">This post will be reviewed by an authority user.</p>
                      </div>
                    </div>
                  )}

                  {/* Close button */}
                  <button
                    onClick={resetAndClose}
                    className="w-full py-3 rounded-xl font-medium text-sm bg-secondary hover:bg-secondary/80 transition-all"
                  >
                    Done
                  </button>
                </div>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
