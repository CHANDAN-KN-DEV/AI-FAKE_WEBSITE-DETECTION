import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import LoginForm from '@/components/auth/LoginForm';
import ThemeToggle from '@/components/layout/ThemeToggle';
import LightRays from '@/components/common/LightRays';
import { useThemeStore } from '@/store/themeStore';
import { useLanguageStore } from '@/store/languageStore';

export default function Login() {
  const { theme } = useThemeStore();
  const { t } = useLanguageStore();

  return (
    <div className="min-h-screen relative overflow-hidden">
      <LightRays
        raysOrigin="top-center"
        raysColor={theme === 'dark' ? '#ffffff' : '#8b5cf6'}
        raysSpeed={0.8}
        lightSpread={1.2}
        rayLength={1.5}
        followMouse={true}
        mouseInfluence={0.1}
        noiseAmount={0.01}
        distortion={0.02}
        className="opacity-60"
      />
      <div className="relative z-10 min-h-screen flex flex-col">
        <div className="flex justify-between items-center p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent tracking-tight">
                Clarifact
              </span>
              <span className="text-xs text-foreground/60 font-medium tracking-wide uppercase">
                Verify Claims Instantly
              </span>
            </div>
          </div>
          <ThemeToggle />
        </div>
        <div className="flex-1 flex items-center justify-center px-6 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-8 shadow-2xl"
          >
            <h2 className="text-2xl font-bold mb-1">{t('auth.login')}</h2>
            <p className="text-foreground/50 mb-8 text-sm">{t('auth.loginSubtitle')}</p>
            <LoginForm />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
