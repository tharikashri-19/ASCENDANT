import React from 'react';
import { AlertOctagon, ArrowLeft, Compass, RefreshCw } from 'lucide-react';
import AscendantLogo from './AscendantLogo';

interface NotFoundScreenProps {
  onReturnHome: () => void;
}

export default function NotFoundScreen({ onReturnHome }: NotFoundScreenProps) {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-12 space-y-8 select-none">
      {/* Glitch / Error Crest */}
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-rose-500/20 blur-3xl animate-pulse" />
        <div className="relative w-28 h-28 rounded-3xl bg-[#140a10] border-2 border-rose-500/60 shadow-[0_0_40px_rgba(244,63,94,0.35)] flex items-center justify-center">
          <AlertOctagon className="w-14 h-14 text-rose-500 animate-bounce" />
        </div>
      </div>

      {/* 404 Headline */}
      <div className="space-y-3 max-w-md">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/60 border border-rose-500/40 text-[10px] font-mono text-rose-300 uppercase tracking-widest">
          <span>ERROR CODE 404</span>
          <span>•</span>
          <span>VECTOR MISALIGNMENT</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-black font-headline tracking-tight text-white text-neon-3d-magenta">
          TRAJECTORY LOST
        </h1>

        <p className="text-xs sm:text-sm text-neutral-400 font-mono leading-relaxed">
          The requested coordinate or calculation module does not exist within the Ascendant OS flight registry.
        </p>
      </div>

      {/* Diagnostic telemetry */}
      <div className="w-full max-w-sm p-4 rounded-2xl bg-black/60 border border-neutral-800 text-left font-mono text-[10px] text-neutral-400 space-y-1">
        <div className="flex justify-between text-neutral-500">
          <span>SYSTEM_STATUS</span>
          <span className="text-rose-400">UNRESOLVED_ROUTE</span>
        </div>
        <div className="flex justify-between text-neutral-500">
          <span>TIMESTAMP</span>
          <span className="text-white">{new Date().toISOString()}</span>
        </div>
        <div className="flex justify-between text-neutral-500">
          <span>RECOVERY_ACTION</span>
          <span className="text-cyan-400">REROUTE_TO_HUD</span>
        </div>
      </div>

      {/* Action Button to return home */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <button
          type="button"
          onClick={onReturnHome}
          className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-black font-bold text-xs uppercase tracking-wider font-mono flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          Return to Flight Deck
        </button>
      </div>
    </div>
  );
}
