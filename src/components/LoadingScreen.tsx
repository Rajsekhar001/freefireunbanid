import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SITE_CONFIG } from '../config';

interface LoadingScreenProps {
  onComplete: () => void;
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      setVisible(false);
      onComplete();
      return;
    }

    const timer = window.setTimeout(() => {
      setVisible(false);
      onComplete();
    }, 1050);

    return () => window.clearTimeout(timer);
  }, [onComplete]);

  const handleSkip = () => {
    setVisible(false);
    onComplete();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="apex-intro"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#080910] px-6"
          role="dialog"
          aria-label="Loading APEX ID UNBAN BOT"
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FF1744]/20 blur-[90px]" />
            <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/3 -translate-y-1/3 rounded-full bg-[#0066FF]/20 blur-[90px]" />
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex flex-col items-center text-center"
          >
            <img
              src={SITE_CONFIG.logoSrc}
              alt={`${SITE_CONFIG.brandName} logo`}
              className="h-20 w-20 rounded-2xl border border-white/10 shadow-2xl"
              referrerPolicy="no-referrer"
            />
            <h2 className="mt-5 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              {SITE_CONFIG.brandName}
            </h2>
            <p className="mt-1.5 text-xs font-medium tracking-[0.22em] text-slate-400 uppercase">
              {SITE_CONFIG.communityName}
            </p>

            <div className="mt-6 h-1 w-48 overflow-hidden rounded-full bg-white/10">
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="h-full origin-left bg-gradient-to-r from-[#FF1744] via-[#8B35FF] to-[#0066FF]"
              />
            </div>

            <button
              type="button"
              onClick={handleSkip}
              className="mt-6 text-xs font-medium text-slate-400 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0066FF]"
            >
              Skip Intro
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
