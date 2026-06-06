import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Shield } from 'lucide-react';
import LeaderboardTable from '@/components/dashboard/LeaderboardTable';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import { getLeaderboard } from '@/services/api';
import { useLanguageStore } from '@/store/languageStore';
import type { LeaderboardEntry } from '@/types';
import ValidatorBadge from '@/components/results/ValidatorBadge';

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguageStore();

  useEffect(() => {
    getLeaderboard().then((data) => {
      setEntries(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="max-w-4xl mx-auto p-6"><LoadingSkeleton count={5} /></div>;

  // Extract top 3 entries for the podium display
  const first = entries.find(e => e.rank === 1);
  const second = entries.find(e => e.rank === 2);
  const third = entries.find(e => e.rank === 3);

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 pb-24 lg:pb-6 space-y-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center gap-2 mb-1">
          <Trophy className="w-6 h-6 text-amber-400" />
          <h1 className="text-2xl font-bold">{t('leaderboard.title')}</h1>
        </div>
        <p className="text-sm text-foreground/50 mb-6">Top contributors fighting misinformation.</p>
      </motion.div>

      {/* 3D Podium Display */}
      {entries.length >= 3 && first && second && third && (
        <div className="grid grid-cols-3 gap-4 items-end max-w-2xl mx-auto pt-6 pb-2 px-2">
          
          {/* 2nd Place */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: [0, -6, 0] }}
            transition={{ 
              opacity: { duration: 0.5 },
              y: { repeat: Infinity, duration: 3.2, ease: 'easeInOut', delay: 0.2 }
            }}
            className="flex flex-col items-center group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-base font-bold shadow-lg border border-white/10 relative">
              {second.user.name[0]}
              <span className="absolute -top-2 -right-2 text-base">🥈</span>
            </div>
            <p className="text-xs font-bold mt-2 text-foreground truncate max-w-full">{second.user.name}</p>
            <p className="text-[10px] text-foreground/40 mt-0.5"><ValidatorBadge role={second.user.role} /></p>
            
            {/* Podium Pillar */}
            <div className="w-full mt-3 h-24 bg-card/65 border border-slate-400/20 rounded-t-2xl shadow-xl flex flex-col items-center justify-center p-2 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-400/0 via-slate-400/0 to-slate-400/5 pointer-events-none" />
              <span className="text-2xl font-extrabold text-slate-400">2</span>
              <span className="text-[10px] font-mono text-primary mt-1 font-semibold">{second.score.toLocaleString()}</span>
            </div>
          </motion.div>

          {/* 1st Place */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: [0, -8, 0] }}
            transition={{ 
              opacity: { duration: 0.5, delay: 0.1 },
              y: { repeat: Infinity, duration: 3, ease: 'easeInOut' }
            }}
            className="flex flex-col items-center group cursor-pointer relative z-10"
          >
            {/* Crown decoration */}
            <span className="text-xl animate-bounce mb-1">👑</span>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-white text-lg font-bold shadow-xl shadow-amber-500/20 border border-white/20 relative">
              {first.user.name[0]}
              <span className="absolute -top-2 -right-2 text-lg">🥇</span>
            </div>
            <p className="text-sm font-extrabold mt-2 text-foreground truncate max-w-full">{first.user.name}</p>
            <p className="text-[10px] text-foreground/40 mt-0.5"><ValidatorBadge role={first.user.role} /></p>
            
            {/* Podium Pillar */}
            <div className="w-full mt-3 h-32 bg-card border-t border-x border-amber-400/30 rounded-t-2xl shadow-2xl flex flex-col items-center justify-center p-2 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-amber-400/0 via-amber-400/0 to-amber-400/10 pointer-events-none" />
              <span className="text-4xl font-black text-amber-400">1</span>
              <span className="text-xs font-mono text-primary mt-1 font-bold">{first.score.toLocaleString()}</span>
            </div>
          </motion.div>

          {/* 3rd Place */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: [0, -4, 0] }}
            transition={{ 
              opacity: { duration: 0.5, delay: 0.2 },
              y: { repeat: Infinity, duration: 3.4, ease: 'easeInOut', delay: 0.4 }
            }}
            className="flex flex-col items-center group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-white text-sm font-bold shadow-lg border border-white/10 relative">
              {third.user.name[0]}
              <span className="absolute -top-2 -right-2 text-sm">🥉</span>
            </div>
            <p className="text-xs font-bold mt-2 text-foreground truncate max-w-full">{third.user.name}</p>
            <p className="text-[10px] text-foreground/40 mt-0.5"><ValidatorBadge role={third.user.role} /></p>
            
            {/* Podium Pillar */}
            <div className="w-full mt-3 h-16 bg-card/45 border border-orange-500/20 rounded-t-2xl shadow-lg flex flex-col items-center justify-center p-2 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-orange-500/0 via-orange-500/0 to-orange-500/5 pointer-events-none" />
              <span className="text-xl font-extrabold text-orange-600">3</span>
              <span className="text-[10px] font-mono text-primary mt-0.5 font-semibold">{third.score.toLocaleString()}</span>
            </div>
          </motion.div>

        </div>
      )}

      {/* Main List Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xl">
        <LeaderboardTable entries={entries} />
      </div>
    </div>
  );
}
