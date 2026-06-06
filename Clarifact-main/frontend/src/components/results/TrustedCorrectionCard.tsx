import { motion } from 'framer-motion';
import { CheckCircle2, ExternalLink } from 'lucide-react';

interface Props {
  correction: string;
}

export default function TrustedCorrectionCard({ correction }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-verified/30 bg-verified/5 p-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 className="w-5 h-5 text-verified" />
        <h3 className="font-semibold">Verified Correction</h3>
      </div>
      <p className="text-sm text-foreground/80 leading-relaxed">{correction}</p>
    </motion.div>
  );
}
