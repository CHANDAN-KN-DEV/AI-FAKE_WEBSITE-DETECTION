import { Link, useLocation } from 'react-router-dom';
import { Home, Search, LayoutDashboard, Users, Trophy, ShieldCheck, Bell, User, Star } from 'lucide-react';
import { useLanguageStore } from '@/store/languageStore';
import { cn } from '@/lib/utils';

const sidebarLinks = [
  { to: '/home', icon: Home, key: 'nav.home' },
  { to: '/check', icon: Search, key: 'nav.check' },
  { to: '/dashboard', icon: LayoutDashboard, key: 'nav.dashboard' },
  { to: '/community', icon: Users, key: 'nav.community' },
  { to: '/leaderboard', icon: Trophy, key: 'nav.leaderboard' },
  { to: '/notifications', icon: Bell, key: 'nav.notifications' },
  { to: '/expert-apply', icon: ShieldCheck, key: 'nav.expertApply' },
  { to: '/profile', icon: User, key: 'nav.profile' },
];

export default function Sidebar() {
  const location = useLocation();
  const { t } = useLanguageStore();

  return (
    <aside className="hidden lg:flex flex-col w-60 border-r border-border bg-card/50 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
      <div className="flex-1 py-4 px-3 space-y-1">
        {sidebarLinks.map((link) => {
          const Icon = link.icon;
          const active = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border-l-4',
                active
                  ? 'border-primary bg-primary/10 text-primary shadow-[inset_0_2px_4px_rgba(99,102,241,0.15)] shadow-sm translate-x-1'
                  : 'border-transparent text-foreground/50 hover:text-foreground hover:bg-secondary hover:translate-x-1'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{t(link.key)}</span>
            </Link>
          );
        })}
      </div>

    </aside>
  );
}
