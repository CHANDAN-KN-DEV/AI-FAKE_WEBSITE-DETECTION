import { create } from 'zustand';
import type { LanguageState, Language } from '@/types';
import { translations } from '@/i18n/translations';

function getInitialLanguage(): Language {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('clarifact-lang') as Language;
    if (saved && translations[saved]) return saved;
  }
  return 'en';
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  language: getInitialLanguage(),

  setLanguage: (lang: Language) => {
    localStorage.setItem('clarifact-lang', lang);
    set({ language: lang });
  },

  t: (key: string) => {
    const lang = get().language;
    return translations[lang]?.[key] || translations['en']?.[key] || key;
  },
}));
