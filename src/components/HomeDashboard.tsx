import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { UserProfile, Semester, Exam, Activity, ToolType, Quote } from '../types';
import { useGradence } from '../context/GradenceContext';
import NeonSpinningBadge from './NeonSpinningBadge';
import CurvedRibbonShowcase from './CurvedRibbonShowcase';
import { 
  Calculator, 
  Calendar, 
  CheckSquare, 
  Flame, 
  GraduationCap, 
  Hash, 
  PieChart, 
  TrendingUp, 
  Clock, 
  Bell, 
  ArrowRight, 
  ArrowUpRight, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  Check, 
  Target, 
  BookOpen,
  Code,
  FileText,
  Quote as QuoteIcon
} from 'lucide-react';

interface HomeDashboardProps {
  profile: UserProfile;
  semesters: Semester[];
  exams: Exam[];
  activities: Activity[];
  onNavigateToTool: (tool: ToolType) => void;
  attendanceAvg: number;
}

const QUOTES: Quote[] = [
  { text: "Small daily improvements over time lead to stunning academic results.", author: "Robin Sharma" },
  { text: "Consistency is what transforms average into excellence.", author: "Tony Robbins" },
  { text: "Focus on progress, not perfection. One day and one topic at a time.", author: "Daily Reminder" },
  { text: "The secret to getting ahead is simply getting started.", author: "Mark Twain" },
  { text: "Stay curious, stay consistent, and your grades will follow.", author: "Study Principle" }
];

export default function HomeDashboard({ 
  profile, 
  semesters, 
  exams, 
  activities, 
  onNavigateToTool,
  attendanceAvg 
}: HomeDashboardProps) {
  const [greeting, setGreeting] = useState('Good Morning');
  const [quote, setQuote] = useState<Quote>(() => QUOTES[0]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasUnread, setHasUnread] = useState(() => {
    const lastRead = parseInt(localStorage.getItem('ascendant_last_read_activities_count') || '0', 10);
    return activities.length > lastRead;
  });
  const prevLengthRef = useRef(activities.length);

  useEffect(() => {
    const lastRead = parseInt(localStorage.getItem('ascendant_last_read_activities_count') || '0', 10);
    if (activities.length > prevLengthRef.current && activities.length > lastRead) {
      setHasUnread(true);
    }
    prevLengthRef.current = activities.length;
  }, [activities.length]);

  const handleToggleNotifications = () => {
    const newState = !showNotifications;
    setShowNotifications(newState);
    if (newState) {
      localStorage.setItem('ascendant_last_read_activities_count', activities.length.toString());
      setHasUnread(false);
    }
  };

  const { 
    attendanceSubjects, 
    habits, 
    timetable, 
    saveHabits,
    clearActivities
  } = useGradence();

  const toggleHabit = (id: string) => {
    const updated = habits.map(h => h.id === id ? { ...h, completed: !h.completed } : h);
    saveHabits(updated);
  };

  useEffect(() => {
    const hrs = new Date().getHours();
    if (hrs < 12) setGreeting('Good Morning');
    else if (hrs < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    const day = new Date().getDate();
    setQuote(QUOTES[day % QUOTES.length]);
  }, []);

  // Calculate current cumulative GPA
  const calculateCGPA = () => {
    if (semesters.length === 0) return 0.0;
    const totalSGPACredits = semesters.reduce((sum, sem) => sum + (sem.sgpa * sem.totalCredits), 0);
    const totalCredits = semesters.reduce((sum, sem) => sum + sem.totalCredits, 0);
    if (totalCredits === 0) return 0.0;
    return parseFloat((totalSGPACredits / totalCredits).toFixed(2));
  };

  const cgpa = calculateCGPA();
  const maxScale = profile.gpaScale === 10 ? 10.0 : 4.0;
  const gpaPercentage = cgpa > 0 ? Math.min(100, Math.round((cgpa / maxScale) * 100)) : 0;
  const totalCreditsEarned = semesters.reduce((sum, sem) => sum + sem.totalCredits, 0);

  // Friendly attendance calculation
  const getAttendanceBuffer = () => {
    if (attendanceSubjects.length === 0) {
      return { buffer: 0, status: 'neutral', label: 'No classes logged yet', percentage: 0 };
    }
    const totalPresent = attendanceSubjects.reduce((acc, s) => acc + s.present, 0);
    const totalClasses = attendanceSubjects.reduce((acc, s) => acc + s.total, 0);
    if (totalClasses === 0) return { buffer: 0, status: 'neutral', label: 'No classes held yet', percentage: 0 };

    const currentPct = parseFloat(((totalPresent / totalClasses) * 100).toFixed(1));
    const target = 0.75; // 75% requirement

    if (currentPct >= 75) {
      const safeSkips = Math.floor((totalPresent - target * totalClasses) / target);
      return { 
        buffer: Math.max(0, safeSkips), 
        status: 'safe', 
        label: `${Math.max(0, safeSkips)} Classes Safe to Skip`,
        percentage: currentPct
      };
    } else {
      const needed = Math.ceil((target * totalClasses - totalPresent) / (1 - target));
      return { 
        buffer: needed, 
        status: 'critical', 
        label: `Attend Next ${needed} Classes in a Row`,
        percentage: currentPct
      };
    }
  };

  const attendanceBuffer = getAttendanceBuffer();
  const nextExam = exams.length > 0 ? exams[0] : null;
  const completedHabitsCount = habits.filter(h => h.completed).length;

  return (
    <div id="ascendant-dashboard" className="h-full flex flex-col justify-between space-y-3.5 sm:space-y-4.5 select-none">
      
      {/* ── 1. Top Greeting & Profile Header Bar ────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0.5 shrink-0">
        <div>
          {/* Status Pills Row */}
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="clay-badge-burgundy px-3 py-0.5 text-[10px] sm:text-[11px] tracking-wide inline-flex items-center gap-1.5 shadow-sm font-bold">
              <span className="w-2 h-2 rounded-full bg-[#FAF6EE] animate-pulse" />
              SEM {profile.currentSemester} • ACTIVE
            </span>
            <span className="text-xs text-[#7A6B5E] font-medium hidden sm:inline">
              • {profile.university || 'College Workspace'}
            </span>
            <span className="text-xs text-[#722f37] font-semibold hidden md:inline">
              • 100% Private & Offline
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#722f37] leading-tight">
            {greeting}, <span className="underline decoration-[#B7A89A]/50">{profile.name || 'Student'}</span>!
          </h1>
        </div>

        {/* Top Controls: Activity Log & Quick Target Goal */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          {/* Notifications Log */}
          <div className="relative">
            <button 
              onClick={handleToggleNotifications}
              className="clay-btn-latte px-3.5 py-2 flex items-center gap-2 transition-all active:scale-95 text-xs sm:text-sm font-bold font-mono text-[#722f37]"
              aria-label="Activity notifications"
              title="Recent academic updates"
            >
              <Bell className="w-4 h-4 text-[#722f37]" />
              <span>{activities.length}</span>
              {hasUnread && activities.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#722f37] animate-ping" />
              )}
            </button>

            {/* Notifications Popover */}
            {showNotifications && (
              <div className="absolute top-12 right-0 w-80 sm:w-88 clay-card bg-[#FAF6EE] p-0 z-50 overflow-hidden shadow-2xl">
                <div className="p-3.5 border-b border-[#B7A89A]/30 flex justify-between items-center bg-[#E8DCC6]/60">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#722f37]" />
                    <span className="text-xs font-extrabold text-[#722f37] uppercase tracking-wider">
                      Recent Activity
                    </span>
                  </div>
                  {activities.length > 0 && (
                    <button 
                      onClick={() => { 
                        clearActivities(); 
                        localStorage.setItem('ascendant_last_read_activities_count', '0'); 
                        setHasUnread(false); 
                        setShowNotifications(false); 
                      }}
                      className="text-[10px] text-[#722f37] hover:underline font-bold uppercase cursor-pointer"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                <div className="max-h-60 overflow-y-auto p-3 space-y-2">
                  {activities.length === 0 ? (
                    <div className="p-3 text-center text-xs text-[#7A6B5E]">
                      No recent activities logged yet.
                    </div>
                  ) : (
                    activities.map((act) => (
                      <div key={act.id} className="p-2 rounded-xl bg-[#E8DCC6]/40 border border-white/60">
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-[#722f37] text-xs">{act.title}</span>
                          <span className="text-[10px] text-[#8C7D70] font-mono">
                            {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-[#7A6B5E] mt-0.5 leading-snug">{act.detail}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Target GPA button */}
          <button
            onClick={() => onNavigateToTool('gpa')}
            className="flex items-center gap-2 clay-btn-burgundy px-4 py-2 text-xs sm:text-sm font-bold shadow-sm transition-all active:scale-95"
            title="Plan future target GPA"
          >
            <Target className="w-4 h-4" />
            <span>Target Goal Planner</span>
          </button>
        </div>
      </div>

      {/* ── 2. Pillowy Claymorphic Hero Welcome Card (Split 50/50: Tools & Quote) ─ */}
      <div className="clay-card p-4 sm:p-5 md:p-6 relative overflow-hidden bg-gradient-to-br from-[#FDFBF7] via-[#F6EFE3] to-[#E8DCC6] rounded-[26px] shadow-[6px_6px_20px_rgba(114,47,55,0.06),-4px_-4px_14px_rgba(255,255,255,0.95)] shrink-0">
        {/* Soft decorative background accents */}
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 rounded-full bg-[#B7A89A]/15 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-48 h-48 rounded-full bg-[#722f37]/8 blur-2xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-stretch">
          {/* ── Left Half (6 Cols): Everyday Student Companion ── */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-3.5 text-center sm:text-left">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8DCC6] border border-white/80 text-[10px] sm:text-[10.5px] text-[#722f37] font-extrabold uppercase tracking-wide shadow-sm">
                <Sparkles className="w-3 h-3 text-[#722f37]" />
                EVERYDAY STUDENT OPERATING COMPANION
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-black text-[#722f37] tracking-tight leading-snug">
                  Track Your Grades. Protect Your Attendance.
                </h2>
                <p className="text-xs sm:text-sm text-[#7A6B5E] mt-1 font-medium leading-relaxed">
                  Simple, reliable tools to calculate semester scores, forecast safe class skips, and reach your target GPA.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1">
              <button
                type="button"
                onClick={() => onNavigateToTool('cgpa')}
                className="clay-btn-burgundy px-4.5 py-2 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm active:scale-95 cursor-pointer"
              >
                <span>Calculate Your CGPA</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateToTool('attendance')}
                className="clay-btn-latte px-4.5 py-2 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm active:scale-95 cursor-pointer"
              >
                <span>Check Safe Skip Margin</span>
                <CheckSquare className="w-4 h-4 text-[#722f37]" />
              </button>
            </div>
          </div>

          {/* ── Right Half (6 Cols): Dedicated Study Quote & CGPA Medallion ── */}
          <div className="lg:col-span-6 flex items-stretch">
            <div className="w-full bg-gradient-to-br from-[#FFFCF8]/90 via-[#F8F2E7]/80 to-[#EAE0CD]/75 border-2 border-white/90 rounded-[22px] p-4 sm:p-5 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),3px_3px_12px_rgba(114,47,55,0.05)] flex flex-col justify-between relative overflow-hidden group">
              {/* Subtle background quote watermark */}
              <QuoteIcon className="absolute -bottom-2 -right-2 w-28 h-28 text-[#722f37]/5 pointer-events-none rotate-12" />

              {/* Quote Card Header */}
              <div className="flex items-center justify-between relative z-10 pb-2 border-b border-[#B7A89A]/25">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#E8DCC6] border border-white/80 flex items-center justify-center text-[#722f37] shadow-xs">
                    <QuoteIcon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] sm:text-[10.5px] font-sans uppercase tracking-wider text-[#722f37] font-extrabold">
                    DAILY ACADEMIC REFLECTION
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const nextIdx = (QUOTES.indexOf(quote) + 1) % QUOTES.length;
                    setQuote(QUOTES[nextIdx]);
                  }}
                  title="Read another quote"
                  className="text-[10px] sm:text-[11px] font-bold text-[#722f37] bg-[#E8DCC6]/70 hover:bg-[#E8DCC6] border border-white/80 px-2.5 py-0.5 rounded-full transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-[#722f37]" />
                  <span>Next Quote</span>
                </button>
              </div>

              {/* Quote Body with Refined Serif Typography */}
              <div className="my-3 sm:my-3.5 relative z-10 flex items-start gap-2.5">
                <span className="text-2xl sm:text-3xl font-serif text-[#722f37]/40 leading-none shrink-0 pt-0.5">“</span>
                <div className="space-y-1">
                  <p className="font-serif italic text-sm sm:text-base md:text-[16px] text-[#4A2026] font-semibold leading-relaxed">
                    {quote.text}
                  </p>
                  <p className="text-xs sm:text-sm font-sans font-bold text-[#7A6B5E] pt-0.5">
                    — {quote.author}
                  </p>
                </div>
              </div>

              {/* Quote Footer: Academic Mindset Note & Spinning Medallion */}
              <div className="pt-2 border-t border-[#B7A89A]/25 flex items-center justify-between relative z-10">
                <span className="text-[10.5px] sm:text-[11px] text-[#8C7D70] font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#722f37]/60" />
                  Mindset for engineers & scholars
                </span>

                <div className="flex items-center gap-2">
                  <NeonSpinningBadge
                    size="sm"
                    onClick={() => onNavigateToTool('cgpa')}
                  />
                  <span className="text-[8.5px] font-sans text-[#8C7D70] font-extrabold uppercase tracking-wider hidden sm:inline">
                    CGPA BADGE
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Student Tools at a Glance (Full-Width Ribbon Carousel) ─────── */}
      <div className="shrink-0">
        <CurvedRibbonShowcase onSelectTool={onNavigateToTool} />
      </div>

      {/* ── 4. Core Academic Metrics (3-Card Balanced Bento Row) ───────────── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 sm:gap-4 shrink-0">

        {/* Bento Card 1: Overall CGPA & Grade Status (5 Cols) */}
        <div className="md:col-span-5 clay-card p-4 sm:p-4.5 flex flex-col justify-between space-y-3 rounded-[24px] shadow-[6px_6px_18px_rgba(114,47,55,0.06),-4px_-4px_12px_rgba(255,255,255,0.95)]">
          {/* Card Top Meta */}
          <div className="flex items-center justify-between pb-2 border-b border-[#B7A89A]/30">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-[#E8DCC6] border border-white/80 shadow-sm flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-[#722f37]" />
              </div>
              <span className="text-xs sm:text-sm font-extrabold text-[#722f37] uppercase tracking-wide">
                OVERALL GRADE SCORE
              </span>
            </div>
            <span className="clay-badge-burgundy px-2.5 py-0.5 text-[9.5px] uppercase tracking-wider font-bold">
              {semesters.length} SEMESTERS
            </span>
          </div>

          {/* Radial Progress & Details */}
          <div className="flex items-center gap-4">
            {/* Radial Arc Gauge */}
            <div className="relative w-24 h-24 sm:w-26 sm:h-26 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#E8DCC6"
                  strokeWidth="9"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#722f37"
                  strokeWidth="9"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * gpaPercentage) / 100}
                  strokeLinecap="round"
                  fill="none"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>

              {/* Center Number */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl sm:text-[28px] font-black text-[#722f37] tracking-tight leading-none">
                  {cgpa > 0 ? cgpa.toFixed(2) : '—'}
                </span>
                <span className="text-[9px] font-sans font-extrabold text-[#8C7D70] uppercase mt-0.5">
                  / {maxScale.toFixed(1)}
                </span>
              </div>
            </div>

            {/* Standing & Explanation */}
            <div className="flex-1 space-y-2 min-w-0">
              <div className="p-2.5 rounded-xl bg-[#E8DCC6]/50 border border-white/80 space-y-1.5 shadow-inner">
                <div className="flex justify-between items-center text-xs sm:text-[13px]">
                  <span className="text-[#722f37] font-bold">Standing</span>
                  <span className="text-[#722f37] font-extrabold flex items-center gap-1 text-xs">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    {cgpa >= 8.5 ? 'First Class Distinction' : cgpa >= 7.5 ? 'First Class' : 'Good Standing'}
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="w-full bg-[#D8C9B0] h-2 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-[#853740] to-[#722f37] rounded-full transition-all duration-1000"
                    style={{ width: `${Math.max(8, gpaPercentage)}%` }}
                  />
                </div>
                
                <div className="flex justify-between items-center text-xs text-[#7A6B5E]">
                  <span>Score: <strong className="text-[#722f37] font-bold">{gpaPercentage}%</strong></span>
                  <span>Credits: <strong className="text-[#722f37] font-bold">{totalCreditsEarned}</strong></span>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => onNavigateToTool('cgpa')}
                className="w-full clay-btn-burgundy py-2 text-xs sm:text-[13px] font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
              >
                <span>Open CGPA Calculator</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Bento Card 2: Attendance Safety Meter (4 Cols) */}
        <div className="md:col-span-4 clay-card p-4 sm:p-4.5 flex flex-col justify-between space-y-3 rounded-[24px] shadow-[6px_6px_18px_rgba(114,47,55,0.06),-4px_-4px_12px_rgba(255,255,255,0.95)]">
          {/* Card Top Meta */}
          <div className="flex items-center justify-between pb-2 border-b border-[#B7A89A]/30">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#E8DCC6] border border-white/80 shadow-sm flex items-center justify-center">
                <CheckSquare className="w-4 h-4 text-[#722f37]" />
              </div>
              <span className="text-xs sm:text-sm font-extrabold text-[#722f37] uppercase tracking-wide">
                ATTENDANCE & SKIPS
              </span>
            </div>
            <span className={`clay-badge px-2.5 py-0.5 text-[9px] uppercase font-extrabold ${
              attendanceBuffer.status === 'safe' ? 'bg-[#722f37] text-white' : 'bg-[#B7A89A] text-white'
            }`}>
              75% GOAL
            </span>
          </div>

          {/* Big Plain-English Skip Counter */}
          <div className="p-3.5 rounded-xl bg-[#E8DCC6]/60 border border-white/80 space-y-0.5 text-center shadow-inner">
            <span className="text-4xl sm:text-[42px] font-black text-[#722f37] block leading-none">
              {attendanceBuffer.buffer}
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-[#722f37] block leading-tight pt-1">
              {attendanceBuffer.status === 'safe'
                ? 'Lectures Safe to Skip'
                : 'Consecutive Classes Required'}
            </span>
            <p className="text-xs text-[#7A6B5E] leading-tight pt-0.5">
              {attendanceBuffer.status === 'safe'
                ? `Attendance is ${attendanceBuffer.percentage}%. Safe above 75% limit.`
                : `Attendance is ${attendanceBuffer.percentage}%. Attend ${attendanceBuffer.buffer} to recover.`}
            </p>
          </div>

          {/* Action button */}
          <button
            type="button"
            onClick={() => onNavigateToTool('attendance')}
            className="w-full clay-btn-latte py-2 text-xs sm:text-[13px] font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
          >
            <span>Manage Subject Attendance</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#722f37]" />
          </button>
        </div>

        {/* Bento Card 3: Upcoming Exams & Routine (3 Cols) */}
        <div className="md:col-span-3 clay-card p-4 sm:p-4.5 flex flex-col justify-between space-y-3 rounded-[24px] shadow-[6px_6px_18px_rgba(114,47,55,0.06),-4px_-4px_12px_rgba(255,255,255,0.95)]">
          <div className="flex items-center justify-between pb-2 border-b border-[#B7A89A]/30">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#E8DCC6] border border-white/80 shadow-sm flex items-center justify-center">
                <Calendar className="w-4 h-4 text-[#722f37]" />
              </div>
              <span className="text-xs sm:text-sm font-extrabold text-[#722f37] uppercase tracking-wide truncate">
                EXAMS & ROUTINE
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold text-[#722f37]">
              {completedHabitsCount}/{habits.length} Done
            </span>
          </div>

          {/* Next Exam or Habit snippet */}
          <div className="p-3 rounded-xl bg-[#E8DCC6]/50 border border-white/80 shadow-inner space-y-1">
            {nextExam ? (
              <div>
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="font-extrabold text-[#722f37] truncate">{nextExam.subject}</span>
                  <span className="text-[9.5px] font-bold text-[#722f37] bg-[#FAF6EE] px-2 py-0.5 rounded-full capitalize">
                    {nextExam.priority || 'Medium'}
                  </span>
                </div>
                <span className="text-xs text-[#7A6B5E] block mt-0.5">
                  Date: {nextExam.date}
                </span>
              </div>
            ) : (
              <div className="text-xs text-[#7A6B5E] text-center py-1">
                No upcoming exams scheduled!
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigateToTool('exam')}
            className="w-full clay-btn-latte py-2 text-xs sm:text-[13px] font-bold flex items-center justify-center gap-1.5 active:scale-95"
          >
            <span>Exam & Habits Planner</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#722f37]" />
          </button>
        </div>

      </div>

      {/* ── 5. System Status & Offline Privacy Bar ──────────────────────── */}
      <div className="clay-card py-2.5 px-4 sm:px-5 flex items-center justify-between gap-4 bg-gradient-to-r from-[#FAF6EE] to-[#E8DCC6] rounded-[20px] shadow-[4px_4px_14px_rgba(114,47,55,0.05),-3px_-3px_10px_rgba(255,255,255,0.95)] shrink-0">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-[#722f37] shrink-0" />
          <span className="text-xs sm:text-sm font-bold text-[#722f37]">
            ASCENDANT Academic Operating System
          </span>
          <span className="text-xs text-[#8C7D70] font-medium hidden sm:inline">
            • All academic data cached locally in device memory
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-bold text-[#722f37] bg-[#E8DCC6]/80 px-3 py-1 rounded-full border border-white/80 shrink-0 shadow-inner">
          <ShieldCheck className="w-4 h-4 text-[#722f37]" />
          <span>100% Private & Offline</span>
        </div>
      </div>

    </div>
  );
}
