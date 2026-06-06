import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';
import type { VerdictType } from '@/types';
import { cn, getVerdictBg } from '@/lib/utils';

interface Props {
  verdict: VerdictType;
  confidence: number;
  className?: string;
  showConfidence?: boolean;
}

const verdictConfig = {
  verified: { icon: CheckCircle2, label: 'Verified', color: 'text-verified', glow: 'shadow-green-500/20' },
  misleading: { icon: AlertTriangle, label: 'Misleading', color: 'text-misleading', glow: 'shadow-amber-500/20' },
  false: { icon: XCircle, label: 'False', color: 'text-false', glow: 'shadow-red-500/20' },
  unverified: { icon: HelpCircle, label: 'Unverified', color: 'text-foreground/50', glow: '' },
};

export default function VerdictCard({ verdict, confidence, className, showConfidence = true }: Props) {
  const config = verdictConfig[verdict];
  const Icon = config.icon;

  // Unverified: render as a small compact inline badge, not a full card
  if (verdict === 'unverified') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className={cn(
          'flex items-center gap-3 rounded-2xl border border-border bg-secondary/40 px-4 py-3',
          className
        )}
      >
        <HelpCircle className="w-5 h-5 text-foreground/40 flex-shrink-0" />
        <div>
          <span className="text-sm font-semibold text-foreground/60">Unverified</span>
          {showConfidence && (
            <p className="text-xs text-foreground/40 mt-0.5">Confidence: {confidence}%</p>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, type: 'spring' }}
      className={cn(
        'relative overflow-hidden rounded-2xl border p-6 text-center shadow-lg',
        getVerdictBg(verdict),
        config.glow && `shadow-xl ${config.glow}`,
        className
      )}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
      >
        <Icon className={cn('w-16 h-16 mx-auto mb-3', config.color)} />
      </motion.div>
      <h2 className={cn('text-3xl font-bold mb-1', config.color)}>{config.label}</h2>
      {showConfidence && (
        <p className="text-sm text-foreground/50">Confidence: {confidence}%</p>
      )}
    </motion.div>
  );
}

