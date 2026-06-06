import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useThemeStore } from '@/store/themeStore';
import { cn } from '@/lib/utils';

export default function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      onClick={toggleTheme}
      className={cn(
        'relative p-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors',
        className
      )}
      aria-label="Toggle theme"
    >
      <motion.div
        initial={false}
        animate={{ rotate: theme === 'dark' ? 180 : 0 }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
      >
        {theme === 'dark' ? (
          <Sun className="w-5 h-5 text-yellow-400" />
        ) : (
          <Moon className="w-5 h-5 text-slate-700" />
        )}
      </motion.div>
    </motion.button>
  );
}
