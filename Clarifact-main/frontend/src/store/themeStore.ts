import { create } from 'zustand';
import type { ThemeState, Theme } from '@/types';

function getInitialTheme(): Theme {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('clarifact-theme');
    if (saved === 'light' || saved === 'dark') return saved;
  }
  return 'dark';
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getInitialTheme(),
  toggleTheme: () =>
    set((state) => {
      const next = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('clarifact-theme', next);
      document.documentElement.classList.toggle('dark', next === 'dark');
      return { theme: next };
    }),
  setTheme: (theme: Theme) => {
    localStorage.setItem('clarifact-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    set({ theme });
  },
}));
