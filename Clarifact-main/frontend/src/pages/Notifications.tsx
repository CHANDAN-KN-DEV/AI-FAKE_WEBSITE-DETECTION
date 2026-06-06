import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Bell, Check, Trash2, ExternalLink } from 'lucide-react';
import { getNotifications, markNotificationRead, markAllNotificationsRead, clearAllNotifications } from '@/services/api';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import EmptyState from '@/components/common/EmptyState';
import { formatTimeAgo, cn } from '@/lib/utils';
import type { Notification } from '@/types';

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotifications()
      .then((data) => {
        setNotifications(data);
        setLoading(false);
      })
      .catch(() => {
        setNotifications([]);
        setLoading(false);
      });
  }, []);

  const markRead = async (id: string) => {
    // Optimistically update UI
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    window.dispatchEvent(new Event('notifications-updated'));
    // Persist to backend
    try {
      await markNotificationRead(id);
    } catch {
      // Revert on failure
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: false } : n))
      );
      window.dispatchEvent(new Event('notifications-updated'));
    }
  };

  const markAllRead = async () => {
    // Optimistically update UI
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    window.dispatchEvent(new Event('notifications-updated'));
    try {
      await markAllNotificationsRead();
    } catch {
      // Revert on failure — refetch from server
      getNotifications().then(data => { setNotifications(data); window.dispatchEvent(new Event('notifications-updated')); }).catch(() => {});
    }
  };

  const clearAll = async () => {
    // Optimistically clear UI
    setNotifications([]);
    window.dispatchEvent(new Event('notifications-updated'));
    try {
      await clearAllNotifications();
    } catch {
      // Revert on failure — refetch from server
      getNotifications().then(data => { setNotifications(data); window.dispatchEvent(new Event('notifications-updated')); }).catch(() => {});
    }
  };

  if (loading) return <div className="max-w-3xl mx-auto p-6"><LoadingSkeleton count={4} /></div>;

  const typeColors: Record<Notification['type'], string> = {
    info: 'bg-blue-500/10 text-blue-400',
    success: 'bg-verified/10 text-verified',
    warning: 'bg-misleading/10 text-misleading',
    error: 'bg-false/10 text-false',
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 pb-24 lg:pb-6">
      <div className="flex items-center justify-between mb-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center gap-2 mb-1">
            <Bell className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                {unreadCount} unread
              </span>
            )}
          </div>
        </motion.div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="btn-3d-ghost btn-sm flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" /> Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="btn-3d-danger btn-sm flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear all
            </button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <EmptyState message="You're all caught up! No notifications yet." />
      ) : (
        <div className="space-y-3">
          {notifications.map((n, i) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => !n.read && markRead(n.id)}
              className={cn(
                'flex items-start gap-3 p-4 rounded-xl border border-border bg-card transition-all hover:bg-secondary/50',
                !n.read && 'ring-1 ring-primary/20 cursor-pointer',
                n.read && 'opacity-70 cursor-default'
              )}
            >
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', typeColors[n.type])}>
                <Bell className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={cn('text-sm font-medium', !n.read && 'text-foreground')}>{n.title}</p>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" title="Unread" />
                  )}
                </div>
                <p className="text-xs text-foreground/50 mt-0.5">{n.message}</p>
                <span className="text-[10px] text-foreground/30">{formatTimeAgo(n.timestamp)}</span>
              </div>
              {n.link && (
                <Link
                  to={n.link}
                  className="text-primary hover:text-primary/80 flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
