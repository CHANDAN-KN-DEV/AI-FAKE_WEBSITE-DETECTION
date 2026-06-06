import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard, HelpCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: 'H', label: 'Go to Home Feed' },
  { key: 'C', label: 'Go to AI Claim Checker' },
  { key: 'D', label: 'Go to Insights Dashboard' },
  { key: 'M', label: 'Go to Community Discussion' },
  { key: 'L', label: 'Go to Ranking Leaderboard' },
  { key: 'N', label: 'Go to Notifications Panel' },
  { key: 'P', label: 'Go to Personal Profile' },
  { key: '/', label: 'Focus input search box instantly' },
  { key: '?', label: 'Toggle Keyboard Shortcuts Modal' },
];

export default function ShortcutsModal({ isOpen, onClose }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          {/* Modal overlay backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 relative overflow-hidden z-10"
          >
            {/* Glowing border accent */}
            <div className="absolute inset-0 border border-primary/20 rounded-2xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/80">
              <div className="flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-base text-foreground font-display flex items-center gap-1.5">
                  Keyboard Shortcuts
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-secondary rounded-lg transition-colors text-foreground/50 hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List */}
            <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
              {SHORTCUTS.map((s) => (
                <div key={s.key} className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0">
                  <span className="text-xs text-foreground/70">{s.label}</span>
                  <kbd className="px-2.5 py-1 text-xs font-bold font-mono bg-secondary text-primary border border-border shadow-sm rounded-lg min-w-[28px] text-center">
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>

            {/* Footer */}
            <p className="text-[10px] text-foreground/40 mt-4 text-center flex items-center justify-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-primary" /> Press <kbd className="px-1 bg-secondary border border-border rounded mx-0.5 text-[8px] font-mono font-bold">?</kbd> at any time to open this help screen.
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
