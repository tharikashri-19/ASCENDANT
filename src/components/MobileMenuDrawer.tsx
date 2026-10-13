import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Home,
  Sliders,
  TrendingUp,
  Sparkles,
  Settings,
  Mail,
  ShieldCheck,
  Sun,
  Palette,
  LogOut,
  UserX,
  Cloud,
  AlertTriangle,
  ChevronDown,
  GraduationCap
} from 'lucide-react';
import { TabType, UserProfile } from '../types';
import AscendantLogo from './AscendantLogo';
import { useGradence } from '../context/GradenceContext';

interface MobileMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: TabType;
  onChangeTab: (tab: TabType) => void;
  profile: UserProfile;
  onUpdateTheme: (theme: any) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
  onOpenSemesterSelect?: () => void;
}

export default function MobileMenuDrawer({
  isOpen,
  onClose,
  currentTab,
  onChangeTab,
  profile,
  onUpdateTheme,
  onShowToast,
  onOpenSemesterSelect
}: MobileMenuDrawerProps) {
  const { user, signOut, deleteAccount } = useGradence();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const navItems = [
    { id: 'home' as TabType, label: 'Student Home', icon: Home, badge: 'DASHBOARD' },
    { id: 'tools' as TabType, label: 'Academic Tools', icon: Sliders, badge: '11 TOOLS' },
    { id: 'progress' as TabType, label: 'Grade & Growth Journey', icon: TrendingUp, badge: 'CHARTS' },
    { id: 'ai' as TabType, label: 'AI Study Companion', icon: Sparkles, badge: 'AI TUTOR' },
    { id: 'settings' as TabType, label: 'Preferences & Settings', icon: Settings, badge: 'BACKUP' }
  ];

  const handleSignOut = async () => {
    try {
      onClose();
      await signOut();
      onShowToast('Signed Out', 'You have been safely signed out.', 'info');
    } catch (e: any) {
      onShowToast('Sign Out Failed', e.message || 'Could not sign out', 'error');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      await deleteAccount();
      setShowDeleteConfirm(false);
      onClose();
      onShowToast('Account Deleted', 'All cloud records and profile wiped.', 'info');
    } catch (e: any) {
      setIsDeleting(false);
      onShowToast('Deletion Failed', e.message || 'Could not delete account', 'error');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#722f37]/25 backdrop-blur-sm"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative w-full max-w-sm h-full bg-[#E8DCC6] border-l-2 border-[#B7A89A] shadow-2xl flex flex-col justify-between overflow-y-auto p-6 text-[#722f37]"
          >
            {/* Top Bar inside Drawer */}
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#B7A89A]/40">
                <div
                  onClick={() => {
                    onChangeTab('home');
                    onClose();
                  }}
                  className="cursor-pointer"
                >
                  <AscendantLogo size="sm" tagline="ACADEMIC COMPANION" />
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="clay-btn-latte !w-10 !h-10 !p-0 !rounded-2xl flex items-center justify-center cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5 text-[#722f37]" />
                </button>
              </div>

              {/* Scholar Profile Card */}
              <div className="clay-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-[#722f37] flex items-center justify-center font-bold text-base text-[#FAF6EE] shadow-md">
                      {profile.name ? profile.name[0].toUpperCase() : 'S'}
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-[#722f37] truncate max-w-[140px]">
                        {profile.name || 'Student'}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenSemesterSelect?.();
                          }}
                          className="px-2 py-0.5 rounded-md bg-[#722f37] text-[#FAF6EE] text-[10px] font-bold flex items-center gap-1 hover:bg-[#853740] cursor-pointer"
                          title="Change Active Semester"
                        >
                          <GraduationCap className="w-3 h-3" />
                          <span>Sem {profile.currentSemester}</span>
                          <ChevronDown className="w-2.5 h-2.5 opacity-80" />
                        </button>
                        <span className="text-[10px] font-semibold text-[#722f37]/70">
                          {profile.gpaScale === 10 ? '10-Pt Scale' : '4.0 Scale'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className={`clay-badge text-[9px] px-2.5 py-1 ${user ? 'text-emerald-100 bg-emerald-800' : 'text-[#FAF6EE]'}`}>
                    {user ? 'ACTIVE' : 'STUDENT'}
                  </span>
                </div>
                {user?.email && (
                  <div className="pt-2 border-t border-[#B7A89A]/30 flex items-center gap-1.5 text-[11px] font-mono text-[#722f37]/80 truncate">
                    <Cloud className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                )}
              </div>

              {/* Primary Navigation Links */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-[#B7A89A] uppercase tracking-wider px-1">
                  MAIN NAVIGATION
                </div>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onChangeTab(item.id);
                        onClose();
                      }}
                      className={`w-full p-3.5 rounded-2xl text-left flex items-center justify-between transition-all cursor-pointer ${
                        isActive
                          ? 'clay-btn-burgundy'
                          : 'clay-btn-latte'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${isActive ? 'text-[#FAF6EE]' : 'text-[#722f37]'}`} />
                        <span className={`text-xs font-bold ${isActive ? 'text-[#FAF6EE]' : 'text-[#722f37]'}`}>
                          {item.label}
                        </span>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-[#FAF6EE] text-[#722f37]' : 'bg-[#FAF6EE] text-[#722f37]/80 border border-[#B7A89A]/30'
                      }`}>
                        {item.badge}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Account Actions Section */}
              <div className="space-y-2 pt-1">
                <div className="text-[10px] font-bold text-[#B7A89A] uppercase tracking-wider px-1">
                  ACCOUNT & SESSION
                </div>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="clay-btn-latte w-full p-3.5 flex items-center justify-between text-xs font-bold text-[#722f37] hover:bg-[#FAF6EE] cursor-pointer shadow-sm active:scale-95"
                  >
                    <div className="flex items-center gap-2.5">
                      <LogOut className="w-4 h-4 text-[#722f37]" />
                      <span>Log Out</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#722f37]/70 uppercase font-bold">Sign Out</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full p-3.5 rounded-2xl bg-red-100/90 hover:bg-red-200 border border-red-300 text-red-700 flex items-center justify-between text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    <div className="flex items-center gap-2.5">
                      <UserX className="w-4 h-4 text-red-700" />
                      <span>Delete Account</span>
                    </div>
                    <span className="text-[9px] font-mono uppercase font-bold text-red-600">Danger</span>
                  </button>
                </div>
              </div>

              {/* Quick Theme Switcher */}
              <div className="space-y-2 pt-1">
                <div className="text-[10px] font-bold text-[#B7A89A] uppercase tracking-wider px-1">
                  APPEARANCE
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateTheme('se-light');
                      onShowToast('Clay Theme Active', 'Mocha Cream & Deep Burgundy light theme active', 'success');
                    }}
                    className={`p-2.5 rounded-2xl text-center flex flex-col items-center gap-1 transition-all text-xs font-bold cursor-pointer ${
                      profile.theme === 'se-light' || !profile.theme
                        ? 'clay-btn-burgundy'
                        : 'clay-btn-latte'
                    }`}
                  >
                    <Palette className="w-4 h-4" />
                    <span>Clay Light</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onUpdateTheme('light');
                      onShowToast('Theme Updated', 'Warm Ivory Light applied', 'success');
                    }}
                    className={`p-2.5 rounded-2xl text-center flex flex-col items-center gap-1 transition-all text-xs font-bold cursor-pointer ${
                      profile.theme === 'light'
                        ? 'clay-btn-burgundy'
                        : 'clay-btn-latte'
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                    <span>Ivory Light</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Contact Section */}
            <div className="space-y-3 pt-6 mt-6 border-t border-[#B7A89A]/40">
              <div className="text-[10px] font-bold text-[#B7A89A] uppercase tracking-wider px-1">
                SUPPORT & CONTACT
              </div>

              {/* Clickable Email */}
              <a
                href="mailto:tharikashri19@gmail.com?subject=ASCENDANT%20Student%20Support"
                onClick={() => onShowToast('Email Link Clicked', 'Drafting email to tharikashri19@gmail.com', 'info')}
                className="clay-btn-latte w-full p-3 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[#722f37]" />
                  <span className="font-semibold truncate max-w-[170px]">tharikashri19@gmail.com</span>
                </div>
                <span className="text-[10px] font-bold text-[#722f37]/70">EMAIL</span>
              </a>

              {/* Security & Workspace Status */}
              <div className="clay-card !bg-[#FAF6EE] p-3 flex items-center justify-between text-[10px] font-bold text-emerald-800 border border-emerald-300">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>STUDENT WORKSPACE ACTIVE</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>

            {/* In-Drawer Delete Confirmation Modal */}
            {showDeleteConfirm && (
              <div className="fixed inset-0 z-50 bg-[#722f37]/50 backdrop-blur-sm flex items-center justify-center p-4">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="clay-card !bg-[#FAF6EE] max-w-xs w-full p-6 space-y-4 shadow-2xl border-2 border-red-300 text-center"
                >
                  <AlertTriangle className="w-10 h-10 text-red-600 mx-auto" />
                  <div className="space-y-1">
                    <h3 className="text-sm font-extrabold text-[#722f37]">
                      Delete Cloud Account?
                    </h3>
                    <p className="text-[11px] text-[#722f37]/80 leading-relaxed">
                      This will permanently wipe all your synced study records, GPA calculations, and profile from Supabase cloud database.
                    </p>
                  </div>
                  <div className="space-y-2 pt-2">
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={handleDeleteAccount}
                      className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-md"
                    >
                      {isDeleting ? 'Deleting...' : 'Yes, Delete My Account'}
                    </button>
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => setShowDeleteConfirm(false)}
                      className="clay-btn-latte w-full py-2.5 text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
