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
import {
  MoreVertical,
  LogOut,
  UserX,
  Settings,
  Cloud,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  GraduationCap
} from 'lucide-react';

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
import ResumeBuilder from './components/ResumeBuilder';
import AcademicCalendarScreen from './components/AcademicCalendarScreen';
import AscendantLogo from './components/AscendantLogo';
import MobileMenuDrawer from './components/MobileMenuDrawer';
import ToastNotification, { ToastMessage, ToastType } from './components/ToastNotification';
import Footer from './components/Footer';
import NotFoundScreen from './components/NotFoundScreen';
import { AuthModal } from './components/AuthModal';
import LoginScreen from './components/LoginScreen';
import SemesterSwitcherModal from './components/SemesterSwitcherModal';
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
    user,
    isSupabaseConfigured,
    updateProfile,
    saveSemester,
    saveSemesters,
    saveAttendance,
    saveExams,
    resetData,
    importData,
    exportData,
    signOut,
    deleteAccount
  } = useGradence();

  const [showSplash, setShowSplash] = useState(true);
  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [activeTool, setActiveTool] = useState<ToolType | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isSemesterModalOpen, setIsSemesterModalOpen] = useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
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
            onOpenSemesterSelect={() => setIsSemesterModalOpen(true)}
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
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
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
      <div className="min-h-screen bg-gradient-to-br from-[#330f14] via-[#4a171e] to-[#25090c] text-[#FAF6EE] flex flex-col items-center justify-center gap-4 relative">
        <div className="w-12 h-12 border-3 border-t-[#FAF6EE] border-[#722f37]/40 rounded-full animate-spin shadow-md" />
        <span className="text-xs font-mono text-[#E8DCC6] uppercase tracking-widest font-bold">
          Opening ASCENDANT...
        </span>
        <div className="clay-badge text-[10px] px-3.5 py-1 text-[#FAF6EE] bg-[#25090C] border border-[#722f37]/50">
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

        {/* Professional Split-Theme Login Screen */}
        {!showSplash && !isInitialized && (
          <div key="login-portal" className="w-full h-full overflow-y-auto">
            <LoginScreen
              onContinueAsGuest={() => {
                handleOnboardingComplete({
                  name: 'Student Scholar',
                  university: 'College Workspace',
                  currentSemester: 1,
                  theme: 'se-light',
                  gpaScale: 10
                });
              }}
              onRegistrationComplete={(newProfile, initialSemesters) => {
                handleOnboardingComplete(newProfile, initialSemesters);
              }}
            />
          </div>
        )}

        {/* Primary Dashboard Container */}
        {!showSplash && isInitialized && profile && (
          <motion.div
            key="main-app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-full flex flex-col overflow-hidden relative min-h-0 bg-gradient-to-br from-[#330f14] via-[#4a171e] to-[#25090c] text-[#FAF6EE]"
          >
            {/* Ambient warm wine bokeh blur orbs */}
            <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-[#722f37]/25 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-10 right-10 w-[500px] h-[500px] rounded-full bg-[#8c3a45]/20 blur-[140px] pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-black/40 blur-[100px] pointer-events-none" />

            {/* Executive Top Command Bar in Frosted Deep Wine */}
            <header className="w-full border-b border-[#722f37]/40 bg-[#330f14]/85 backdrop-blur-2xl px-4 sm:px-6 py-2 flex items-center justify-between shrink-0 z-30 shadow-[0_4px_20px_rgba(0,0,0,0.35)]">
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
                  <AscendantLogo size="sm" tagline="ACADEMIC COMPANION" light={true} />
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                {/* Sync Icon Button */}
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="w-8.5 h-8.5 rounded-xl bg-[#4A171E] border border-[#722f37]/60 flex items-center justify-center cursor-pointer shadow-sm active:scale-95 text-[#FAF6EE] hover:bg-[#722f37] transition-colors"
                  title={user ? `Account Synced (${user.email})` : "Sync Database"}
                  aria-label="Database Sync"
                >
                  <RefreshCw className={`w-4 h-4 text-[#FAF6EE] ${isStorageLoading ? 'animate-spin' : ''}`} />
                </button>

                {/* Avatar with Account Dropdown Menu */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsAccountMenuOpen(prev => !prev)}
                    className="w-8.5 h-8.5 rounded-full bg-gradient-to-br from-[#853740] to-[#722f37] text-[#FAF6EE] flex items-center justify-center text-xs font-black shadow-sm cursor-pointer hover:scale-105 active:scale-95 transition-all border border-white/20"
                    title={`Account: ${profile.name || 'Student'}`}
                    aria-label="Account Options"
                  >
                    {profile.name ? profile.name[0].toUpperCase() : 'S'}
                  </button>

                  {/* Account Dropdown Menu */}
                  <AnimatePresence>
                    {isAccountMenuOpen && (
                      <>
                        {/* Invisible backdrop to dismiss dropdown */}
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setIsAccountMenuOpen(false)}
                        />

                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -4 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-11 z-50 w-64 rounded-2xl bg-[#2B0C10] border-2 border-[#722f37] shadow-2xl p-3 text-[#FAF6EE] space-y-2"
                        >
                          {/* User Brief */}
                          <div className="p-2.5 rounded-xl bg-[#3D1318] border border-[#722f37]/50 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-extrabold text-[#FAF6EE] truncate max-w-[130px]">
                                {profile.name || 'Scholar'}
                              </span>
                              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${user ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30' : 'bg-amber-950/80 text-amber-300 border border-amber-500/30'}`}>
                                {user ? 'ACTIVE' : 'STUDENT'}
                              </span>
                            </div>
                            <p className="text-[10px] font-mono text-[#E8DCC6]/80 truncate">
                              {user?.email || 'Local Scholar'}
                            </p>
                          </div>

                          {/* Quick Links */}
                          <div className="space-y-1 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setIsAccountMenuOpen(false);
                                setIsSemesterModalOpen(true);
                              }}
                              className="w-full p-2 rounded-xl hover:bg-[#4A171E] text-left text-xs font-bold text-[#FAF6EE] flex items-center justify-between transition-colors cursor-pointer group"
                            >
                              <div className="flex items-center gap-2.5">
                                <GraduationCap className="w-4 h-4 text-[#FAF6EE]" />
                                <span>Active Semester</span>
                              </div>
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#722f37] text-[#FAF6EE] border border-white/20 group-hover:border-white/50">
                                SEM {profile.currentSemester}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setIsAccountMenuOpen(false);
                                setCurrentTab('settings');
                                setActiveTool(null);
                              }}
                              className="w-full p-2 rounded-xl hover:bg-[#4A171E] text-left text-xs font-bold text-[#FAF6EE] flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              <Settings className="w-4 h-4 text-[#FAF6EE]" />
                              <span>Preferences & Settings</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setIsAccountMenuOpen(false);
                                setIsAuthModalOpen(true);
                              }}
                              className="w-full p-2 rounded-xl hover:bg-[#4A171E] text-left text-xs font-bold text-[#FAF6EE] flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              <Cloud className="w-4 h-4 text-emerald-400" />
                              <span>Database Sync</span>
                            </button>

                            <div className="border-t border-[#722f37]/50 my-1" />

                            {/* LOG OUT BUTTON */}
                            <button
                              type="button"
                              onClick={async () => {
                                setIsAccountMenuOpen(false);
                                await signOut();
                                showToast('Logged Out', 'You have been safely signed out.', 'info');
                              }}
                              className="w-full p-2 rounded-xl hover:bg-[#4A171E] text-left text-xs font-bold text-[#FAF6EE] flex items-center justify-between transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5">
                                <LogOut className="w-4 h-4 text-[#FAF6EE]" />
                                <span>Log Out</span>
                              </div>
                              <span className="text-[9px] font-mono font-bold text-[#E8DCC6]/70">EXIT</span>
                            </button>

                            {/* DELETE ACCOUNT BUTTON */}
                            <button
                              type="button"
                              onClick={() => {
                                setIsAccountMenuOpen(false);
                                setIsDeleteAccountModalOpen(true);
                              }}
                              className="w-full p-2 rounded-xl bg-red-950/60 hover:bg-red-900/60 text-left text-xs font-bold text-red-300 flex items-center justify-between transition-colors cursor-pointer border border-red-500/30"
                            >
                              <div className="flex items-center gap-2.5">
                                <UserX className="w-4 h-4 text-red-400" />
                                <span>Delete Account</span>
                              </div>
                              <span className="text-[9px] font-mono font-bold text-red-400">DANGER</span>
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* Mobile Menu Hamburger Trigger */}
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="w-8.5 h-8.5 rounded-xl bg-[#4A171E] border border-[#722f37]/60 flex flex-col items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95 hover:bg-[#722f37] transition-colors"
                  aria-label="Open mobile menu"
                  title="Open Navigation Menu"
                >
                  <div className="w-4 h-0.5 bg-[#FAF6EE] rounded-full" />
                  <div className="w-4 h-0.5 bg-[#FAF6EE] rounded-full" />
                </button>
              </div>
            </header>

            <main 
              ref={mainContentRef} 
              className={`flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 ${
                currentTab === 'tools'
                  ? 'max-w-6xl pt-3 sm:pt-5 pb-36 sm:pb-44 overflow-y-auto min-h-0'
                  : currentTab === 'home'
                  ? 'max-w-[1560px] pt-2 sm:pt-3 pb-20 sm:pb-22 overflow-y-auto min-h-0'
                  : 'max-w-[1560px] pt-3 sm:pt-5 pb-28 sm:pb-32 overflow-y-auto min-h-0'
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
              onOpenSemesterSelect={() => setIsSemesterModalOpen(true)}
            />

            {/* Global Toast Notification System */}
            <ToastNotification toasts={toasts} onDismiss={dismissToast} />

            {/* Active Academic Semester Switcher Modal */}
            <SemesterSwitcherModal
              isOpen={isSemesterModalOpen}
              onClose={() => setIsSemesterModalOpen(false)}
              profile={profile}
              onSelectSemester={async (semNumber) => {
                await updateProfile({
                  ...profile,
                  currentSemester: semNumber
                });
                showToast('Active Semester Updated', `Switched to Semester ${semNumber}`, 'success');
              }}
            />

            {/* Supabase Authentication & Cloud Sync Modal */}
            <AuthModal
              isOpen={isAuthModalOpen}
              onClose={() => setIsAuthModalOpen(false)}
            />

            {/* Global Delete Account Confirmation Modal */}
            <AnimatePresence>
              {isDeleteAccountModalOpen && (
                <div className="fixed inset-0 z-50 bg-[#722f37]/50 backdrop-blur-sm flex items-center justify-center p-4">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="clay-card !bg-[#FAF6EE] max-w-sm w-full p-6 sm:p-7 space-y-4 shadow-2xl border-2 border-red-300 text-center"
                  >
                    <AlertTriangle className="w-12 h-12 text-red-600 mx-auto" />
                    <div className="space-y-1.5">
                      <h3 className="text-base font-black text-[#722f37]">
                        Delete Account?
                      </h3>
                      <p className="text-xs text-[#722f37]/80 leading-relaxed">
                        This action will permanently erase your profile, SGPA history, attendance records, exam plans, and all saved academic data.
                      </p>
                      <p className="text-[11px] font-bold text-red-600 pt-1">
                        This action cannot be undone.
                      </p>
                    </div>

                    <div className="space-y-2 pt-3">
                      <button
                        type="button"
                        disabled={isDeletingAccount}
                        onClick={async () => {
                          try {
                            setIsDeletingAccount(true);
                            await deleteAccount();
                            setIsDeleteAccountModalOpen(false);
                            showToast('Account Deleted', 'All cloud records wiped successfully.', 'info');
                          } catch (e: any) {
                            setIsDeletingAccount(false);
                            showToast('Error', e.message || 'Could not delete account', 'error');
                          }
                        }}
                        className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-md"
                      >
                        {isDeletingAccount ? 'Deleting Records...' : 'Yes, Permanently Delete Account'}
                      </button>

                      <button
                        type="button"
                        disabled={isDeletingAccount}
                        onClick={() => setIsDeleteAccountModalOpen(false)}
                        className="clay-btn-latte w-full py-2.5 text-xs font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
