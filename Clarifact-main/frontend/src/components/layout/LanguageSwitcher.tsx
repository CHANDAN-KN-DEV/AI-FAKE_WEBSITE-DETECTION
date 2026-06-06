import { Globe } from 'lucide-react';
import { useLanguageStore } from '@/store/languageStore';
import type { Language } from '@/types';

const languages: { code: Language; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'hi', label: 'हि' },
  { code: 'kn', label: 'ಕ' },
];

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguageStore();

  return (
    <div className="relative group">
      <button className="flex items-center gap-1.5 p-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
        <Globe className="w-4 h-4" />
        <span className="text-xs font-medium uppercase">{language}</span>
      </button>
      <div className="absolute right-0 top-full pt-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-50 min-w-[100px]">
        <div className="bg-card border border-border rounded-xl shadow-lg overflow-hidden">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`w-full px-4 py-2.5 text-left text-sm hover:bg-secondary transition-colors ${
                language === lang.code ? 'text-primary font-semibold' : 'text-foreground/70'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
