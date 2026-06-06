import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import ShortcutsModal from '@/components/layout/ShortcutsModal';

export default function App() {
  const navigate = useNavigate();
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Check if the user is typing in a form input or textarea
      const target = e.target as HTMLElement;
      const isInput = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;

      // Special key: "/" should focus the first visible search/claim input box, even if not focused.
      // But if already typing, let it pass.
      if (e.key === '/' && !isInput) {
        e.preventDefault();
        const firstInput = document.querySelector('input[type="text"], input[type="url"], textarea') as HTMLInputElement | HTMLTextAreaElement | null;
        if (firstInput) {
          firstInput.focus();
          firstInput.select();
        }
        return;
      }

      // 2. Toggle modal with "?" key
      if (e.key === '?' && !isInput) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
        return;
      }

      // Esc closes modal
      if (e.key === 'Escape' && isShortcutsOpen) {
        setIsShortcutsOpen(false);
        return;
      }

      // 3. Navigation shortcuts (if not in input)
      if (!isInput) {
        switch (e.key.toLowerCase()) {
          case 'h':
            navigate('/home');
            break;
          case 'c':
            navigate('/check');
            break;
          case 'd':
            navigate('/dashboard');
            break;
          case 'm':
            navigate('/community');
            break;
          case 'l':
            navigate('/leaderboard');
            break;
          case 'n':
            navigate('/notifications');
            break;
          case 'p':
            navigate('/profile');
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, isShortcutsOpen]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 min-h-[calc(100vh-4rem)] border-r border-border/10">
          <Outlet />
        </main>
      </div>
      <MobileBottomNav />
      <ShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
    </div>
  );
}
