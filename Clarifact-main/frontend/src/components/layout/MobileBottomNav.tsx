import { Link, useLocation } from 'react-router-dom';
import { Home, Search, LayoutDashboard, Users, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const bottomNavLinks = [
  { to: '/home', icon: Home, label: 'Home' },
  { to: '/check', icon: Search, label: 'Check' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/community', icon: Users, label: 'Community' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function MobileBottomNav() {
  const location = useLocation();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 backdrop-blur-xl z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {bottomNavLinks.map((link) => {
          const Icon = link.icon;
          const active = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors min-w-[56px]',
                active ? 'text-primary' : 'text-foreground/40'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
