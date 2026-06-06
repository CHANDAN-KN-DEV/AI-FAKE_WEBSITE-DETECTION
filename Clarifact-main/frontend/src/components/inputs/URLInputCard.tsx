import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link2, Loader2, Search, Instagram } from 'lucide-react';
import { useLanguageStore } from '@/store/languageStore';

interface Props {
  onSubmit: (url: string) => void;
  isLoading?: boolean;
}

// Detect Instagram URL and classify media type
function detectInstagramType(url: string): 'reel' | 'post' | 'story' | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes('instagram.com')) return null;
    if (u.pathname.includes('/reel/') || u.pathname.includes('/reels/')) return 'reel';
    if (u.pathname.includes('/stories/')) return 'story';
    if (u.pathname.includes('/p/')) return 'post';
    return 'post'; // fallback for ig.me and other short forms
  } catch {
    return null;
  }
}

export default function URLInputCard({ onSubmit, isLoading }: Props) {
  const [url, setUrl] = useState('');
  const { t } = useLanguageStore();

  const instagramType = url.trim() ? detectInstagramType(url.trim()) : null;
  const isInstagram = instagramType !== null;

  return (
    <div className="space-y-3">
      <div className="relative">
        {isInstagram ? (
          <Instagram className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-400" />
        ) : (
          <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
        )}
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste YouTube, Instagram, WhatsApp, or news link"
          className={`w-full pl-11 pr-4 py-3 bg-secondary border rounded-xl text-sm placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all ${
            isInstagram ? 'border-pink-400/50' : 'border-border'
          }`}
        />
      </div>

      {/* Instagram detection badge */}
      {isInstagram && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-pink-500/10 border border-pink-400/30 text-xs text-pink-400 font-medium"
        >
          <Instagram className="w-3.5 h-3.5" />
          Instagram Media Detected — {instagramType === 'reel' ? 'Reel' : instagramType === 'story' ? 'Story' : 'Post'}
        </motion.div>
      )}

      <button
        onClick={() => url.trim() && onSubmit(url.trim())}
        disabled={isLoading || !url.trim()}
        className="w-full btn-3d-primary btn-lg flex items-center justify-center gap-2"
      >
        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-4 h-4" />}
        {isLoading ? t('check.analyzing') : t('check.submit')}
      </button>
    </div>
  );
}
