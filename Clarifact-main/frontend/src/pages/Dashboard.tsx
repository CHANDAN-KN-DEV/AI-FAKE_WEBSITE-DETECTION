import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import AlertsPanel from '@/components/dashboard/AlertsPanel';
import FeaturedClaimCard from '@/components/dashboard/FeaturedClaimCard';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import { getTopPicks, getAlerts, getAuthorityCompletedClaims } from '@/services/api';
import { useLanguageStore } from '@/store/languageStore';
import type { TopPick, Alert, VerdictType } from '@/types';

export default function Dashboard() {
  const [topPicks, setTopPicks] = useState<TopPick[]>([]);
  const [authorityPicks, setAuthorityPicks] = useState<TopPick[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState([
    { label: 'Total Claims', value: '0', color: 'text-primary' },
    { label: 'Verified Today', value: '0', color: 'text-verified' },
    { label: 'False Detected', value: '0', color: 'text-false' },
    { label: 'Active Validators', value: '0', color: 'text-violet-400' },
  ]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguageStore();

  useEffect(() => {
    Promise.all([
      getTopPicks(),
      getAlerts(),
      getAuthorityCompletedClaims()
    ]).then(([tp, al, authClaims]) => {
        setTopPicks(tp);
        setAlerts(al);

        // Map authority claims to TopPick format
        const mappedAuthPicks: TopPick[] = authClaims.map((claim: any) => {
          let verdictStr: VerdictType = 'unverified';
          if (claim.myVote === 'TRUE' || claim.authorityVerdicts?.[0]?.verdict === 'TRUE') verdictStr = 'verified';
          if (claim.myVote === 'FALSE' || claim.authorityVerdicts?.[0]?.verdict === 'FALSE') verdictStr = 'false';
          if (claim.myVote === 'MISLEADING' || claim.authorityVerdicts?.[0]?.verdict === 'MISLEADING') verdictStr = 'misleading';

          return {
            id: claim.id,
            claim: claim.title || claim.text?.slice(0, 100) || claim.url || 'Authority Claim',
            verdict: verdictStr,
            confidence: 100, // Authorities have 100% confidence
            trending: true,
            category: 'Authority Verified'
          };
        });
        setAuthorityPicks(mappedAuthPicks);

        const totalClaims = tp.length;
        const falseDetected = tp.filter((p) => p.verdict === 'false').length;
        const verifiedToday = tp.filter((p) => p.verdict === 'verified').length;
        const activeValidators = Math.max(1, al.length);
        setStats([
          { label: 'Total Claims', value: totalClaims.toLocaleString(), color: 'text-primary' },
          { label: 'Verified Today', value: verifiedToday.toLocaleString(), color: 'text-verified' },
          { label: 'False Detected', value: falseDetected.toLocaleString(), color: 'text-false' },
          { label: 'Active Validators', value: activeValidators.toLocaleString(), color: 'text-violet-400' },
        ]);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="max-w-6xl mx-auto p-6"><LoadingSkeleton count={5} /></div>;

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-8 pb-24 lg:pb-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold mb-1">{t('dashboard.title')}</h1>
        <p className="text-sm text-foreground/50 mb-6">Real-time misinformation overview and insights.</p>
      </motion.div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-4 rounded-2xl bg-card border border-border text-center"
          >
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-foreground/40 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>



      {/* Alerts */}
      <div>
        <h3 className="font-semibold mb-4">{t('dashboard.alerts')}</h3>
        <AlertsPanel alerts={alerts} />
      </div>

      {/* Verified By Authorities Cards */}
      <div>
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-violet-400" /> Verified By Authorities
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...authorityPicks, ...topPicks].slice(0, 3).map((pick) => (
            <FeaturedClaimCard key={pick.id} claim={pick} />
          ))}
        </div>
      </div>
    </div>
  );
}
