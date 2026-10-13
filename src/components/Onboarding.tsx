import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import AscendantLogo from './AscendantLogo';
import { UserProfile } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useGradence } from '../context/GradenceContext';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Mail,
  Lock,
  LogIn,
  UserPlus,
  AlertCircle,
  CheckCircle,
  Cloud
} from 'lucide-react';

interface OnboardingProps {
  onComplete: (profile: UserProfile, initialSemesters?: { number: number, sgpa: number }[]) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const { refreshData } = useGradence();
  const [authMode, setAuthMode] = useState<'welcome' | 'login' | 'signup'>('welcome');

  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Setup / Sign Up Form States
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [university, setUniversity] = useState('');
  const [currentSemester, setCurrentSemester] = useState(1);
  const [gpaScale, setGpaScale] = useState<4 | 10>(10);
  const [prevSgpas, setPrevSgpas] = useState<{ [key: number]: string }>({});

  const totalSteps = currentSemester > 1 ? 4 : 3;

  // Handle direct Sign In
  const handleDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    if (!isSupabaseConfigured) {
      setAuthError('Supabase is not configured yet. Please check VITE_SUPABASE_URL in your .env file.');
      return;
    }

    if (!loginEmail || !loginPassword) {
      setAuthError('Please provide your email and password.');
      return;
    }

    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) throw error;

      setAuthSuccess('Logged in successfully! Synchronizing your academic records...');
      await refreshData();
    } catch (err: any) {
      setAuthError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

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

  const submitOnboarding = async () => {
    const finalUni = university.trim() || 'My College';
    const initialSemesters: { number: number, sgpa: number }[] = [];

    if (currentSemester > 1) {
      for (let i = 1; i < currentSemester; i++) {
        const val = parseFloat(prevSgpas[i]) || 0;
        initialSemesters.push({ number: i, sgpa: val });
      }
    }

    // If user provided email & password during onboarding, create their Supabase cloud account!
    if (email && password && isSupabaseConfigured) {
      setAuthLoading(true);
      try {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name.trim(),
              university: finalUni,
            }
          }
        });
        if (error) {
          console.warn('Supabase sign up warning:', error.message);
        }
      } catch (err) {
        console.error('Error creating cloud account:', err);
      } finally {
        setAuthLoading(false);
      }
    }

    onComplete({
      name: name.trim() || 'Student',
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
        {authMode === 'welcome' && (
          <div className="clay-badge text-xs px-3.5 py-1 text-[#FAF6EE] font-bold">
            STEP 0{step} OF 0{totalSteps}
          </div>
        )}
      </div>

      {/* Direct Login View */}
      {authMode === 'login' ? (
        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full my-6 z-10">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="clay-card p-6 sm:p-8 space-y-5"
          >
            <div>
              <div className="flex items-center gap-2 mb-2 text-[#722f37]">
                <Cloud className="w-5 h-5 text-emerald-600" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-700">Cloud Sync Portal</span>
              </div>
              <h2 className="text-2xl font-black tracking-tight text-[#722f37]">
                Sign In & Sync
              </h2>
              <p className="text-xs text-[#722f37]/70 mt-1 font-medium">
                Log into your account to immediately restore your courses, attendance, and grades from Supabase.
              </p>
            </div>

            {authError && (
              <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}
            {authSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{authSuccess}</span>
              </div>
            )}

            <form onSubmit={handleDirectLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#722f37] uppercase tracking-wider">
                  Email Address
                </label>
                <div className="clay-inset p-2.5 px-3.5 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#722f37]/50" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="student@university.edu"
                    className="w-full bg-transparent text-sm font-semibold text-[#722f37] placeholder:text-[#B7A89A] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#722f37] uppercase tracking-wider">
                  Password
                </label>
                <div className="clay-inset p-2.5 px-3.5 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#722f37]/50" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-transparent text-sm font-semibold text-[#722f37] placeholder:text-[#B7A89A] focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full clay-btn-burgundy py-3 text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95 disabled:opacity-50"
              >
                <LogIn className="w-4 h-4 text-[#FAF6EE]" />
                <span>{authLoading ? 'Synchronizing...' : 'Sign In & Sync Database'}</span>
              </button>
            </form>

            <div className="pt-2 flex items-center justify-between text-xs font-bold text-[#722f37]/70">
              <button
                type="button"
                onClick={() => setAuthMode('welcome')}
                className="hover:underline flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('welcome')}
                className="text-[#722f37] hover:underline"
              >
                Create New Profile
              </button>
            </div>
          </motion.div>
        </div>
      ) : (
        /* Regular Setup / Cloud Onboarding */
        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full my-6 z-10">
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
                {/* Hero Card */}
                <div className="clay-card h-48 w-full flex items-center justify-center relative p-6 overflow-hidden">
                  <div className="z-10 flex flex-col items-center gap-2">
                    <AscendantLogo size="lg" showText={false} />
                    <div className="text-center">
                      <div className="text-xs font-mono text-[#722f37] uppercase tracking-widest font-black">ASCENDANT</div>
                      <div className="text-sm font-bold text-[#722f37]/80 mt-0.5">Academic Operating Workspace</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h2 className="text-3xl font-black tracking-tight text-[#722f37] leading-tight">
                    Welcome to ASCENDANT
                  </h2>
                  <p className="text-[#722f37]/80 text-sm leading-relaxed max-w-sm mx-auto sm:mx-0 font-medium">
                    Calculate your CGPA, forecast attendance cutoffs, plan exam milestones, and track your engineering roadmaps—all backed up and synced to your cloud database.
                  </p>
                </div>

                {/* Cloud Sync Quick Options */}
                <div className="clay-card !bg-[#FAF6EE] p-4 text-xs font-bold text-[#722f37] border border-[#B7A89A]/30 space-y-3">
                  <div className="flex items-center gap-2.5 text-emerald-800">
                    <Cloud className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>Already have an account? Sign in to restore your cloud data.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className="w-full clay-btn-latte py-2.5 text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95"
                  >
                    <LogIn className="w-4 h-4 text-[#722f37]" />
                    <span>Sign In With Existing Account</span>
                  </button>
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
                    Student Profile & Cloud Setup
                  </h2>
                  <p className="text-xs text-[#722f37]/70 mt-1 font-medium">
                    Personalize your academic companion and configure your grading system.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Name Input */}
                  <div className="space-y-1.5">
                    <label htmlFor="student-name" className="text-xs font-bold text-[#722f37] uppercase tracking-wider">
                      Your Full Name
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

                  {/* Optional Cloud Credentials */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#722f37] uppercase tracking-wider">
                      Cloud Account Email (Optional)
                    </label>
                    <div className="clay-inset p-2.5 px-3.5">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="student@university.edu"
                        className="w-full bg-transparent text-sm font-semibold text-[#722f37] placeholder:text-[#B7A89A] focus:outline-none"
                      />
                    </div>
                  </div>

                  {email && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#722f37] uppercase tracking-wider">
                        Set Password
                      </label>
                      <div className="clay-inset p-2.5 px-3.5">
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-transparent text-sm font-semibold text-[#722f37] placeholder:text-[#B7A89A] focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

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
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#722f37] uppercase tracking-wider block">
                      College / University Name
                    </label>
                    <div className="clay-inset p-3 px-3.5">
                      <input
                        type="text"
                        value={university}
                        onChange={(e) => setUniversity(e.target.value)}
                        placeholder="Type your college or university name"
                        className="w-full bg-transparent text-xs font-semibold text-[#722f37] placeholder:text-[#B7A89A] focus:outline-none"
                      />
                    </div>
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
                    Current Academic Standing
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
                  <span>Your academic data is securely encrypted and synced to your cloud database.</span>
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
      )}

      {/* Bottom controls */}
      {authMode === 'welcome' && (
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
      )}
    </div>
  );
}
