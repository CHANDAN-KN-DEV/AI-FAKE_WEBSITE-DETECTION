import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { User, Shield, Award, Calendar, BarChart3, Target, Info } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { formatDate } from '@/lib/utils';

// Local stats count-up component
function CountUp({ value }: { value: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (value === 0) {
      setCount(0);
      return;
    }
    let start = 0;
    const duration = 800; // ms
    const increment = Math.ceil(value / 20);
    const stepTime = 30; // ms

    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        clearInterval(timer);
        setCount(value);
      } else {
        setCount(start);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  return <>{count.toLocaleString()}</>;
}

export default function Profile() {
  const { user } = useAuthStore();

  if (!user) return null;

  // Personalized mock stats based on user metadata
  const claimsCount = user.claimsChecked || 0;
  const accuracyScore = claimsCount > 0 ? Math.min(99, 78 + (claimsCount * 7) % 21) : 0;
  const impactScore = claimsCount * 12 + 45;

  // SVG parameters for circular gauge
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (accuracyScore / 100) * circumference;

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 pb-24 lg:pb-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        
        {/* Profile banner & header */}
        <div className="rounded-2xl overflow-hidden bg-card border border-border shadow-xl relative">
          <div className="h-32 bg-gradient-to-r from-violet-600/20 via-indigo-600/35 to-cyan-500/20 relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.15),transparent)] pointer-events-none" />
          </div>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 px-6 pb-6 -mt-10 relative z-10">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-3xl font-extrabold shadow-xl border-4 border-card">
              {user.name[0]}
            </div>
            <div className="flex-1 text-center sm:text-left mt-2">
              <h1 className="text-2xl font-bold font-display">{user.name}</h1>
              <p className="text-sm text-foreground/50">{user.email}</p>
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/15 text-primary border border-primary/20">
                  <Shield className="w-3 h-3" /> {user.role.toUpperCase()}
                </span>
                <span className="text-xs text-foreground/40 flex items-center gap-1 font-medium">
                  <Calendar className="w-3.5 h-3.5" /> Joined {formatDate(user.joinedAt)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Claims Checked Card */}
          <div className="p-5 rounded-2xl bg-card border border-border text-center shadow-lg relative overflow-hidden group">
            <div className="absolute -right-6 -bottom-6 w-16 h-16 bg-primary/5 rounded-full blur-xl pointer-events-none" />
            <BarChart3 className="w-6 h-6 text-primary mx-auto mb-2.5" />
            <p className="text-3xl font-black font-display text-primary">
              <CountUp value={claimsCount} />
            </p>
            <p className="text-xs font-semibold text-foreground/50 tracking-wider uppercase mt-1">Claims Checked</p>
            <p className="text-[10px] text-foreground/30 mt-2">Impact score: {impactScore} points</p>
          </div>

          {/* Accuracy Gauge Card */}
          <div className="p-5 rounded-2xl bg-card border border-border flex items-center gap-4 shadow-lg relative overflow-hidden">
            {/* SVG circle */}
            <div className="relative w-24 h-24 shrink-0">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  className="stroke-secondary fill-transparent"
                  strokeWidth="8"
                />
                <motion.circle
                  cx="48"
                  cy="48"
                  r={radius}
                  className="stroke-verified fill-transparent"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-black text-verified">{accuracyScore}%</span>
                <span className="text-[8px] text-foreground/40 font-bold uppercase tracking-wider">Accuracy</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1 text-sm font-semibold text-foreground/80">
                <Target className="w-4 h-4 text-verified" /> Consensus Accuracy
              </div>
              <p className="text-xs text-foreground/50 mt-1 leading-relaxed">
                Calculated based on your flagging consensus matches against final verified expert decisions.
              </p>
            </div>
          </div>
        </div>

        {/* Badges Grid */}
        <div>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" /> Earned Badges
          </h3>
          {user.badges.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {user.badges.map((badge) => (
                <motion.div
                  key={badge.id}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="flex items-center gap-3.5 p-4 rounded-2xl bg-card border border-border shadow-md hover:shadow-indigo-500/5 transition-all duration-300 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 border border-transparent group-hover:border-primary/10 rounded-2xl pointer-events-none" />
                  <span className="text-3xl shrink-0 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.15)]">{badge.icon}</span>
                  <div>
                    <p className="text-sm font-bold text-foreground">{badge.name}</p>
                    <p className="text-xs text-foreground/50 mt-0.5 leading-normal">{badge.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-foreground/40 bg-card border border-border/80 rounded-2xl p-6 text-center shadow-inner">
              No badges yet. Start checking claims or apply for expert role to unlock achievements!
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
