import { motion } from 'framer-motion';
import { AlertTriangle, AlertOctagon, Info } from 'lucide-react';
import type { Alert } from '@/types';
import { formatTimeAgo } from '@/lib/utils';

interface Props {
  alerts: Alert[];
}

const severityConfig = {
  info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  warning: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  critical: { icon: AlertOctagon, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
};

export default function AlertsPanel({ alerts }: Props) {
  return (
    <div className="space-y-3">
      {alerts.map((alert, i) => {
        const config = severityConfig[alert.severity];
        const Icon = config.icon;
        return (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`flex items-start gap-3 p-4 rounded-xl border ${config.bg} ${!alert.read ? 'ring-1 ring-primary/20' : ''}`}
          >
            <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.color}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{alert.title}</p>
              <p className="text-xs text-foreground/50 mt-0.5">{alert.description}</p>
            </div>
            <span className="text-[10px] text-foreground/40 whitespace-nowrap">{formatTimeAgo(alert.timestamp)}</span>
          </motion.div>
        );
      })}
    </div>
  );
}
