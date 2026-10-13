import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastNotificationProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export default function ToastNotification({ toasts, onDismiss }: ToastNotificationProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      <AnimatePresence>
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.95 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`pointer-events-auto p-4 rounded-2xl backdrop-blur-xl border flex items-start gap-3 shadow-2xl ${
                isSuccess
                  ? 'bg-[#06181b]/90 border-cyan-400/60 shadow-[0_0_25px_rgba(6,182,212,0.25)] text-white'
                  : isError
                  ? 'bg-[#1e0a0d]/90 border-rose-500/60 shadow-[0_0_25px_rgba(244,63,94,0.25)] text-white'
                  : 'bg-[#0f1424]/90 border-indigo-400/60 shadow-[0_0_25px_rgba(99,102,241,0.25)] text-white'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-cyan-400" />}
                {isError && <AlertTriangle className="w-5 h-5 text-rose-400" />}
                {!isSuccess && !isError && <Info className="w-5 h-5 text-indigo-400" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold uppercase tracking-wider font-mono">
                  {toast.title}
                </div>
                {toast.message && (
                  <div className="text-xs text-neutral-300 mt-0.5 leading-relaxed">
                    {toast.message}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
