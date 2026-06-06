import { motion } from 'framer-motion';
import { ExternalLink, Shield } from 'lucide-react';
import type { SourceCredibility } from '@/types';

interface Props {
  sources: SourceCredibility[];
}

export default function TrustedSourceList({ sources }: Props) {
  return (
    <div className="space-y-3">
      {sources.map((source, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08 }}
          className="flex items-center justify-between p-3.5 rounded-xl bg-secondary/50 border border-border"
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              source.stance === 'contradicts' ? 'bg-false/10' : source.stance === 'supports' ? 'bg-verified/10' : 'bg-secondary'
            }`}>
              <Shield className={`w-4 h-4 ${
                source.stance === 'contradicts' ? 'text-false' : source.stance === 'supports' ? 'text-verified' : 'text-foreground/50'
              }`} />
            </div>
            <div>
              <p className="text-sm font-medium">{source.name}</p>
              <p className={`text-xs ${
                source.stance === 'contradicts' ? 'text-false' : source.stance === 'supports' ? 'text-verified' : 'text-foreground/40'
              }`}>
                {source.stance.charAt(0).toUpperCase() + source.stance.slice(1)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-foreground/60">Trust: {source.trustScore}%</span>
            <a href={source.url} target="_blank" rel="noopener" className="text-primary hover:text-primary/80">
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
