import { AlertTriangle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({ message = 'Something went wrong', onRetry }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-false/10 flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-false" />
      </div>
      <h3 className="text-lg font-semibold mb-1">Oops!</h3>
      <p className="text-sm text-foreground/50 mb-4 max-w-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-secondary hover:bg-secondary/80 rounded-xl text-sm font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
      )}
    </motion.div>
  );
}
