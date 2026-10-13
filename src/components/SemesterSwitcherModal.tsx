import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap, Check, X, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';

interface SemesterSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSelectSemester: (semesterNumber: number) => void;
}

const SEMESTERS = [
  { num: 1, year: 'Year 1', desc: 'Freshman • Sem 1' },
  { num: 2, year: 'Year 1', desc: 'Freshman • Sem 2' },
  { num: 3, year: 'Year 2', desc: 'Sophomore • Sem 3' },
  { num: 4, year: 'Year 2', desc: 'Sophomore • Sem 4' },
  { num: 5, year: 'Year 3', desc: 'Pre-Final • Sem 5' },
  { num: 6, year: 'Year 3', desc: 'Pre-Final • Sem 6' },
  { num: 7, year: 'Year 4', desc: 'Final Year • Sem 7' },
  { num: 8, year: 'Year 4', desc: 'Final Year • Sem 8' }
];

export const SemesterSwitcherModal: React.FC<SemesterSwitcherModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSelectSemester
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        {/* Backdrop dismiss */}
        <div className="fixed inset-0 -z-10" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 10 }}
          transition={{ duration: 0.18 }}
          className="clay-card !bg-[#FAF6EE] text-[#722f37] w-full max-w-lg p-5 sm:p-7 rounded-[28px] sm:rounded-[36px] shadow-2xl border-2 border-[#722f37]/20 relative overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Header */}
          <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#B7A89A]/30">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#722f37] flex items-center justify-center text-[#FAF6EE] shadow-md shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-[#722f37] tracking-tight flex items-center gap-2">
                  <span>Switch Active Semester</span>
                  <Sparkles className="w-4 h-4 text-[#722f37]/70" />
                </h3>
                <p className="text-xs font-medium text-[#722f37]/75">
                  Select your current semester (e.g. <strong className="text-[#722f37]">Sem 5</strong>) to align your course tools, CGPA goals, and attendance.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-[#722f37]/10 text-[#722f37] transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Current State Info Banner */}
          <div className="mt-4 p-3 rounded-2xl bg-[#722f37]/10 border border-[#722f37]/20 flex items-center justify-between text-xs font-semibold text-[#722f37]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Current Stored: <strong>Semester {profile.currentSemester}</strong></span>
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#722f37] text-[#FAF6EE] px-2 py-0.5 rounded-full">
              {profile.university || 'College'}
            </span>
          </div>

          {/* Semester Selector Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 my-5">
            {SEMESTERS.map((sem) => {
              const isActive = profile.currentSemester === sem.num;

              return (
                <button
                  key={sem.num}
                  type="button"
                  onClick={() => {
                    onSelectSemester(sem.num);
                    onClose();
                  }}
                  className={`p-3 rounded-2xl text-left transition-all cursor-pointer relative flex flex-col justify-between border ${
                    isActive
                      ? 'bg-[#722f37] text-[#FAF6EE] border-[#722f37] shadow-lg scale-[1.03] ring-2 ring-[#722f37]/30'
                      : 'bg-white hover:bg-[#FAF6EE] text-[#722f37] border-[#B7A89A]/40 hover:border-[#722f37] hover:shadow-md active:scale-95'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-[#FAF6EE]/80' : 'text-[#722f37]/70'}`}>
                      {sem.year}
                    </span>
                    {isActive ? (
                      <span className="w-4 h-4 rounded-full bg-emerald-400 text-[#240A0D] flex items-center justify-center text-[10px] font-black">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    ) : null}
                  </div>

                  <div className="text-base sm:text-lg font-black tracking-tight">
                    Sem {sem.num}
                  </div>

                  <div className={`text-[10px] font-medium mt-1 truncate ${isActive ? 'text-[#FAF6EE]/90 font-bold' : 'text-[#722f37]/65'}`}>
                    {isActive ? '● Active Now' : sem.desc}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Helper Footer */}
          <div className="pt-3 border-t border-[#B7A89A]/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-[#722f37]/70 font-medium text-center sm:text-left">
              Tap any semester above to instantly set your active semester.
            </span>
            <button
              type="button"
              onClick={onClose}
              className="clay-btn-latte w-full sm:w-auto px-5 py-2 text-xs font-bold cursor-pointer"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SemesterSwitcherModal;
