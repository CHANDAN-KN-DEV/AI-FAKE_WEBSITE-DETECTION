import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import LeaderboardTable from '@/components/dashboard/LeaderboardTable';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import { getLeaderboard } from '@/services/api';
import { useLanguageStore } from '@/store/languageStore';
import type { LeaderboardEntry } from '@/types';

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

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 pb-24 lg:pb-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center gap-2 mb-1">
          <Trophy className="w-6 h-6 text-amber-400" />
          <h1 className="text-2xl font-bold">{t('leaderboard.title')}</h1>
        </div>
        <p className="text-sm text-foreground/50 mb-6">Top contributors fighting misinformation.</p>
      </motion.div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <LeaderboardTable entries={entries} />
      </div>
    </div>
  );
}
