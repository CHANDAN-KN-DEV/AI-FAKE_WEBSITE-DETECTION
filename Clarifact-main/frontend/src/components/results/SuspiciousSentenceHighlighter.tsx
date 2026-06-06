import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import type { SuspiciousSentence } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  sentences: SuspiciousSentence[];
}

const severityColors = {
  low: 'border-l-yellow-400 bg-yellow-500/5',
  medium: 'border-l-amber-500 bg-amber-500/5',
  high: 'border-l-red-500 bg-red-500/5',
};

export default function SuspiciousSentenceHighlighter({ sentences }: Props) {
  return (
    <div className="space-y-3">
      {sentences.map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className={cn('border-l-4 rounded-r-xl p-4', severityColors[s.severity])}
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className={cn('w-4 h-4 mt-0.5 flex-shrink-0', 
              s.severity === 'high' ? 'text-red-500' : s.severity === 'medium' ? 'text-amber-500' : 'text-yellow-400'
            )} />
            <div>
              <p className="text-sm font-medium mb-1">"{s.text}"</p>
              <p className="text-xs text-foreground/50">{s.reason}</p>
            </div>
          </div>
          <span className={cn('inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase',
            s.severity === 'high' ? 'bg-red-500/20 text-red-400' : 
            s.severity === 'medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-yellow-500/20 text-yellow-400'
          )}>{s.severity} severity</span>
        </motion.div>
      ))}
    </div>
  );
}
