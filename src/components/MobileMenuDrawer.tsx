import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Home,
  Sliders,
  TrendingUp,
  Sparkles,
  Settings,
  Mail,
  Phone,
  ShieldCheck,
  Sun,
  Palette
} from 'lucide-react';
import { TabType, UserProfile } from '../types';
import AscendantLogo from './AscendantLogo';

interface MobileMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: TabType;
  onChangeTab: (tab: TabType) => void;
  profile: UserProfile;
  onUpdateTheme: (theme: any) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export default function MobileMenuDrawer({
  isOpen,
  onClose,
  currentTab,
  onChangeTab,
  profile,
  onUpdateTheme,
  onShowToast
}: MobileMenuDrawerProps) {
  const navItems = [
    { id: 'home' as TabType, label: 'Student Home', icon: Home, badge: 'DASHBOARD' },
    { id: 'tools' as TabType, label: 'Academic Tools', icon: Sliders, badge: '11 TOOLS' },
    { id: 'progress' as TabType, label: 'Grade & Growth Journey', icon: TrendingUp, badge: 'CHARTS' },
    { id: 'ai' as TabType, label: 'AI Study Companion', icon: Sparkles, badge: 'AI TUTOR' },
    { id: 'settings' as TabType, label: 'Preferences & Settings', icon: Settings, badge: 'BACKUP' }
  ];

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
              <div className="clay-card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#722f37] flex items-center justify-center font-bold text-base text-[#FAF6EE] shadow-md">
                    {profile.name ? profile.name[0].toUpperCase() : 'S'}
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-[#722f37] truncate max-w-[140px]">
                      {profile.name || 'Student'}
                    </h4>
                    <p className="text-[11px] font-semibold text-[#722f37]/80">
                      Semester {profile.currentSemester} • {profile.gpaScale === 10 ? '10-Point Scale' : '4.0 GPA Scale'}
                    </p>
                  </div>
                </div>
                <span className="clay-badge text-[9px] px-2.5 py-1 text-[#FAF6EE]">
                  ACTIVE
                </span>
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

            {/* Bottom Contact & Verification Section */}
            <div className="space-y-3 pt-6 mt-6 border-t border-[#B7A89A]/40">
              <div className="text-[10px] font-bold text-[#B7A89A] uppercase tracking-wider px-1">
                SUPPORT & CONTACT
              </div>

              {/* Clickable Phone Number */}
              <a
                href="tel:+18002723632"
                onClick={() => onShowToast('Phone Link Clicked', 'Calling support: +1 (800) 272-3632', 'info')}
                className="clay-btn-latte w-full p-3 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-[#722f37]" />
                  <span className="font-semibold">+1 (800) 272-3632</span>
                </div>
                <span className="text-[10px] font-bold text-[#722f37]/70">CALL</span>
              </a>

              {/* Clickable Email */}
              <a
                href="mailto:alex.ascendant.os@gmail.com?subject=Gradence%20Student%20Support"
                onClick={() => onShowToast('Email Link Clicked', 'Drafting email to alex.ascendant.os@gmail.com', 'info')}
                className="clay-btn-latte w-full p-3 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[#722f37]" />
                  <span className="font-semibold truncate max-w-[170px]">alex.ascendant.os@gmail.com</span>
                </div>
                <span className="text-[10px] font-bold text-[#722f37]/70">EMAIL</span>
              </a>

              {/* Security Status */}
              <div className="clay-card !bg-[#FAF6EE] p-3 flex items-center gap-2 text-[10px] font-bold text-emerald-800 border border-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>100% PRIVATE • STORED ON YOUR OWN DEVICE</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
