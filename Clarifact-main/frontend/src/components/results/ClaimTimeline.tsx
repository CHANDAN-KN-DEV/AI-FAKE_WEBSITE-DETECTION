import { motion } from 'framer-motion';
import { Clock, Globe2 } from 'lucide-react';
import type { TimelineEvent } from '@/types';
import { formatDate } from '@/lib/utils';

interface Props {
  events: TimelineEvent[];
}

export default function ClaimTimeline({ events }: Props) {
  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
      <div className="space-y-6">
        {events.map((event, i) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.15 }}
            className="relative flex gap-4 pl-10"
          >
            <div className="absolute left-2.5 top-1 w-3 h-3 rounded-full bg-primary border-2 border-background" />
            <div className="flex-1 p-4 rounded-xl bg-secondary/50 border border-border">
              <div className="flex items-center gap-2 mb-1">
                <Globe2 className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-primary">{event.platform}</span>
                <span className="text-xs text-foreground/40 ml-auto flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {formatDate(event.date)}
                </span>
              </div>
              <p className="text-sm text-foreground/70">{event.description}</p>
              <p className="text-xs text-foreground/40 mt-1">Reach: {event.reach.toLocaleString()} people</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
