import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, Bell, User, LogOut, Menu, X, ShieldCheck, Gavel, Plus, MessageSquarePlus } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from './ThemeToggle';
import LanguageSwitcher from './LanguageSwitcher';
import { useAuthStore } from '@/store/authStore';
import { useLanguageStore } from '@/store/languageStore';
import CreatePostModal from '@/components/community/CreatePostModal';

import { getNotifications } from '@/services/api';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuthStore();
  const { t } = useLanguageStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const createRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchNotifs = () => {
      if (isAuthenticated) {
        getNotifications().then(data => {
          setUnreadCount(data.filter((n: any) => !n.read).length);
        }).catch(console.error);
      }
    };
    
    fetchNotifs();
    window.addEventListener('notifications-updated', fetchNotifs);
    return () => window.removeEventListener('notifications-updated', fetchNotifs);
  }, [isAuthenticated, location.pathname]);

  // Close create dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (createRef.current && !createRef.current.contains(e.target as Node)) {
        setCreateOpen(false);
      }
    }
    if (createOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [createOpen]);

  const navLinks = [
    { to: '/home', label: t('nav.home') },
    { to: '/check', label: t('nav.check') },
    { to: '/dashboard', label: t('nav.dashboard') },
    { to: '/community', label: t('nav.community') },
    { to: '/leaderboard', label: t('nav.leaderboard') },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/home" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent hidden sm:block" style={{fontFamily:"'Space Grotesk',sans-serif"}}>
                Clarifact
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === link.to
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground/60 hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* ✦ Create / Plus button ✦ */}
              {isAuthenticated && (
                <div className="relative" ref={createRef}>
                  <button
                    id="create-post-button"
                    onClick={() => setCreateOpen(!createOpen)}
                    className="btn-3d-primary btn-sm"
                    title="Create"
                  >
                    <Plus className={`w-4 h-4 transition-transform duration-200 ${createOpen ? 'rotate-45' : ''}`} />
                    <span className="hidden sm:inline text-xs">Create</span>
                  </button>

                  <AnimatePresence>
                    {createOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 bg-card border border-border rounded-xl shadow-2xl w-56 overflow-hidden z-50"
                      >
                        <div className="p-1.5">
                          <button
                            id="create-community-post-btn"
                            onClick={() => {
                              setCreateOpen(false);
                              setShowCreatePost(true);
                            }}
                            className="flex items-center gap-3 w-full px-3.5 py-3 rounded-lg hover:bg-secondary transition-colors text-sm group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center group-hover:from-emerald-500/30 group-hover:to-teal-500/30 transition-colors">
                              <MessageSquarePlus className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div className="text-left">
                              <span className="font-medium block">Create Community Post</span>
                              <span className="text-[11px] text-foreground/40">Share news or info</span>
                            </div>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <LanguageSwitcher />
              <ThemeToggle />

              {isAuthenticated && (
                <Link to="/notifications" className="btn-3d-icon relative" title="Notifications">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-card">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              )}

              {isAuthenticated && (
                <div className="relative hidden md:block">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="btn-3d-ghost btn-sm flex items-center gap-2"
                  >
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                      {user?.name?.[0] || 'U'}
                    </div>
                    <span className="text-sm font-medium truncate max-w-[80px]">{user?.name?.split(' ')[0]}</span>
                  </button>
                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute right-0 top-full mt-2 bg-card border border-border rounded-xl shadow-xl w-48 overflow-hidden z-50"
                      >
                        <Link to="/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-3 hover:bg-secondary transition-colors text-sm">
                          <User className="w-4 h-4" /> {t('nav.profile')}
                        </Link>
                        <Link to="/expert-apply" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-3 hover:bg-secondary transition-colors text-sm">
                          <ShieldCheck className="w-4 h-4" /> {t('nav.expertApply')}
                        </Link>
                        {(user?.role === 'admin' || user?.role === 'authority') && (
                          <Link to="/authority/dashboard" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-3 hover:bg-secondary transition-colors text-sm text-violet-400">
                            <Gavel className="w-4 h-4" /> Authority Dashboard
                          </Link>
                        )}
                        {(user?.role === 'admin' || user?.role === 'authority') && (
                          <Link to="/admin/review" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-3 hover:bg-secondary transition-colors text-sm">
                            <Shield className="w-4 h-4" /> {t('nav.adminReview')}
                          </Link>
                        )}
                        <hr className="border-border" />
                        <button onClick={() => { logout(); setProfileOpen(false); navigate('/login'); }} className="flex items-center gap-2.5 px-4 py-3 hover:bg-red-500/10 transition-colors text-sm w-full text-red-400">
                          <LogOut className="w-4 h-4" /> {t('nav.logout')}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Mobile hamburger */}
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden btn-3d-icon">
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-border bg-card overflow-hidden"
            >
              <div className="px-4 py-3 space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      location.pathname === link.to ? 'bg-primary/10 text-primary' : 'text-foreground/60 hover:bg-secondary'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                {isAuthenticated && (
                  <>
                    <button
                      onClick={() => { setMobileMenuOpen(false); setShowCreatePost(true); }}
                      className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-emerald-400 hover:bg-secondary transition-colors"
                    >
                      <MessageSquarePlus className="w-4 h-4" /> Create Community Post
                    </button>
                    <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm font-medium text-foreground/60 hover:bg-secondary">
                      {t('nav.profile')}
                    </Link>
                    <button onClick={() => { logout(); setMobileMenuOpen(false); navigate('/login'); }} className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-secondary">
                      {t('nav.logout')}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        onPostCreated={() => {
          // If user is on community page, it will auto-refresh
        }}
      />
    </>
  );
}
