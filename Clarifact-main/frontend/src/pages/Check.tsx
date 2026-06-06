import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Type, Link2, MessageCircle, ImageIcon, CheckCircle2 } from 'lucide-react';
import ClaimInputBox from '@/components/inputs/ClaimInputBox';
import URLInputCard from '@/components/inputs/URLInputCard';
import WhatsAppForwardChecker from '@/components/inputs/WhatsAppForwardChecker';
import MediaUploadPanel from '@/components/inputs/MediaUploadPanel';
import { checkClaim } from '@/services/api';
import { useLanguageStore } from '@/store/languageStore';
import toast from 'react-hot-toast';

const tabs = [
  { key: 'text', label: 'check.tabs.text', icon: Type },
  { key: 'url', label: 'check.tabs.url', icon: Link2 },
  { key: 'whatsapp', label: 'check.tabs.whatsapp', icon: MessageCircle },
  { key: 'media', label: 'check.tabs.media', icon: ImageIcon },
];

export default function Check() {
  const [activeTab, setActiveTab] = useState('text');
  const [isLoading, setIsLoading] = useState(false);
  const [submittedTab, setSubmittedTab] = useState<string | null>(null);
  const navigate = useNavigate();
  const { t } = useLanguageStore();

  const handleSubmit = async (text: string) => {
    setIsLoading(true);
    setSubmittedTab(activeTab);
    try {
      const { claimId } = await checkClaim(text, activeTab);
      toast.success('Claim submitted! Analyzing…');
      navigate(`/result/${claimId}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit claim');
      setSubmittedTab(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMediaSubmit = async (file: File, base64: string) => {
    const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
    const description = `${mediaType.toUpperCase()} upload: ${file.name}`;
    setIsLoading(true);
    setSubmittedTab(activeTab);
    try {
      const { claimId } = await checkClaim(description, mediaType, {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        lastModified: file.lastModified,
        imageBase64: base64,
        imageMimeType: file.type,
      });
      toast.success(`${mediaType} submitted! Analyzing…`);
      navigate(`/result/${claimId}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit media');
      setSubmittedTab(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-1">{t('check.title')}</h1>
        <p className="text-sm text-foreground/50 mb-6">{t('check.subtitle')}</p>

        {/* Tab bar */}
        <div className="flex gap-1 p-1 bg-secondary rounded-xl mb-6 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            const isSubmitted = submittedTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => !isLoading && setActiveTab(tab.key)}
                disabled={isLoading && !isSubmitted}
                className={`relative flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  isActive && isSubmitted && isLoading
                    ? 'bg-gradient-to-r from-blue-500/20 to-violet-500/20 text-primary border border-primary/30 shadow-sm'
                    : isActive
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-foreground/50 hover:text-foreground'
                }`}
              >
                {isSubmitted && isLoading ? (
                  <span className="relative flex w-4 h-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60"></span>
                    <CheckCircle2 className="relative w-4 h-4 text-primary" />
                  </span>
                ) : (
                  <Icon className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">{t(tab.label)}</span>
                {isSubmitted && isLoading && (
                  <span className="hidden sm:inline text-xs text-primary font-semibold ml-1">✓</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'text' && <ClaimInputBox onSubmit={handleSubmit} isLoading={isLoading} />}
            {activeTab === 'url' && <URLInputCard onSubmit={handleSubmit} isLoading={isLoading} />}
            {activeTab === 'whatsapp' && <WhatsAppForwardChecker onSubmit={handleSubmit} isLoading={isLoading} />}
            {activeTab === 'media' && <MediaUploadPanel onSubmit={handleMediaSubmit} />}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
