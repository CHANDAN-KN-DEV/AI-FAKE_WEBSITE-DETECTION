import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Loader2, Search } from 'lucide-react';
import { useLanguageStore } from '@/store/languageStore';

interface Props {
  onSubmit: (text: string) => void;
  isLoading?: boolean;
}

export default function WhatsAppForwardChecker({ onSubmit, isLoading }: Props) {
  const [text, setText] = useState('');
  const { t } = useLanguageStore();

  return (
    <div className="space-y-3">
      <div className="relative">
        <MessageCircle className="absolute left-3.5 top-4 w-4 h-4 text-green-500/60" />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('check.whatsappPlaceholder')}
          rows={5}
          className="w-full pl-11 pr-4 py-3 bg-secondary border border-green-500/20 rounded-xl text-sm placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500/50 transition-all resize-none"
        />
      </div>
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => text.trim() && onSubmit(text.trim())}
        disabled={isLoading || !text.trim()}
        className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-4 h-4" />}
        {isLoading ? t('check.analyzing') : t('check.submit')}
      </motion.button>
    </div>
  );
}
