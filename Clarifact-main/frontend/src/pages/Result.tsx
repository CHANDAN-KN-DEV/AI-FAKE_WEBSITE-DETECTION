import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Lightbulb, RefreshCw, Cpu, ShieldCheck, AlertTriangle, CheckCircle2, HelpCircle, Instagram, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import VerdictCard from '@/components/results/VerdictCard';
import ConfidenceMeter from '@/components/results/ConfidenceMeter';
import SuspiciousSentenceHighlighter from '@/components/results/SuspiciousSentenceHighlighter';
import EmotionalManipulationCard from '@/components/results/EmotionalManipulationCard';
import TrustedCorrectionCard from '@/components/results/TrustedCorrectionCard';
import CompareClaimVsTruth from '@/components/results/CompareClaimVsTruth';
import TrustedSourceList from '@/components/results/TrustedSourceList';
import ClaimTimeline from '@/components/results/ClaimTimeline';
import AICredibilityBreakdown from '@/components/results/AICredibilityBreakdown';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import ErrorState from '@/components/common/ErrorState';
import { getFullClaimResult, runClaimPipeline } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { useLanguageStore } from '@/store/languageStore';
import type { ClaimResult, AuthorityVerdictStatus } from '@/types';

export default function Result() {
  const MAX_POLL_ATTEMPTS = 12;
  const { claimId } = useParams<{ claimId: string }>();
  const [result, setResult] = useState<ClaimResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [simpleMode, setSimpleMode] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [pipelineKickCount, setPipelineKickCount] = useState(0);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { t } = useLanguageStore();
  const { user } = useAuthStore();
  const isAuthority = user?.role === 'authority' || user?.role === 'admin';

  const fetchResult = (opts?: { silent?: boolean }) => {
    if (!claimId) return;
    if (!opts?.silent) {
      setLoading(true);
      setError(null);
    }
    getFullClaimResult(claimId)
      .then((r) => {
        setResult(r);
        if (!opts?.silent) setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load result');
        if (!opts?.silent) setLoading(false);
      });
  };

  useEffect(() => {
    setPollCount(0);
    setPipelineKickCount(0);
    fetchResult();
  }, [claimId]);

  // Auto-poll while pending (up to 20 times, every 3 s)
  useEffect(() => {
    const explanationPending = result?.explanation === 'Analysis pending...';
    const isPending = (result?.claim?.status === 'pending' || result?.claim?.status === 'processing') && explanationPending;
    if (isPending && pollCount < MAX_POLL_ATTEMPTS) {
      if (claimId && pipelineKickCount < 1 && pollCount === 0) {
        void runClaimPipeline(claimId);
        setPipelineKickCount((n) => n + 1);
      }
      pollRef.current = setTimeout(() => {
        setPollCount((c) => c + 1);
        fetchResult({ silent: true });
      }, 2000);
    }
    return () => { if (pollRef.current) clearTimeout(pollRef.current); };
  }, [result, pollCount, claimId, pipelineKickCount, MAX_POLL_ATTEMPTS]);


  if (loading) return <div className="max-w-4xl mx-auto p-6"><LoadingSkeleton count={6} /></div>;
  if (error) return <div className="max-w-4xl mx-auto p-6"><ErrorState message={error} onRetry={fetchResult} /></div>;
  if (!result) return null;

  const isPending = (result.claim.status === 'pending' || result.claim.status === 'processing')
    && result.explanation === 'Analysis pending...';

  // Grab provider info from latestAnalysis (injected via claim.aiAnalyses in getFullClaimResult mapping)
  const providerLabel = (result as any)._provider as string | undefined;
  const modelLabel = (result as any)._model as string | undefined;

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 pb-24 lg:pb-6">
      <div className="flex items-center justify-between mb-6">
        <Link to="/check" className="btn-3d-ghost btn-sm inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> {t('common.back')}
        </Link>
        <div className="flex gap-2 flex-wrap justify-end">
          {providerLabel && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              <Cpu className="w-3.5 h-3.5" />
              AI Analysis
            </span>
          )}
          {isPending && (
            <button
              onClick={() => fetchResult()}
              className="btn-3d-ghost btn-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          )}
          <button
            onClick={() => setSimpleMode(!simpleMode)}
            className={`btn-3d btn-sm ${simpleMode ? 'btn-3d-cyan' : 'btn-3d-ghost'}`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            {t('result.explainSimple')}
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success('Report link copied to clipboard!', {
                icon: '🔗',
                style: {
                  borderRadius: '12px',
                  background: '#0f172a',
                  color: '#fff',
                  border: '1px solid rgba(99, 102, 241, 0.2)'
                }
              });
            }}
            className="btn-3d-ghost btn-sm"
          >
            <Share2 className="w-3.5 h-3.5" />
            Share Report
          </button>
        </div>
      </div>

      {/* Pending banner */}
      {isPending && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 rounded-2xl bg-misleading/10 border border-misleading/30 mb-6 text-center"
        >
          <p className="text-sm text-misleading font-medium">
            ⏳ AI is analyzing your claim…{pollCount > 0 ? ` (check ${pollCount}/${MAX_POLL_ATTEMPTS})` : ''} Results will appear automatically.
          </p>
        </motion.div>
      )}

      {/* Authority Verdict — shown above community analysis */}
      {result.authorityVerdict && (
        <AuthorityVerdictCard verdict={result.authorityVerdict} />
      )}

      {/* Instagram Metadata */}
      {result.instagramMeta && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-secondary/50 border border-border mb-6 flex items-start gap-3"
        >
          <Instagram className="w-5 h-5 text-pink-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="text-xs font-semibold text-pink-400 uppercase tracking-wide">Instagram Media Detected</p>
            <p className="text-sm font-medium capitalize">{result.instagramMeta.mediaType}</p>
            {result.instagramMeta.username && <p className="text-xs text-foreground/50">@{result.instagramMeta.username}</p>}
            {result.instagramMeta.caption && <p className="text-xs text-foreground/60 italic">{result.instagramMeta.caption}</p>}
            {result.instagramMeta.hashtags && result.instagramMeta.hashtags.length > 0 && (
              <p className="text-xs text-primary">{result.instagramMeta.hashtags.map(h => `#${h}`).join(' ')}</p>
            )}
            {result.instagramMeta.uploadedAt && (
              <p className="text-xs text-foreground/40">{new Date(result.instagramMeta.uploadedAt).toLocaleString()}</p>
            )}
            {result.instagramMeta.authenticityScore !== undefined && (
              <p className="text-xs text-foreground/60">AI Authenticity Score: <span className="font-bold text-primary">{result.instagramMeta.authenticityScore}%</span></p>
            )}
          </div>
        </motion.div>
      )}

      {/* Authority action buttons for authority/admin */}
      {isAuthority && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-primary/5 border border-primary/20 mb-6"
        >
          <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-3">Authority Actions</p>
          <div className="flex flex-wrap gap-2">
            {([
              { label: 'Mark as Fake', status: 'confirmed_fake', cls: 'btn-3d-danger' },
              { label: 'Mark as Real', status: 'verified_real', cls: 'btn-3d-success' },
              { label: 'Mark as Misleading', status: 'misleading', cls: 'btn-3d-warning' },
              { label: 'Escalate Review', status: 'under_investigation', cls: 'btn-3d-ghost' },
            ] as { label: string; status: AuthorityVerdictStatus; cls: string }[]).map((action) => (
              <button
                key={action.status}
                className={`btn-3d btn-sm ${action.cls}`}
                onClick={() => {}}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                {action.label}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Claim text */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-2xl bg-secondary/50 border border-border mb-6"
      >
        <div className="flex items-start gap-2">
          <FileText className="w-4 h-4 mt-0.5 text-foreground/40 flex-shrink-0" />
          <p className="text-sm text-foreground/70 italic">"{result.claim.text}"</p>
        </div>
      </motion.div>

      {/* Verdict + Confidence */}
      {(() => {
        const isUrl = result.claim.inputType === 'url';
        const isImage = result.claim.inputType === 'image';
        const hideConfidence = isUrl || isImage;
        return (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <VerdictCard verdict={result.verdict} confidence={result.confidence} showConfidence={!hideConfidence} />
            {!hideConfidence && (
              <div className="space-y-4 flex flex-col justify-center">
                <ConfidenceMeter value={result.confidence} label={t('result.confidence')} />
                {result.sourceCredibility.length > 0 && (
                  <ConfidenceMeter value={result.sourceCredibility[0]?.trustScore || 0} label="Source Trust" />
                )}
              </div>
            )}
            {hideConfidence && result.sourceCredibility.length > 0 && (
              <div className="space-y-4 flex flex-col justify-center">
                <ConfidenceMeter value={result.sourceCredibility[0]?.trustScore || 0} label="Source Trust" />
              </div>
            )}
          </div>
        );
      })()}


      <Section title="Credibility Score">
        <AICredibilityBreakdown scores={result.aiCredibilityScores} />
      </Section>

      {/* AI Explanation */}
      <Section title={simpleMode ? t('result.explainSimple') : t('result.explanation')}>
        <motion.p
          key={simpleMode ? 'simple' : 'full'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-foreground/70 leading-relaxed whitespace-pre-line"
        >
          {simpleMode ? result.explainLikeIm10 : result.explanation}
        </motion.p>
      </Section>

      {/* Video Content Analysis — only shows for video/reel URLs */}
      {!simpleMode && (
        <VideoAnalysisCard explanation={result.explanation} inputType={result.claim.inputType} />
      )}

      {/* Suspicious Sentences */}
      {result.suspiciousSentences.length > 0 && (
        <Section title={t('result.suspicious')}>
          <SuspiciousSentenceHighlighter sentences={result.suspiciousSentences} />
        </Section>
      )}

      {/* Emotional Manipulation */}
      {result.emotionalSignals.length > 0 && (
        <Section title={t('result.emotional')}>
          <EmotionalManipulationCard signals={result.emotionalSignals} triggers={result.manipulationTriggers} />
        </Section>
      )}

      {/* Claim vs Truth */}
      {result.verifiedCorrection && result.verifiedCorrection !== 'Correction pending...' && (
        <Section title={t('result.compare')}>
          <CompareClaimVsTruth claimText={result.claim.text} truthText={result.verifiedCorrection} />
        </Section>
      )}

      {/* Verified Correction */}
      {result.verifiedCorrection && result.verifiedCorrection !== 'Correction pending...' && (
        <Section title={t('result.correction')}>
          <TrustedCorrectionCard correction={result.verifiedCorrection} />
        </Section>
      )}

      {/* Source Credibility */}
      {result.sourceCredibility.length > 0 && (
        <Section title={t('result.sources')}>
          <TrustedSourceList sources={result.sourceCredibility} />
        </Section>
      )}

      {/* Timeline */}
      {result.timeline.length > 0 && (
        <Section title={t('result.timeline')}>
          <ClaimTimeline events={result.timeline} />
        </Section>
      )}

      {/* Audit Trail */}
      {result.auditTrail.length > 0 && (
        <Section title={t('result.audit')}>
          <div className="space-y-2">
            {result.auditTrail.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50 text-sm">
                <span className="text-[10px] text-foreground/30 whitespace-nowrap mt-0.5">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>
                <div>
                  <span className="font-medium">{entry.action}</span>
                  <span className="text-foreground/40 ml-2">by {entry.actor}</span>
                  <p className="text-xs text-foreground/40 mt-0.5">{entry.details}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mb-8"
    >
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      {children}
    </motion.section>
  );
}

import type { AuthorityVerdict } from '@/types';

function AuthorityVerdictCard({ verdict }: { verdict: AuthorityVerdict }) {
  const configs: Record<string, { label: string; icon: React.ReactNode; bg: string; text: string; border: string }> = {
    confirmed_fake: {
      label: 'Confirmed Fake',
      icon: <AlertTriangle className="w-5 h-5" />,
      bg: 'bg-false/10',
      text: 'text-false',
      border: 'border-false/30',
    },
    verified_real: {
      label: 'Verified Real',
      icon: <CheckCircle2 className="w-5 h-5" />,
      bg: 'bg-verified/10',
      text: 'text-verified',
      border: 'border-verified/30',
    },
    misleading: {
      label: 'Misleading',
      icon: <AlertTriangle className="w-5 h-5" />,
      bg: 'bg-misleading/10',
      text: 'text-misleading',
      border: 'border-misleading/30',
    },
    under_investigation: {
      label: 'Under Investigation',
      icon: <HelpCircle className="w-5 h-5" />,
      bg: 'bg-secondary',
      text: 'text-foreground/60',
      border: 'border-border',
    },
  };
  const cfg = configs[verdict.status] || configs.under_investigation;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-2xl border ${cfg.bg} ${cfg.border} mb-6`}
    >
      <div className="flex items-center gap-2 mb-2">
        <ShieldCheck className="w-4 h-4 text-primary" />
        <p className="text-xs font-semibold text-primary uppercase tracking-wide">Official Authority Verdict</p>
      </div>
      <div className={`flex items-center gap-2 font-semibold text-lg ${cfg.text} mb-1`}>
        {cfg.icon}
        {cfg.label}
      </div>
      <div className="text-xs text-foreground/50 space-y-0.5">
        {verdict.organization && <p>Organization: <span className="text-foreground/70">{verdict.organization}</span></p>}
        <p>Reviewed by: <span className="text-foreground/70">{verdict.reviewedBy}</span></p>
        <p>{new Date(verdict.reviewedAt).toLocaleString()}</p>
        {verdict.notes && <p className="italic text-foreground/60 mt-1">{verdict.notes}</p>}
      </div>
    </motion.div>
  );
}

// ─── VideoAnalysisCard ───
// Renders a rich breakdown when the claim was analyzed as a video (Instagram Reel / YouTube)
export function VideoAnalysisCard({ explanation, inputType }: { explanation: string; inputType: string }) {
  const isVideo = inputType === 'video' || inputType === 'url';
  if (!isVideo || !explanation || explanation === 'Analysis pending...') return null;

  // Parse sections from the rich summary built by analyzeVideoClaim
  const spokenMatch = explanation.match(/📢 Key Claims Spoken in Video:\n([\s\S]*?)(?=\n\n[📢👁️🔍⚠️]|$)/);
  const visualMatch = explanation.match(/👁️ Visual Analysis:\n([\s\S]*?)(?=\n\n[📢👁️🔍⚠️]|$)/);
  const timelineMatch = explanation.match(/🔍 Evidence Timeline:\n([\s\S]*?)(?=\n\n[📢👁️🔍⚠️]|$)/);
  const deepfakeFlag = explanation.includes('⚠️ DEEPFAKE INDICATORS DETECTED');
  const contextFlag = explanation.includes('⚠️ VIDEO APPEARS TO BE OUT-OF-CONTEXT');
  const aiAudioFlag = explanation.includes('⚠️ AI-GENERATED AUDIO DETECTED');

  if (!spokenMatch && !visualMatch && !timelineMatch && !deepfakeFlag && !contextFlag && !aiAudioFlag) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 space-y-4"
    >
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <span className="text-violet-400">🎬</span> Video Content Analysis
      </h3>

      {(deepfakeFlag || contextFlag || aiAudioFlag) && (
        <div className="flex flex-wrap gap-2">
          {deepfakeFlag && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-500/15 text-red-400 border border-red-400/30">
              <AlertTriangle className="w-3.5 h-3.5" /> Deepfake Indicators
            </span>
          )}
          {contextFlag && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-orange-500/15 text-orange-400 border border-orange-400/30">
              <AlertTriangle className="w-3.5 h-3.5" /> Out-of-Context Footage
            </span>
          )}
          {aiAudioFlag && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-yellow-500/15 text-yellow-400 border border-yellow-400/30">
              <AlertTriangle className="w-3.5 h-3.5" /> AI-Generated Audio
            </span>
          )}
        </div>
      )}

      {spokenMatch && (
        <div className="p-4 rounded-2xl bg-secondary/50 border border-border">
          <p className="text-xs font-semibold text-violet-400 uppercase tracking-wide mb-3">📢 Key Claims Spoken</p>
          <ul className="space-y-1.5">
            {spokenMatch[1].trim().split('\n').map((line, i) => (
              <li key={i} className="text-sm text-foreground/70 flex gap-2">
                <span className="text-foreground/30 font-mono shrink-0">{i + 1}.</span>
                <span>{line.replace(/^\d+\.\s*/, '')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {visualMatch && (
        <div className="p-4 rounded-2xl bg-secondary/50 border border-border">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide mb-3">👁️ Visual Analysis</p>
          <ul className="space-y-1.5">
            {visualMatch[1].trim().split('\n').map((line, i) => (
              <li key={i} className="text-sm text-foreground/70 flex gap-2">
                <span className="text-foreground/30 font-mono shrink-0">{i + 1}.</span>
                <span>{line.replace(/^\d+\.\s*/, '')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {timelineMatch && (
        <div className="p-4 rounded-2xl bg-secondary/50 border border-border">
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wide mb-3">🔍 Evidence Timeline</p>
          <div className="space-y-2">
            {timelineMatch[1].trim().split('\n').map((line, i) => {
              const tsMatch = line.match(/^\[([^\]]+)\]\s+([^:]+):\s+(.+?)\s+—\s+(.+)$/);
              if (!tsMatch) return <p key={i} className="text-xs text-foreground/60">{line}</p>;
              const [, ts, type, finding, verdict] = tsMatch;
              const verdictColor = verdict === 'fake' ? 'text-red-400' : verdict === 'real' ? 'text-green-400' : 'text-yellow-400';
              return (
                <div key={i} className="flex items-start gap-3 text-xs">
                  <span className="font-mono text-foreground/40 shrink-0 pt-0.5">{ts}</span>
                  <span className="text-foreground/30 uppercase tracking-wide shrink-0 pt-0.5">{type}</span>
                  <span className="text-foreground/70 flex-1">{finding}</span>
                  <span className={`font-semibold shrink-0 ${verdictColor}`}>{verdict}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
