import { motion } from 'framer-motion';
import { Shield, Sparkles, CheckSquare, Award, MessageCircle } from 'lucide-react';
import RegisterForm from '@/components/auth/RegisterForm';
import ThemeToggle from '@/components/layout/ThemeToggle';
import LightRays from '@/components/common/LightRays';
import { useThemeStore } from '@/store/themeStore';
import { useLanguageStore } from '@/store/languageStore';

export default function Register() {
  const { theme } = useThemeStore();
  const { t } = useLanguageStore();

  return (
    <div className="min-h-screen relative overflow-hidden flex bg-[#080c1a]">
      {/* Visual Light Background Effect */}
      <LightRays
        raysOrigin="top-center"
        raysColor={theme === 'dark' ? '#6366f1' : '#8b5cf6'}
        raysSpeed={0.8}
        lightSpread={1.2}
        rayLength={1.5}
        followMouse={true}
        mouseInfluence={0.1}
        noiseAmount={0.01}
        distortion={0.02}
        className="opacity-50"
      />

      {/* Split-panel: Left Side Visuals */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative border-r border-[#1e2d4a]/50 bg-gradient-to-br from-[#080c1a] via-[#0c122c] to-[#040610] overflow-hidden z-10">
        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e2d4a_1px,transparent_1px),linear-gradient(to_bottom,#1e2d4a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20" />

        {/* Top Branding Logo */}
        <div className="flex items-center gap-4 relative z-20">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center shadow-lg shadow-indigo-500/35 border border-white/10">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black text-white tracking-tight font-display">
              Clarifact
            </span>
            <span className="text-xs text-indigo-300 font-semibold tracking-wider uppercase">
              Truth Intelligence
            </span>
          </div>
        </div>

        {/* Middle Value Proposition */}
        <div className="my-auto space-y-8 relative z-20 max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-400/20 text-violet-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> Join the Truth Movement
            </div>
            <h1 className="text-4xl font-extrabold text-white leading-tight font-display tracking-tight">
              Become a Verified <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">Information Guardian</span>
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Create your account to start flagging news, verifying community claims, earning badges, and climbing the ranking leaderboard.
            </p>
          </motion.div>

          {/* Action Benefits List */}
          <div className="space-y-4 pt-4">
            {[
              { icon: CheckSquare, title: 'Earn Credibility Score', desc: 'Gain points for accurate claims checking assessments.', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
              { icon: Award, title: 'Collect Badges', desc: 'Unlock exclusive profile badges for special contributions.', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
              { icon: MessageCircle, title: 'Participate in Discussion', desc: 'Engage in post discussions with other fact checkers.', color: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20' }
            ].map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                  className="flex gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] backdrop-blur-md hover:bg-white/[0.04] transition-colors duration-300"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${pillar.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{pillar.title}</h3>
                    <p className="text-xs text-slate-400 mt-1">{pillar.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="text-xs text-slate-500 relative z-20">
          © {new Date().getFullYear()} Clarifact Inc. All rights reserved.
        </div>
      </div>

      {/* Right Side: Auth Form Panel */}
      <div className="flex-1 flex flex-col justify-between relative z-10">
        {/* Top Bar with theme switcher */}
        <div className="flex justify-between items-center p-6 lg:justify-end">
          <div className="flex items-center gap-3 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center shadow-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Clarifact</span>
          </div>
          <ThemeToggle />
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-6 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md bg-card/45 backdrop-blur-md border border-border/40 rounded-2xl p-8 shadow-2xl relative overflow-hidden"
          >
            {/* Glowing card outline effect */}
            <div className="absolute inset-0 border border-indigo-500/20 rounded-2xl pointer-events-none" />
            <div className="absolute -top-12 -left-12 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

            <h2 className="text-2xl font-bold mb-1 text-foreground">{t('auth.register')}</h2>
            <p className="text-foreground/50 mb-8 text-sm">{t('auth.registerSubtitle')}</p>
            
            <RegisterForm />
          </motion.div>
        </div>

        {/* Small screen footer */}
        <div className="text-[10px] text-foreground/30 text-center pb-6 lg:hidden">
          © {new Date().getFullYear()} Clarifact. All rights reserved.
        </div>
      </div>
    </div>
  );
}
