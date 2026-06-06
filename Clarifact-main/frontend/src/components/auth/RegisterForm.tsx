import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, UserIcon } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useLanguageStore } from '@/store/languageStore';
import toast from 'react-hot-toast';

export default function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { register, isLoading } = useAuthStore();
  const { t } = useLanguageStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirm) {
      toast.error('Please fill in all fields');
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    try {
      await register(name, email, password);
      toast.success('Account created!');
      navigate('/home');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <div>
        <label className="block text-sm font-medium text-foreground/70 mb-1.5">{t('auth.name')}</label>
        <div className="relative">
          <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe"
            className="w-full pl-11 pr-4 py-3 bg-secondary border border-border rounded-xl text-sm placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground/70 mb-1.5">{t('auth.email')}</label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
            className="w-full pl-11 pr-4 py-3 bg-secondary border border-border rounded-xl text-sm placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground/70 mb-1.5">{t('auth.password')}</label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
          <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
            className="w-full pl-11 pr-11 py-3 bg-secondary border border-border rounded-xl text-sm placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/60">
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground/70 mb-1.5">{t('auth.confirmPassword')}</label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••"
            className="w-full pl-11 pr-4 py-3 bg-secondary border border-border rounded-xl text-sm placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="btn-3d-primary btn-lg w-full"
      >
        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{t('auth.register')} <ArrowRight className="w-4 h-4" /></>}
      </button>

      <p className="text-center text-sm text-foreground/50">
        {t('auth.hasAccount')}{' '}
        <Link to="/login" className="text-primary font-medium hover:underline">{t('auth.login')}</Link>
      </p>
    </motion.form>
  );
}
