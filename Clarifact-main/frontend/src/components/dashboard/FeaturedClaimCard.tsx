import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Flame } from 'lucide-react';
import type { TopPick } from '@/types';
import { cn, getVerdictColor, getVerdictBg, truncate } from '@/lib/utils';

interface Props {
  claim: TopPick;
}

export default function FeaturedClaimCard({ claim }: Props) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={cn('rounded-2xl border p-5 transition-all hover:shadow-md', getVerdictBg(claim.verdict))}
    >
      <Link to={`/result/${claim.id}`}>
        {claim.trending && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 mb-2">
            <Flame className="w-3 h-3" /> FEATURED
          </span>
        )}
        <p className="text-sm font-medium mb-3 leading-relaxed">{truncate(claim.claim, 120)}</p>
        <div className="flex items-center justify-between">
          <span className={cn('text-xs font-bold uppercase', getVerdictColor(claim.verdict))}>{claim.verdict}</span>
          <span className="text-xs text-foreground/40">{claim.category}</span>
        </div>
      </Link>
    </motion.div>
  );
}
