import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { router } from './router';
import { useThemeStore } from '@/store/themeStore';
import '@/styles/index.css';

// Initialize theme on load
const theme = useThemeStore.getState().theme;
document.documentElement.classList.toggle('dark', theme === 'dark');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} future={{ v7_startTransition: true }} />
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 3000,
        style: {
          background: 'var(--card)',
          color: 'var(--foreground)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          fontSize: '14px',
        },
      }}
    />
  </React.StrictMode>
);
