import { useEffect } from 'react';
import { motion } from 'motion/react';
import AscendantLogo from './AscendantLogo';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div id="splash-screen" className="fixed inset-0 bg-gradient-to-br from-[#330f14] via-[#4a171e] to-[#25090c] text-[#FAF6EE] flex flex-col items-center justify-center z-50 overflow-hidden">
      {/* Background ambient warm wine lighting effects */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#722f37]/25 rounded-full blur-[140px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center z-10"
      >
        {/* Animated Clay Emblem */}
        <div className="relative mb-6">
          <AscendantLogo size="xl" showText={false} />
        </div>

        {/* ASCENDANT Wordmark */}
        <motion.h1 
          initial={{ opacity: 0, tracking: "0.25em" }}
          animate={{ opacity: 1, tracking: "0.1em" }}
          transition={{ delay: 0.3, duration: 0.9 }}
          className="text-4xl sm:text-5xl tracking-widest uppercase font-black text-center text-[#FAF6EE] font-sans"
        >
          ASCENDANT
        </motion.h1>

        {/* Dynamic Understandable Concept Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.7 }}
          className="clay-badge mt-3.5 px-4 py-1.5 flex items-center gap-2 shadow-md bg-[#25090C] border border-[#722f37]/50"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-xs uppercase text-[#FAF6EE] font-extrabold tracking-wider font-mono">
            YOUR EVERYDAY ACADEMIC COMPANION
          </span>
        </motion.div>
      </motion.div>

      {/* Progress line with clay inset well */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 w-64 h-3 bg-[#240A0D] border border-[#722f37]/50 rounded-full overflow-hidden p-0.5 shadow-inner">
        <motion.div 
          initial={{ left: "-100%" }}
          animate={{ left: "100%" }}
          transition={{ duration: 1.8, ease: "easeInOut", repeat: Infinity }}
          className="absolute top-0.5 bottom-0.5 w-1/2 bg-gradient-to-r from-transparent via-[#853740] to-[#FAF6EE] rounded-full shadow-md"
        />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.8 }}
        transition={{ delay: 0.9, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-[10px] text-[#E8DCC6]/80 font-bold uppercase tracking-widest font-mono whitespace-nowrap flex items-center gap-2"
      >
        <span>STUDENT ACADEMIC COMPANION</span>
        <span>•</span>
        <span>DONE BY ME</span>
      </motion.div>
    </div>
  );
}
