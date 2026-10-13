import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import AscendantLogo from './AscendantLogo';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useGradence } from '../context/GradenceContext';
import { upsertProfile, syncSemesters } from '../services/supabaseService';
import { UserProfile, Semester } from '../types';
import {
  Mail,
  Lock,
  User,
  School,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Sparkles,
  GraduationCap,
  ChevronDown
} from 'lucide-react';

interface LoginScreenProps {
  onContinueAsGuest?: () => void;
  onRegistrationComplete?: (profile: UserProfile, initialSemesters?: { number: number, sgpa: number }[]) => void;
}

export default function LoginScreen({ onContinueAsGuest, onRegistrationComplete }: LoginScreenProps) {
  const { refreshData, updateProfile } = useGradence();
  const [isRegister, setIsRegister] = useState(false);
  const [registerStep, setRegisterStep] = useState(1);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [university, setUniversity] = useState('Sri Eshwar College of Engineering');
  const [customUni, setCustomUni] = useState('');
  const [isCustomUniActive, setIsCustomUniActive] = useState(false);
  const [isUniDropdownOpen, setIsUniDropdownOpen] = useState(false);
  const [gpaScale, setGpaScale] = useState<4 | 10>(10);
  const [currentSemester, setCurrentSemester] = useState(1);
  const [prevSgpas, setPrevSgpas] = useState<{ [key: number]: string }>({});

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const universities = [
    'Sri Eshwar College of Engineering',
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

  const totalRegisterSteps = currentSemester > 1 ? 4 : 3;

  const handleNextStep = () => {
    setErrorMsg(null);
    if (registerStep === 1) {
      if (!name.trim()) {
        setErrorMsg('Please enter your full name.');
        return;
      }
      if (!email.trim() || !password) {
        setErrorMsg('Please enter your email and a password.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password should be at least 6 characters.');
        return;
      }
      setRegisterStep(2);
    } else if (registerStep === 2) {
      setRegisterStep(3);
    } else if (registerStep === 3) {
      if (currentSemester > 1) {
        setRegisterStep(4);
      } else {
        handleRegisterSubmit();
      }
    } else if (registerStep === 4) {
      handleRegisterSubmit();
    }
  };

  const handleRegisterSubmit = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isSupabaseConfigured) {
      setErrorMsg('Supabase is not configured yet. Please verify your .env file.');
      return;
    }

    setLoading(true);

    try {
      const finalUni = isCustomUniActive ? (customUni.trim() || 'My University') : university;
      const initialSemesters: { number: number, sgpa: number }[] = [];

      if (currentSemester > 1) {
        for (let i = 1; i < currentSemester; i++) {
          const val = parseFloat(prevSgpas[i]) || 0;
          initialSemesters.push({ number: i, sgpa: val });
        }
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name: name.trim(),
            university: finalUni,
            currentSemester: currentSemester,
            gpaScale: gpaScale
          }
        }
      });

      if (error) throw error;

      const newProfile: UserProfile = {
        name: name.trim(),
        university: finalUni,
        currentSemester: currentSemester,
        theme: 'se-light',
        gpaScale: gpaScale
      };

      if (data?.user?.id) {
        await upsertProfile(data.user.id, newProfile);
        if (initialSemesters.length > 0) {
          const semList: Semester[] = initialSemesters.map(item => ({
            id: `sem-${item.number}`,
            number: item.number,
            name: `Semester ${item.number}`,
            sgpa: item.sgpa,
            totalCredits: 20,
            subjects: []
          }));
          await syncSemesters(data.user.id, semList);
        }
      }

      if (onRegistrationComplete) {
        onRegistrationComplete(newProfile, initialSemesters);
      } else {
        updateProfile(newProfile);
      }

      if (data?.session) {
        setSuccessMsg('Account created! Initializing your workspace...');
        await refreshData();
      } else {
        setSuccessMsg('Registration successful! Please sign in with your email.');
        setTimeout(() => {
          setIsRegister(false);
          setRegisterStep(1);
        }, 1500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isSupabaseConfigured) {
      setErrorMsg('Supabase is not configured yet. Please verify your .env file.');
      return;
    }

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your email and password.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) throw error;

      setSuccessMsg('Login successful! Synchronizing your records...');
      await refreshData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    if (onContinueAsGuest) {
      onContinueAsGuest();
    } else {
      updateProfile({
        name: 'Guest Scholar',
        university: 'Sri Eshwar College of Engineering',
        currentSemester: 1,
        theme: 'se-light',
        gpaScale: 10
      });
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#330f14] via-[#4a171e] to-[#25090c] text-[#FAF6EE] flex items-center justify-center p-3 sm:p-6 md:p-10 relative overflow-hidden select-none">
      {/* Soft Ambient Bokeh Circles */}
      <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-[#722f37]/25 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-[#8c3a45]/20 blur-[130px] pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-black/40 blur-[90px] pointer-events-none" />

      {/* Main Floating Card (Split Design) */}
      <div className="relative w-full max-w-5xl rounded-[32px] sm:rounded-[40px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.08)] overflow-hidden flex flex-col lg:flex-row min-h-[580px] lg:min-h-[640px] z-10">

        {/* ── LEFT PANEL: University & Academic Illustration ────────── */}
        <div className="w-full lg:w-[52%] bg-[#FAF6EE] text-[#722f37] p-6 sm:p-10 lg:p-12 relative flex flex-col justify-between overflow-hidden">
          {/* Organic Curved Wave Divider on the right edge */}
          <div className="hidden lg:block absolute -right-1 top-0 bottom-0 w-28 pointer-events-none z-10">
            <svg
              className="h-full w-full"
              viewBox="0 0 100 640"
              preserveAspectRatio="none"
              fill="none"
            >
              <path
                d="M 100,0 C 20,150 120,320 15,480 C -15,530 30,600 100,640 L 100,0 Z"
                fill="#541B22"
              />
            </svg>
          </div>

          {/* Top Header: Logo & Branding */}
          <div className="flex items-center justify-between z-20">
            <div className="flex items-center gap-3">
              <AscendantLogo size="md" showText={false} />
              <div>
                <h1 className="text-base font-black font-serif tracking-widest text-[#722f37] uppercase leading-none">
                  ASCENDANT
                </h1>
              </div>
            </div>
          </div>

          {/* Center Graphic: Illustrated Tree of Knowledge */}
          <div className="my-auto py-4 sm:py-6 flex flex-col items-center justify-center text-center relative z-20">
            <div className="relative w-60 h-60 sm:w-72 sm:h-72 flex items-center justify-center">
              {/* Soft decorative background circles matching reference design */}
              <div className="absolute w-52 h-52 sm:w-64 sm:h-64 rounded-full bg-[#E8DCC6]/45 blur-2xl pointer-events-none" />
              <div className="absolute -top-3 -left-3 w-16 h-16 rounded-full bg-[#E8DCC6]/60 blur-md pointer-events-none" />
              <div className="absolute -bottom-2 -right-2 w-20 h-20 rounded-full bg-[#E8DCC6]/40 blur-lg pointer-events-none" />

              {/* Generated flat tree artwork */}
              <img
                src="/login-illustration.jpg"
                alt="Tree Illustration"
                className="relative z-10 w-full h-full object-contain rounded-[32px] drop-shadow-[0_12px_24px_rgba(114,47,55,0.12)]"
              />
            </div>
          </div>

          {/* Bottom Left Footer */}
          <div className="pt-4 border-t border-[#B7A89A]/30 flex items-center justify-between text-[10px] text-[#722f37]/70 z-20">
            <span>© 2026 ASCENDANT</span>
          </div>
        </div>


        {/* ── RIGHT PANEL: Authentication & Onboarding Form ──────────── */}
        <div className="w-full lg:w-[48%] bg-[#541B22] p-6 sm:p-10 lg:p-12 flex flex-col justify-between relative text-[#FAF6EE] overflow-y-auto">

          {/* Top Title Section */}
          <div className="space-y-1 mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl sm:text-4xl font-extrabold font-sans tracking-tight text-[#FAF6EE]">
                {isRegister ? 'Register' : 'Login'}
              </h2>
              {isRegister && (
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-[#3D1318] border border-[#8C3A45] text-[#FAF6EE]">
                  Step {registerStep} of {totalRegisterSteps}
                </span>
              )}
            </div>
          </div>

          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-2xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="mb-4 p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ── REGISTRATION MULTI-STEP FLOW ── */}
          {isRegister ? (
            <div className="space-y-4">
              <AnimatePresence mode="wait">
                {/* STEP 1: Name, Email, Password */}
                {registerStep === 1 && (
                  <motion.div
                    key="step-1"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    className="space-y-3.5"
                  >
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-[#E8DCC6] tracking-wide">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Alex Rivera"
                        className="w-full px-5 py-2.5 rounded-full bg-[#3D1318]/90 border border-[#8C3A45]/40 text-xs text-[#FAF6EE] placeholder:text-[#B7A89A]/60 focus:outline-none focus:ring-2 focus:ring-[#C2737D] transition-all shadow-inner"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-[#E8DCC6] tracking-wide">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="student@university.edu"
                        className="w-full px-5 py-2.5 rounded-full bg-[#3D1318]/90 border border-[#8C3A45]/40 text-xs text-[#FAF6EE] placeholder:text-[#B7A89A]/60 focus:outline-none focus:ring-2 focus:ring-[#C2737D] transition-all shadow-inner"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-[#E8DCC6] tracking-wide">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          className="w-full px-5 py-2.5 pr-12 rounded-full bg-[#3D1318]/90 border border-[#8C3A45]/40 text-xs text-[#FAF6EE] placeholder:text-[#B7A89A]/60 focus:outline-none focus:ring-2 focus:ring-[#C2737D] transition-all shadow-inner"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#E8DCC6]/60 hover:text-[#FAF6EE] transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: College & Grading Scale */}
                {registerStep === 2 && (
                  <motion.div
                    key="step-2"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    className="space-y-3.5"
                  >
                    <div className="space-y-1.5 relative">
                      <label className="block text-xs font-semibold text-[#E8DCC6] tracking-wide">
                        University / College
                      </label>
                      <div
                        onClick={() => setIsUniDropdownOpen(!isUniDropdownOpen)}
                        className="w-full px-5 py-2.5 rounded-full bg-[#3D1318]/90 border border-[#8C3A45]/40 text-xs text-[#FAF6EE] flex items-center justify-between cursor-pointer shadow-inner"
                      >
                        <span className="truncate">
                          {isCustomUniActive ? (customUni || 'Type custom below...') : university}
                        </span>
                        <ChevronDown className="w-4 h-4 text-[#E8DCC6]/60 shrink-0" />
                      </div>

                      {isUniDropdownOpen && (
                        <div className="absolute left-0 right-0 top-full mt-2 z-30 max-h-48 overflow-y-auto rounded-2xl bg-[#3D1318] border border-[#8C3A45] p-2 space-y-1 shadow-2xl">
                          {universities.map((uni) => (
                            <div
                              key={uni}
                              onClick={() => {
                                if (uni === 'Custom...') {
                                  setIsCustomUniActive(true);
                                } else {
                                  setUniversity(uni);
                                  setIsCustomUniActive(false);
                                }
                                setIsUniDropdownOpen(false);
                              }}
                              className="p-2 rounded-xl text-xs font-medium hover:bg-[#541B22] cursor-pointer text-[#FAF6EE] transition-colors"
                            >
                              {uni}
                            </div>
                          ))}
                        </div>
                      )}

                      {isCustomUniActive && (
                        <input
                          type="text"
                          value={customUni}
                          onChange={(e) => setCustomUni(e.target.value)}
                          placeholder="Enter your college or institution name"
                          className="w-full mt-2 px-5 py-2.5 rounded-full bg-[#3D1318]/90 border border-[#8C3A45]/40 text-xs text-[#FAF6EE] placeholder:text-[#B7A89A]/60 focus:outline-none focus:ring-2 focus:ring-[#C2737D] transition-all shadow-inner"
                        />
                      )}
                    </div>

                    {/* Grading Scale */}
                    <div className="space-y-1.5 pt-1">
                      <label className="block text-xs font-semibold text-[#E8DCC6] tracking-wide">
                        Grading Scale
                      </label>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setGpaScale(10)}
                          className={`p-3 rounded-2xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer border ${
                            gpaScale === 10
                              ? 'bg-[#FAF6EE] text-[#722f37] border-white shadow-md'
                              : 'bg-[#3D1318]/90 text-[#FAF6EE] border-[#8C3A45]/40'
                          }`}
                        >
                          <span className="font-extrabold text-sm">10.0 Scale</span>
                          <span className="text-[10px] opacity-75">India, Europe (Anna Univ)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setGpaScale(4)}
                          className={`p-3 rounded-2xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer border ${
                            gpaScale === 4
                              ? 'bg-[#FAF6EE] text-[#722f37] border-white shadow-md'
                              : 'bg-[#3D1318]/90 text-[#FAF6EE] border-[#8C3A45]/40'
                          }`}
                        >
                          <span className="font-extrabold text-sm">4.0 Scale</span>
                          <span className="text-[10px] opacity-75">USA, Canada</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: Current Semester Standing */}
                {registerStep === 3 && (
                  <motion.div
                    key="step-3"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    className="space-y-3.5"
                  >
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-[#E8DCC6] tracking-wide">
                        Which semester are you currently enrolled in?
                      </label>
                      <p className="text-[11px] text-[#E8DCC6]/65">
                        Select your active semester standing:
                      </p>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                        <button
                          key={sem}
                          type="button"
                          onClick={() => setCurrentSemester(sem)}
                          className={`py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer border ${
                            currentSemester === sem
                              ? 'bg-[#FAF6EE] text-[#722f37] border-white shadow-md scale-105'
                              : 'bg-[#3D1318]/90 text-[#FAF6EE] border-[#8C3A45]/40 hover:bg-[#4d1920]'
                          }`}
                        >
                          Sem {sem}
                        </button>
                      ))}
                    </div>

                    {currentSemester > 1 && (
                      <div className="p-3 rounded-2xl bg-[#3D1318]/90 border border-[#8C3A45]/40 text-[11px] text-[#E8DCC6]/80 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                        <span>In the next step, you can enter your marks (SGPAs) for Semesters 1 to {currentSemester - 1}.</span>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* STEP 4: Marks Obtained in Previous Semesters */}
                {registerStep === 4 && (
                  <motion.div
                    key="step-4"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    className="space-y-3"
                  >
                    <div className="space-y-0.5">
                      <label className="block text-xs font-semibold text-[#E8DCC6] tracking-wide">
                        Previous Semester Marks / SGPAs
                      </label>
                      <p className="text-[11px] text-[#E8DCC6]/70">
                        Enter your previous grades to immediately plot your CGPA trendline:
                      </p>
                    </div>

                    <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                      {Array.from({ length: currentSemester - 1 }, (_, i) => i + 1).map((semNum) => (
                        <div key={semNum} className="flex items-center justify-between gap-3 bg-[#3D1318]/90 p-2 px-3.5 rounded-2xl border border-[#8C3A45]/40">
                          <span className="text-xs font-bold text-[#FAF6EE]">
                            Semester {semNum} SGPA
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max={gpaScale}
                            value={prevSgpas[semNum] || ''}
                            onChange={(e) => setPrevSgpas({ ...prevSgpas, [semNum]: e.target.value })}
                            placeholder={gpaScale === 10 ? '8.50' : '3.50'}
                            className="w-24 px-3 py-1 rounded-xl bg-[#2A0C10] border border-[#8C3A45]/60 text-xs font-bold text-right text-[#FAF6EE] focus:outline-none focus:ring-1 focus:ring-[#C2737D]"
                          />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Wizard Step Controls */}
              <div className="flex items-center gap-2.5 pt-2">
                {registerStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setRegisterStep(registerStep - 1)}
                    className="py-3 px-5 rounded-full bg-[#3D1318] hover:bg-[#4d1920] border border-[#8C3A45] text-xs font-bold text-[#FAF6EE] flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                )}

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleNextStep}
                  className="flex-1 py-3 px-6 rounded-full bg-gradient-to-r from-[#9C444E] to-[#722F37] hover:from-[#A84E59] hover:to-[#82353E] border border-white/20 text-[#FAF6EE] font-bold text-xs tracking-wide shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span>
                    {loading
                      ? 'Creating Account...'
                      : registerStep === totalRegisterSteps
                      ? 'Complete Registration & Sync'
                      : 'Next Step'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* ── DIRECT LOGIN FORM ── */
            <form onSubmit={handleLoginSubmit} className="space-y-4 sm:space-y-5">
              {/* Email Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#E8DCC6] tracking-wide">
                  Username / Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    className="w-full px-5 py-3 rounded-full bg-[#3D1318]/90 border border-[#8C3A45]/40 text-xs text-[#FAF6EE] placeholder:text-[#B7A89A]/60 focus:outline-none focus:ring-2 focus:ring-[#C2737D] transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#E8DCC6] tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-5 py-3 pr-12 rounded-full bg-[#3D1318]/90 border border-[#8C3A45]/40 text-xs text-[#FAF6EE] placeholder:text-[#B7A89A]/60 focus:outline-none focus:ring-2 focus:ring-[#C2737D] transition-all shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#E8DCC6]/60 hover:text-[#FAF6EE] transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => alert('Password reset instructions will be sent to your email.')}
                    className="text-[11px] text-[#E8DCC6]/60 hover:text-[#FAF6EE] transition-colors hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 px-6 rounded-full bg-gradient-to-r from-[#9C444E] to-[#722F37] hover:from-[#A84E59] hover:to-[#82353E] border border-white/20 text-[#FAF6EE] font-bold text-sm tracking-wide shadow-[0_8px_20px_rgba(0,0,0,0.35)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>
                  {loading ? 'Connecting to Supabase...' : 'Login to ASCENDANT'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Bottom Switcher: Register / Login */}
          <div className="mt-5 text-center space-y-2.5">
            <p className="text-xs text-[#E8DCC6]/80 font-medium">
              {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setRegisterStep(1);
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="text-[#FAF6EE] font-bold hover:underline ml-1 cursor-pointer underline-offset-2"
              >
                {isRegister ? 'Login Now' : 'Register Now'}
              </button>
            </p>

            {/* Guest fallback link */}
            <div>
              <button
                type="button"
                onClick={handleGuest}
                className="text-[11px] text-[#E8DCC6]/60 hover:text-[#FAF6EE] transition-colors hover:underline cursor-pointer"
              >
                Continue without sign in (Guest Mode) →
              </button>
            </div>
          </div>

          {/* Bottom Links */}
          <div className="mt-6 pt-3 border-t border-[#8C3A45]/30 flex flex-col sm:flex-row items-center justify-between text-[10px] text-[#E8DCC6]/50 gap-2">
            <span>Terms and Privacy</span>
            <span>
              Support:{' '}
              <a href="mailto:tharikashri19@gmail.com" className="underline text-[#E8DCC6]/70 hover:text-[#FAF6EE]">
                tharikashri19@gmail.com
              </a>
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}
