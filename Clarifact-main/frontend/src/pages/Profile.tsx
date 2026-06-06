import { motion } from 'framer-motion';
import { User, Shield, Award, Calendar, BarChart3 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { formatDate } from '@/lib/utils';

export default function Profile() {
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 pb-24 lg:pb-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {/* Profile header */}
        <div className="flex items-center gap-4 p-6 rounded-2xl bg-card border border-border">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/20">
            {user.name[0]}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{user.name}</h1>
            <p className="text-sm text-foreground/50">{user.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary">
                <Shield className="w-3 h-3" /> {user.role.toUpperCase()}
              </span>
              <span className="text-xs text-foreground/40 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Joined {formatDate(user.joinedAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4">
          <div className="p-5 rounded-2xl bg-card border border-border text-center">
            <BarChart3 className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{user.claimsChecked}</p>
            <p className="text-xs text-foreground/40">Claims Checked</p>
          </div>
        </div>

        {/* Badges */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" /> Badges
          </h3>
          {user.badges.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {user.badges.map((badge) => (
                <div key={badge.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border">
                  <span className="text-2xl">{badge.icon}</span>
                  <div>
                    <p className="text-sm font-medium">{badge.name}</p>
                    <p className="text-[10px] text-foreground/40">{badge.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-foreground/40">No badges yet. Start verifying claims!</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
