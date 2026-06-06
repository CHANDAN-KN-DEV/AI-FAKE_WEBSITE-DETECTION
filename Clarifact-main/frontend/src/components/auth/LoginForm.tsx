import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useLanguageStore } from '@/store/languageStore';
import toast from 'react-hot-toast';

const REMEMBER_EMAIL_KEY = 'clarifact-remember-email';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginAs, setLoginAs] = useState<'user' | 'authority'>('user');
  const [organization, setOrganization] = useState('');
  const { login, isLoading } = useAuthStore();
  const { t } = useLanguageStore();
  const navigate = useNavigate();

  // Pre-fill saved email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    try {
      await login(email, password);
      // Persist or clear email based on checkbox
      if (rememberMe) {
        localStorage.setItem(REMEMBER_EMAIL_KEY, email);
      } else {
        localStorage.removeItem(REMEMBER_EMAIL_KEY);
      }
      toast.success('Welcome back!');
      const role = useAuthStore.getState().user?.role;
      if (role === 'admin') {
        navigate('/admin/review');
      } else if (role === 'expert' || role === 'validator') {
        navigate('/authority/dashboard');
      } else {
        navigate('/home');
      }
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      {/* Role selector */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setLoginAs('user')}
          className={`flex-1 btn-3d btn-sm ${
            loginAs === 'user' ? 'btn-3d-primary' : 'btn-3d-ghost'
          }`}
        >
          User
        </button>
        <button
          type="button"
          onClick={() => setLoginAs('authority')}
          className={`flex-1 btn-3d btn-sm ${
            loginAs === 'authority' ? 'btn-3d-primary' : 'btn-3d-ghost'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Authority
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground/70 mb-1.5">{t('auth.email')}</label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full pl-11 pr-4 py-3 bg-secondary border border-border rounded-xl text-sm placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground/70 mb-1.5">{t('auth.password')}</label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full pl-11 pr-11 py-3 bg-secondary border border-border rounded-xl text-sm placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/60"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Organization field — shown only for authority login */}
      {loginAs === 'authority' && (
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1.5">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-violet-400" /> Organization</span>
          </label>
          <input
            type="text"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            placeholder="Your organization name"
            className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-sm placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
        </div>
      )}

      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 text-foreground/60 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="rounded border-border accent-primary w-4 h-4"
          />
          Remember me
        </label>
        <a href="#" className="text-primary hover:underline">{t('auth.forgotPassword')}</a>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="btn-3d-primary btn-lg w-full"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            {t('auth.login')}
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      <p className="text-center text-sm text-foreground/50">
        {t('auth.noAccount')}{' '}
        <Link to="/register" className="text-primary font-medium hover:underline">{t('auth.register')}</Link>
      </p>
    </motion.form>
  );
}

