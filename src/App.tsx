import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UserProfile,
  Semester,
  AttendanceSubject,
  Exam,
  Activity,
  TabType,
  ToolType
} from './types';

// Component Imports
import SplashScreen from './components/SplashScreen';
import Onboarding from './components/Onboarding';
import BottomNavBar from './components/BottomNavBar';
import HomeDashboard from './components/HomeDashboard';
import ToolsScreen from './components/ToolsScreen';
import CGPACalculator from './components/CGPACalculator';
import AttendanceTracker from './components/AttendanceTracker';
import TargetGPAPredictor from './components/TargetGPAPredictor';
import ExamPlanner from './components/ExamPlanner';
import Converter from './components/Converter';
import ProgressScreen from './components/ProgressScreen';
import SettingsScreen from './components/SettingsScreen';
import AISpace from './components/AISpace';
import CodingProfiles from './components/CodingProfiles';
import RoadmapsManager from './components/RoadmapsManager';
import DailyPlanner from './components/DailyPlanner';
import EventsScreen from './components/EventsScreen';
import ResumeBuilder from './components/ResumeBuilder';
import AcademicCalendarScreen from './components/AcademicCalendarScreen';
import AscendantLogo from './components/AscendantLogo';
import MobileMenuDrawer from './components/MobileMenuDrawer';
import ToastNotification, { ToastMessage, ToastType } from './components/ToastNotification';
import Footer from './components/Footer';
import NotFoundScreen from './components/NotFoundScreen';
import { GradenceProvider, useGradence } from './context/GradenceContext';

export default function App() {
  return (
    <GradenceProvider>
      <AppContent />
    </GradenceProvider>
  );
}

function AppContent() {
  const {
    profile,
    semesters,
    attendanceSubjects,
    exams,
    activities,
    isInitialized,
    isStorageLoading,
    updateProfile,
    saveSemester,
    saveSemesters,
    saveAttendance,
    saveExams,
    resetData,
    importData,
    exportData
  } = useGradence();

  const [showSplash, setShowSplash] = useState(true);
  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [activeTool, setActiveTool] = useState<ToolType | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (title: string, message?: string, type: ToastType = 'success') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const mainContentRef = useRef<HTMLElement>(null);

  // Dynamic Browser Title synchronization
  useEffect(() => {
    const titles: Record<TabType, string> = {
      home: 'ASCENDANT — Student Home',
      tools: 'ASCENDANT — Academic Tools',
      progress: 'ASCENDANT — Grade & Growth Journey',
      ai: 'ASCENDANT — AI Study Companion',
      settings: 'ASCENDANT — Preferences & Settings'
    };
    document.title = titles[currentTab] || 'ASCENDANT — Your Everyday Academic Companion';
  }, [currentTab]);

  // Scroll to top on tab or tool change
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
  }, [currentTab, activeTool]);

  // Sync profile values to root DOM to maintain light clay theme
  useEffect(() => {
    // Default to light clay theme (Mocha Cream #E8DCC6, Cosmic Latte #B7A89A, Deep Burgundy #722f37)
    document.documentElement.classList.remove('dark', 'se-dark-theme');
    document.documentElement.classList.add('light-theme', 'clay-theme');
    document.documentElement.style.backgroundColor = '#F3EBDD';
    document.documentElement.style.color = '#722f37';
  }, [profile]);

  // Onboarding Complete Handler
  const handleOnboardingComplete = (newProfile: UserProfile, initialSemesters?: { number: number, sgpa: number }[]) => {
    updateProfile(newProfile);

    if (initialSemesters && initialSemesters.length > 0) {
      const semestersToSave = initialSemesters.map(item => ({
        id: `sem-${item.number}`,
        number: item.number,
        name: `Semester ${item.number}`,
        sgpa: item.sgpa,
        totalCredits: 20, // default credits
        subjects: []
      }));
      saveSemesters(semestersToSave);
    }
  };

  // Aggregate current average attendance percentage
  const getAttendanceAvg = () => {
    if (attendanceSubjects.length === 0) return 0;
    const totalLogCount = attendanceSubjects.reduce((sum, s) => sum + s.total, 0);
    const totalPresentCount = attendanceSubjects.reduce((sum, s) => sum + s.present, 0);
    if (totalLogCount === 0) return 0;
    return parseFloat(((totalPresentCount / totalLogCount) * 100).toFixed(1));
  };

  // Navigation controller for home-to-tool link
  const handleNavigateToTool = (tool: ToolType) => {
    setCurrentTab('tools');
    setActiveTool(tool);
  };

  // Helper to render the active tab content
  const renderTabContent = () => {
    if (!profile) return null;

    switch (currentTab) {
      case 'home':
        return (
          <HomeDashboard
            profile={profile}
            semesters={semesters}
            exams={exams}
            activities={activities}
            onNavigateToTool={handleNavigateToTool}
            attendanceAvg={getAttendanceAvg()}
          />
        );

      case 'tools':
        if (activeTool === 'cgpa') {
          return (
            <CGPACalculator
              profile={profile}
              savedSemesters={semesters}
              onSaveSemester={saveSemester}
              onBack={() => setActiveTool(null)}
            />
          );
        }
        if (activeTool === 'attendance') {
          return (
            <AttendanceTracker
              savedSubjects={attendanceSubjects}
              onSaveSubjects={saveAttendance}
              onBack={() => setActiveTool(null)}
            />
          );
        }
        if (activeTool === 'gpa') {
          return (
            <TargetGPAPredictor
              profile={profile}
              onBack={() => setActiveTool(null)}
            />
          );
        }
        if (activeTool === 'exam') {
          return (
            <ExamPlanner
              savedExams={exams}
              onSaveExams={saveExams}
              onBack={() => setActiveTool(null)}
            />
          );
        }
        if (activeTool === 'converter') {
          return (
            <Converter
              onBack={() => setActiveTool(null)}
            />
          );
        }
        if (activeTool === 'coding') {
          return (
            <CodingProfiles
              onBack={() => setActiveTool(null)}
            />
          );
        }
        if (activeTool === 'roadmaps') {
          return (
            <RoadmapsManager
              onBack={() => setActiveTool(null)}
            />
          );
        }
        if (activeTool === 'planner') {
          return (
            <DailyPlanner
              onBack={() => setActiveTool(null)}
            />
          );
        }
        if (activeTool === 'events') {
          return (
            <EventsScreen
              onBack={() => setActiveTool(null)}
            />
          );
        }
        if (activeTool === 'academic-calendar') {
          return (
            <AcademicCalendarScreen
              onBack={() => setActiveTool(null)}
            />
          );
        }
        if (activeTool === 'resume') {
          return (
            <ResumeBuilder
              onBack={() => setActiveTool(null)}
            />
          );
        }
        return (
          <ToolsScreen
            onSelectTool={(tool) => setActiveTool(tool)}
          />
        );

      case 'progress':
        return (
          <ProgressScreen
            semesters={semesters}
            attendanceSubjects={attendanceSubjects}
            gpaScale={profile.gpaScale}
          />
        );

      case 'ai':
        return (
          <AISpace
            profile={profile}
            semesters={semesters}
            attendanceSubjects={attendanceSubjects}
            onNavigateToTool={(tool) => {
              setCurrentTab('tools');
              setActiveTool(tool);
            }}
          />
        );

      case 'settings':
        return (
          <SettingsScreen
            profile={profile}
            onUpdateProfile={updateProfile}
            onResetData={resetData}
            onExportData={exportData}
            onImportData={importData}
          />
        );

      default:
        return (
          <NotFoundScreen
            onReturnHome={() => {
              setCurrentTab('home');
              setActiveTool(null);
            }}
          />
        );
    }
  };

  if (isStorageLoading) {
    return (
      <div className="min-h-screen bg-[#F3EBDD] text-[#722f37] flex flex-col items-center justify-center gap-4 relative">
        <div className="w-12 h-12 border-3 border-t-[#722f37] border-[#B7A89A]/30 rounded-full animate-spin shadow-md" />
        <span className="text-xs font-mono text-[#722f37] uppercase tracking-widest font-bold">
          Opening ASCENDANT...
        </span>
        <div className="clay-badge text-[10px] px-3.5 py-1 text-[#FAF6EE]">
          Your Everyday Academic Companion
        </div>
      </div>
    );
  }

  return (
    <div id="app-root-shell" className="h-[100dvh] min-h-[100dvh] overflow-hidden bg-[#F3EBDD] text-[#722f37] relative flex flex-col">
      <AnimatePresence mode="wait">
        {/* Splash Screen */}
        {showSplash && (
          <div key="splash" className="h-full w-full">
            <SplashScreen onComplete={() => setShowSplash(false)} />
          </div>
        )}

        {/* Onboarding screen if first time */}
        {!showSplash && !isInitialized && (
          <div key="onboarding" className="w-full h-full bg-[#F3EBDD] overflow-y-auto">
            <Onboarding onComplete={handleOnboardingComplete} />
          </div>
        )}

        {/* Primary Dashboard Container */}
        {!showSplash && isInitialized && profile && (
          <motion.div
            key="main-app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-full flex flex-col overflow-hidden relative min-h-0"
          >
            {/* Ambient warm clay glow background */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-[#E8DCC6]/60 via-[#B7A89A]/20 to-[#722f37]/5 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-[#B7A89A]/30 via-[#E8DCC6]/40 to-[#722f37]/5 rounded-full blur-[140px] pointer-events-none" />

            {/* Executive Top Command Bar in Claymorphism */}
            <header className="w-full border-b border-[#B7A89A]/40 bg-[#E8DCC6]/90 backdrop-blur-2xl px-4 sm:px-6 py-2 flex items-center justify-between shrink-0 z-30 shadow-[0_4px_16px_rgba(114,47,55,0.06)]">
              <div className="flex items-center gap-3">
                {/* Clickable Logo: routes to Home and resets tool */}
                <div
                  onClick={() => {
                    setCurrentTab('home');
                    setActiveTool(null);
                    showToast('Welcome Home', 'Returned to your student dashboard', 'info');
                  }}
                  className="cursor-pointer transition-transform active:scale-95 group"
                  title="Return to Home Dashboard"
                >
                  <AscendantLogo size="sm" tagline="ACADEMIC COMPANION" />
                </div>
                <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-[#B7A89A]/40">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm" />
                  <span className="text-[10px] font-mono text-[#722f37] uppercase tracking-widest font-bold">
                    SEM {profile.currentSemester} ACTIVE
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="hidden md:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FAF6EE] border border-[#B7A89A]/40 text-[10px] font-mono text-[#722f37] shadow-sm">
                  <span className="text-[#B7A89A] font-bold">SCALE</span>
                  <span className="font-extrabold text-[#722f37]">{profile.gpaScale === 10 ? '10.0' : '4.0'}</span>
                </div>
                
                {/* Profile Chip */}
                <div className="clay-card !p-1 !px-2.5 !rounded-full flex items-center gap-2 border border-white/90">
                  <div className="w-5 h-5 rounded-full bg-[#722f37] flex items-center justify-center text-[10px] font-bold text-[#FAF6EE] shadow-sm">
                    {profile.name ? profile.name[0].toUpperCase() : 'S'}
                  </div>
                  <span className="text-xs font-bold text-[#722f37] max-w-[90px] truncate">{profile.name || 'Student'}</span>
                </div>

                {/* Mobile Menu Hamburger Trigger */}
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="clay-btn-latte !w-8.5 !h-8.5 !p-0 !rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                  aria-label="Open mobile menu"
                  title="Open Navigation Menu"
                >
                  <div className="w-4 h-0.5 bg-[#722f37] rounded-full" />
                  <div className="w-4 h-0.5 bg-[#722f37] rounded-full" />
                </button>
              </div>
            </header>

            <main 
              ref={mainContentRef} 
              className={`flex-1 w-full max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 ${
                currentTab === 'home'
                  ? 'pt-2 sm:pt-3 pb-20 sm:pb-22 overflow-y-auto min-h-0'
                  : 'pt-3 sm:pt-5 pb-28 sm:pb-32 overflow-y-auto min-h-0'
              }`}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${currentTab}-${activeTool || 'list'}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                >
                  {renderTabContent()}
                </motion.div>
              </AnimatePresence>

              {/* Claymorphic Student Footer (rendered on non-home tabs to keep home fitting 100% to screen) */}
              {currentTab !== 'home' && (
                <Footer
                  onNavigateTab={(tab) => {
                    setCurrentTab(tab);
                    setActiveTool(null);
                  }}
                  onShowToast={showToast}
                />
              )}
            </main>

            {/* Float Bottom Navigation */}
            <BottomNavBar
              activeTab={currentTab}
              onChangeTab={(tab) => {
                setCurrentTab(tab);
                setActiveTool(null); // Reset tool detail view on tab swap
              }}
            />

            {/* Mobile Drawer Menu Overlay */}
            <MobileMenuDrawer
              isOpen={isMobileMenuOpen}
              onClose={() => setIsMobileMenuOpen(false)}
              currentTab={currentTab}
              onChangeTab={(tab) => {
                setCurrentTab(tab);
                setActiveTool(null);
              }}
              profile={profile}
              onUpdateTheme={(theme) => updateProfile({ ...profile, theme })}
              onShowToast={showToast}
            />

            {/* Global Toast Notification System */}
            <ToastNotification toasts={toasts} onDismiss={dismissToast} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
