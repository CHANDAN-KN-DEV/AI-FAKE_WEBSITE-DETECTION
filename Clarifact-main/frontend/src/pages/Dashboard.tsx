import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import AlertsPanel from '@/components/dashboard/AlertsPanel';
import FeaturedClaimCard from '@/components/dashboard/FeaturedClaimCard';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import { getTopPicks, getAlerts, getAuthorityCompletedClaims } from '@/services/api';
import { useLanguageStore } from '@/store/languageStore';
import type { TopPick, Alert, VerdictType } from '@/types';

// Simple interactive stats count-up animation component
function CountUp({ value }: { value: string }) {
  const [count, setCount] = useState(0);
  const target = parseInt(value.replace(/,/g, ''), 10) || 0;

  useEffect(() => {
    if (target === 0) {
      setCount(0);
      return;
    }
    let start = 0;
    const duration = 800; // ms
    const increment = Math.ceil(target / 25);
    const stepTime = 30; // ms

    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        clearInterval(timer);
        setCount(target);
      } else {
        setCount(start);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [target]);

  return <>{isNaN(target) ? value : count.toLocaleString()}</>;
}

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
  const [searchQuery, setSearchQuery] = useState('');
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
          { label: 'Total Claims', value: totalClaims.toString(), color: 'text-primary' },
          { label: 'Verified Today', value: verifiedToday.toString(), color: 'text-verified' },
          { label: 'False Detected', value: falseDetected.toString(), color: 'text-false' },
          { label: 'Active Validators', value: activeValidators.toString(), color: 'text-violet-400' },
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
            whileHover={{ y: -4, scale: 1.02 }}
            className="p-5 rounded-2xl bg-card border border-border text-center shadow-md hover:shadow-indigo-500/5 relative overflow-hidden group transition-all duration-300"
          >
            {/* Background neon visual flare */}
            <div className="absolute -right-6 -bottom-6 w-16 h-16 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-all pointer-events-none" />
            <p className={`text-3xl font-extrabold tracking-tight ${stat.color} font-display relative z-10`}>
              <CountUp value={stat.value} />
            </p>
            <p className="text-xs font-semibold text-foreground/50 tracking-wider uppercase mt-1 relative z-10">{stat.label}</p>
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-violet-400" /> Verified By Authorities
          </h3>
          {/* Quick search input */}
          <div className="relative max-w-xs w-full">
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-secondary/80 border border-border/80 rounded-xl text-xs placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
            <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(() => {
            const combined = [...authorityPicks, ...topPicks];
            const filtered = combined.filter(pick => 
              pick.claim.toLowerCase().includes(searchQuery.toLowerCase()) || 
              pick.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
              pick.verdict.toLowerCase().includes(searchQuery.toLowerCase())
            );
            if (filtered.length === 0) {
              return <p className="text-sm text-foreground/40 col-span-full py-4 text-center">No matching verified reports found.</p>;
            }
            return filtered.slice(0, 6).map((pick) => (
              <FeaturedClaimCard key={pick.id} claim={pick} />
            ));
          })()}
        </div>
      </div>
    </div>
  );
}
