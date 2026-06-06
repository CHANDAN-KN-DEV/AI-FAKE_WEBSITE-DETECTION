import { motion } from 'framer-motion';
import { Brain, AlertOctagon } from 'lucide-react';
import type { EmotionalSignal } from '@/types';

interface Props {
  signals: EmotionalSignal[];
  triggers: string[];
}

export default function EmotionalManipulationCard({ signals, triggers }: Props) {
  const avgIntensity = signals.reduce((a, s) => a + s.intensity, 0) / signals.length;
  const riskLevel = avgIntensity > 0.7 ? 'High' : avgIntensity > 0.4 ? 'Medium' : 'Low';
  const riskColor = avgIntensity > 0.7 ? 'text-false' : avgIntensity > 0.4 ? 'text-misleading' : 'text-verified';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-violet-400" />
          <h3 className="font-semibold">Emotional Manipulation</h3>
        </div>
        <span className={`text-sm font-bold ${riskColor}`}>{riskLevel} Risk</span>
      </div>

      <div className="space-y-3">
        {signals.map((s, i) => (
          <div key={i} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-foreground/70">{s.type}</span>
              <span className="font-medium">{Math.round(s.intensity * 100)}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${s.intensity * 100}%` }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
                className={`h-full rounded-full ${
                  s.intensity > 0.7 ? 'bg-red-500' : s.intensity > 0.4 ? 'bg-amber-500' : 'bg-green-500'
                }`}
              />
            </div>
            <p className="text-xs text-foreground/40">{s.description}</p>
          </div>
        ))}
      </div>

      {triggers.length > 0 && (
        <div className="border-t border-border pt-3">
          <div className="flex items-center gap-1.5 mb-2">
            <AlertOctagon className="w-4 h-4 text-misleading" />
            <span className="text-sm font-medium">Manipulation Triggers</span>
          </div>
          <ul className="space-y-1">
            {triggers.map((t, i) => (
              <li key={i} className="text-xs text-foreground/50 flex items-start gap-2">
                <span className="text-misleading mt-0.5">•</span> {t}
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
