import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2 } from 'lucide-react';
import { useLanguageStore } from '@/store/languageStore';

interface Props {
  onSubmit: (text: string) => void;
  isLoading?: boolean;
}

export default function ClaimInputBox({ onSubmit, isLoading }: Props) {
  const [text, setText] = useState('');
  const { t } = useLanguageStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) onSubmit(text.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('check.textPlaceholder')}
          rows={4}
          className="w-full p-4 bg-secondary border border-border rounded-2xl text-sm placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
        />
        <span className="absolute bottom-3 right-3 text-xs text-foreground/30">{text.length}/2000</span>
      </div>
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        type="submit"
        disabled={isLoading || !text.trim()}
        className="w-full py-3 bg-gradient-to-r from-blue-500 to-violet-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50"
      >
        {isLoading ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> {t('check.analyzing')}</>
        ) : (
          <><Search className="w-4 h-4" /> {t('check.submit')}</>
        )}
      </motion.button>
    </form>
  );
}
