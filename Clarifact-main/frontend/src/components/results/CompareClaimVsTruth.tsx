import { motion } from 'framer-motion';
import { ArrowRight, XCircle, CheckCircle2 } from 'lucide-react';

interface Props {
  claimText: string;
  truthText: string;
}

export default function CompareClaimVsTruth({ claimText, truthText }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid md:grid-cols-2 gap-4"
    >
      <div className="rounded-2xl border border-false/30 bg-false/5 p-5">
        <div className="flex items-center gap-2 mb-3">
          <XCircle className="w-5 h-5 text-false" />
          <h4 className="font-semibold text-false">The Claim</h4>
        </div>
        <p className="text-sm text-foreground/70 leading-relaxed">{claimText}</p>
      </div>
      <div className="rounded-2xl border border-verified/30 bg-verified/5 p-5">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="w-5 h-5 text-verified" />
          <h4 className="font-semibold text-verified">The Truth</h4>
        </div>
        <p className="text-sm text-foreground/70 leading-relaxed">{truthText}</p>
      </div>
    </motion.div>
  );
}
