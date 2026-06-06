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
      <button
        onClick={() => text.trim() && onSubmit(text.trim())}
        disabled={isLoading || !text.trim()}
        className="w-full btn-3d-success btn-lg flex items-center justify-center gap-2"
      >
        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-4 h-4" />}
        {isLoading ? t('check.analyzing') : t('check.submit')}
      </button>
    </div>
  );
}
