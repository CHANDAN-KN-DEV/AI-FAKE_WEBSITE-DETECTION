import { Inbox } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  message?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ message = 'Nothing to show here', action }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
        <Inbox className="w-8 h-8 text-foreground/30" />
      </div>
      <p className="text-sm text-foreground/50 mb-4">{message}</p>
      {action}
    </motion.div>
  );
}
