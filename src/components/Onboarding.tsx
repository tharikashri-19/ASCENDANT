import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import AscendantLogo from './AscendantLogo';
import { UserProfile } from '../types';
import { Sparkles, GraduationCap, ArrowRight, ArrowLeft, Check, TrendingUp, ShieldCheck } from 'lucide-react';

interface OnboardingProps {
  onComplete: (profile: UserProfile, initialSemesters?: { number: number, sgpa: number }[]) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [university, setUniversity] = useState('Stanford University');
  const [currentSemester, setCurrentSemester] = useState(1);
  const [theme, setTheme] = useState<'se-dark' | 'se-light' | 'dark' | 'light' | 'system'>('se-light');
  const [gpaScale, setGpaScale] = useState<4 | 10>(10);
  const [prevSgpas, setPrevSgpas] = useState<{[key: number]: string}>({});

  const [isUniDropdownOpen, setIsUniDropdownOpen] = useState(false);
  const [customUni, setCustomUni] = useState('');
  const [isCustomUniActive, setIsCustomUniActive] = useState(false);

  const universities = [
    'Stanford University',
    'MIT',
    'UC Berkeley',
    'Carnegie Mellon University',
    'IIT Bombay',
    'National University of Singapore',
    'University of Toronto',
    'Oxford University',
    'Custom...'
  ];

  const totalSteps = currentSemester > 1 ? 4 : 3;

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (!name.trim()) return;
      setStep(3);
    } else if (step === 3) {
      if (currentSemester > 1) {
        setStep(4);
      } else {
        submitOnboarding();
      }
    } else if (step === 4) {
      submitOnboarding();
    }
  };

  const submitOnboarding = () => {
    const finalUni = isCustomUniActive ? (customUni.trim() || 'My University') : university;
    const initialSemesters: { number: number, sgpa: number }[] = [];
    
    if (currentSemester > 1) {
      for (let i = 1; i < currentSemester; i++) {
        const val = parseFloat(prevSgpas[i]) || 0;
        initialSemesters.push({ number: i, sgpa: val });
      }
    }

    onComplete({
      name: name.trim(),
      university: finalUni,
      currentSemester,
      theme: 'se-light',
      gpaScale
    }, initialSemesters);
  };

  return (
    <div id="onboarding-container" className="min-h-screen bg-[#F3EBDD] text-[#722f37] flex flex-col justify-between p-6 sm:p-8 select-none relative overflow-hidden">
      {/* Background ambient warm lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-[#E8DCC6] via-[#B7A89A]/30 to-[#722f37]/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Top logo & header */}
      <div className="flex justify-between items-center py-2 z-10">
        <AscendantLogo size="sm" tagline="ACADEMIC COMPANION" />
        <div className="clay-badge text-xs px-3.5 py-1 text-[#FAF6EE] font-bold">
          STEP 0{step} OF 0{totalSteps}
        </div>
      </div>

      {/* Main Content Carousel */}
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full my-8 z-10">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6 text-center sm:text-left"
            >
              {/* Claymorphic Hero Visual */}
              <div className="clay-card h-52 w-full flex items-center justify-center relative p-6 overflow-hidden">
                <div className="z-10 flex flex-col items-center gap-3">
                  <AscendantLogo size="lg" showText={false} />
                  <div className="text-center">
                    <div className="text-xs font-mono text-[#722f37] uppercase tracking-widest font-black">ASCENDANT</div>
                    <div className="text-sm font-bold text-[#722f37]/80 mt-0.5">Your Everyday Academic Companion</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="text-3xl font-black tracking-tight text-[#722f37] leading-tight">
                  Welcome to ASCENDANT
                </h2>
                <p className="text-[#722f37]/80 text-sm leading-relaxed max-w-sm mx-auto sm:mx-0 font-medium">
                  Easily calculate your CGPA, check how many classes you can safely skip, plan your exam dates, and build your daily study routine—all stored 100% privately on your device.
                </p>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="clay-card p-6 sm:p-7 space-y-5"
            >
              <div>
                <h2 className="text-2xl font-black tracking-tight text-[#722f37]">
                  Your Student Profile
                </h2>
                <p className="text-xs text-[#722f37]/70 mt-1 font-medium">
                  Enter your name and university to personalize your academic dashboard.
                </p>
              </div>

              <div className="space-y-4">
                {/* Name Input */}
                <div className="space-y-1.5">
                  <label htmlFor="student-name" className="text-xs font-bold text-[#722f37] uppercase tracking-wider">
                    Your Name
                  </label>
                  <div className="clay-inset p-2.5 px-3.5">
                    <input
                      id="student-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Rivera"
                      className="w-full bg-transparent text-sm font-semibold text-[#722f37] placeholder:text-[#B7A89A] focus:outline-none"
                    />
                  </div>
                </div>

                {/* GPA System Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#722f37] uppercase tracking-wider block">
                    Grading Scale
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setGpaScale(10)}
                      className={`p-3 rounded-2xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                        gpaScale === 10
                          ? 'clay-btn-burgundy'
                          : 'clay-btn-latte'
                      }`}
                    >
                      <span className="text-sm font-black">10.0 Scale</span>
                      <span className="text-[10px] opacity-80">e.g. India, Europe</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setGpaScale(4)}
                      className={`p-3 rounded-2xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                        gpaScale === 4
                          ? 'clay-btn-burgundy'
                          : 'clay-btn-latte'
                      }`}
                    >
                      <span className="text-sm font-black">4.0 Scale</span>
                      <span className="text-[10px] opacity-80">e.g. USA, Canada</span>
                    </button>
                  </div>
                </div>

                {/* University Selection */}
                <div className="space-y-1.5 relative">
                  <label className="text-xs font-bold text-[#722f37] uppercase tracking-wider block">
                    College / University
                  </label>
                  {isCustomUniActive ? (
                    <div className="flex gap-2">
                      <div className="clay-inset p-2.5 px-3.5 flex-1">
                        <input
                          type="text"
                          value={customUni}
                          onChange={(e) => setCustomUni(e.target.value)}
                          placeholder="Type your university name"
                          className="w-full bg-transparent text-sm font-semibold text-[#722f37] focus:outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsCustomUniActive(false)}
                        className="clay-btn-latte px-3 text-xs font-bold cursor-pointer"
                      >
                        Reset
                      </button>
                    </div>
                  ) : (
                    <div>
                      <button
                        type="button"
                        onClick={() => setIsUniDropdownOpen(!isUniDropdownOpen)}
                        className="clay-inset w-full p-3 px-3.5 text-xs font-semibold text-[#722f37] text-left flex justify-between items-center cursor-pointer"
                      >
                        <span>{university}</span>
                        <span className="text-xs text-[#B7A89A]">▼</span>
                      </button>

                      {isUniDropdownOpen && (
                        <div className="clay-card !bg-[#FAF6EE] absolute left-0 right-0 mt-2 shadow-2xl z-30 overflow-hidden max-h-48 overflow-y-auto border border-[#B7A89A]">
                          {universities.map((uni) => (
                            <button
                              key={uni}
                              type="button"
                              onClick={() => {
                                if (uni === 'Custom...') {
                                  setIsCustomUniActive(true);
                                } else {
                                  setUniversity(uni);
                                }
                                setIsUniDropdownOpen(false);
                              }}
                              className="w-full text-left px-4 py-2.5 text-xs font-bold text-[#722f37] hover:bg-[#E8DCC6] transition-colors border-b border-[#B7A89A]/20 last:border-b-0 cursor-pointer"
                            >
                              {uni}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="clay-card p-6 sm:p-7 space-y-5"
            >
              <div>
                <h2 className="text-2xl font-black tracking-tight text-[#722f37]">
                  Active Semester
                </h2>
                <p className="text-xs text-[#722f37]/70 mt-1 font-medium">
                  Which semester are you currently enrolled in?
                </p>
              </div>

              <div className="grid grid-cols-4 gap-2.5">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setCurrentSemester(s)}
                    className={`py-3.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                      currentSemester === s
                        ? 'clay-btn-burgundy'
                        : 'clay-btn-latte'
                    }`}
                  >
                    Sem {s}
                  </button>
                ))}
              </div>

              <div className="clay-card !bg-[#FAF6EE] p-4 text-xs font-bold text-[#722f37]/80 border border-[#B7A89A]/30 flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
                <span>Your notes are saved 100% locally. No account or login required.</span>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="clay-card p-6 sm:p-7 space-y-5"
            >
              <div>
                <h2 className="text-2xl font-black tracking-tight text-[#722f37]">
                  Previous Semester SGPAs
                </h2>
                <p className="text-xs text-[#722f37]/70 mt-1 font-medium">
                  Optional: Enter your previous grades to immediately plot your CGPA trendline.
                </p>
              </div>

              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {Array.from({ length: currentSemester - 1 }, (_, i) => i + 1).map((semNum) => (
                  <div key={semNum} className="flex items-center justify-between gap-3">
                    <span className="text-xs font-extrabold text-[#722f37]">
                      Semester {semNum} SGPA
                    </span>
                    <div className="clay-inset p-2 px-3 w-28">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={gpaScale}
                        value={prevSgpas[semNum] || ''}
                        onChange={(e) => setPrevSgpas({ ...prevSgpas, [semNum]: e.target.value })}
                        placeholder={gpaScale === 10 ? '8.50' : '3.50'}
                        className="w-full bg-transparent text-xs font-bold text-[#722f37] text-right focus:outline-none placeholder:text-[#B7A89A]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      <div className="flex justify-between items-center py-2 max-w-md mx-auto w-full z-10">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="clay-btn-latte px-4 py-2.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#722f37]" />
            <span>Back</span>
          </button>
        ) : (
          <div />
        )}

        <button
          type="button"
          onClick={handleNext}
          disabled={step === 2 && !name.trim()}
          className="clay-btn-burgundy px-6 py-3 text-xs font-black flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <span>{step === totalSteps ? 'Get Started' : 'Next Step'}</span>
          <ArrowRight className="w-4 h-4 text-[#FAF6EE]" />
        </button>
      </div>
    </div>
  );
}
