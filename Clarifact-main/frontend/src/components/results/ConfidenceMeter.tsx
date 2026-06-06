import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Props {
  value: number;
  label?: string;
}

export default function ConfidenceMeter({ value, label = 'Confidence' }: Props) {
  const color =
    value >= 80 ? 'from-green-500 to-emerald-400' :
    value >= 50 ? 'from-amber-500 to-yellow-400' :
    'from-red-500 to-orange-400';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground/70">{label}</span>
        <span className="text-sm font-bold">{value}%</span>
      </div>
      <div className="h-3 bg-secondary rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={cn('h-full rounded-full bg-gradient-to-r', color)}
        />
      </div>
    </div>
  );
}
