import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Search, Shield, Users, Brain, ArrowRight, Zap, Globe } from 'lucide-react';
import { useLanguageStore } from '@/store/languageStore';
import { getTopPicks } from '@/services/api';

export default function Home() {
  const { t } = useLanguageStore();
  const [liveFeatureNote, setLiveFeatureNote] = useState('Loading live verification feed...');

  useEffect(() => {
    getTopPicks()
      .then((picks) => {
        if (!picks.length) {
          setLiveFeatureNote('No live claims yet. Submit one to start the feed.');
          return;
        }
        const first = picks[0];
        setLiveFeatureNote(`Live now: ${first.claim.slice(0, 56)}${first.claim.length > 56 ? '...' : ''}`);
      })
      .catch(() => {
        setLiveFeatureNote('Live feed unavailable right now.');
      });
  }, []);

  return (
    <div className="space-y-16 pb-12">
      {/* Hero */}
      <section className="text-center py-16 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full text-primary text-xs font-semibold mb-6">
            <Zap className="w-3.5 h-3.5" /> AI-Powered Fact Verification
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            {t('home.title')}
          </h1>
          <p className="text-lg text-foreground/50 mb-8 max-w-xl mx-auto">
            {t('home.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/check"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-blue-500 to-violet-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all"
            >
              <Search className="w-5 h-5" /> {t('home.cta')}
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-secondary text-foreground font-semibold rounded-xl hover:bg-secondary/80 transition-all"
            >
              View Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </section>


      {/* Features */}
      <section className="max-w-5xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-center mb-10">How Clarifact Works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Brain, title: t('home.features.ai'), desc: `${t('home.features.aiDesc')} ${liveFeatureNote}`, color: 'from-blue-500/20 to-blue-500/5 text-blue-400' },
            { icon: Users, title: t('home.features.community'), desc: t('home.features.communityDesc'), color: 'from-violet-500/20 to-violet-500/5 text-violet-400' },
            { icon: Shield, title: t('home.features.emotion'), desc: t('home.features.emotionDesc'), color: 'from-emerald-500/20 to-emerald-500/5 text-emerald-400' },
          ].map((feat, i) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 * i }}
                className="p-6 rounded-2xl bg-card border border-border hover:shadow-md transition-all"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feat.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold mb-2">{feat.title}</h3>
                <p className="text-sm text-foreground/50">{feat.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Multilingual CTA */}
      <section className="max-w-3xl mx-auto px-4 text-center">
        <div className="p-8 rounded-2xl bg-gradient-to-br from-blue-500/10 to-violet-500/10 border border-primary/20">
          <Globe className="w-10 h-10 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Available in Multiple Languages</h3>
          <p className="text-sm text-foreground/50 mb-4">
            Clarifact supports English, Hindi, and Kannada — with more languages coming soon.
          </p>
          <div className="flex justify-center gap-3">
            <span className="px-3 py-1 bg-secondary rounded-lg text-xs font-medium">English</span>
            <span className="px-3 py-1 bg-secondary rounded-lg text-xs font-medium">हिन्दी</span>
            <span className="px-3 py-1 bg-secondary rounded-lg text-xs font-medium">ಕನ್ನಡ</span>
          </div>
        </div>
      </section>
    </div>
  );
}
