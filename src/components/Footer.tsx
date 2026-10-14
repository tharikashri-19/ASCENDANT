import React from 'react';
import { Mail, Shield, ArrowUp, Sparkles, Heart } from 'lucide-react';
import AscendantLogo from './AscendantLogo';
import { TabType } from '../types';

interface FooterProps {
  onNavigateTab: (tab: TabType) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export default function Footer({ onNavigateTab, onShowToast }: FooterProps) {
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const scrollContainer = document.querySelector('main');
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="w-full mt-16 pt-10 pb-28 border-t-2 border-[#722f37]/50 bg-[#25090C]/90 backdrop-blur-xl text-[#FAF6EE] px-4 sm:px-8 space-y-10 rounded-t-[36px]">
      {/* Top Banner Row */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-[#722f37]/40">
        <div className="space-y-2">
          {/* Clickable Logo returning to home */}
          <div
            onClick={() => {
              onNavigateTab('home');
              scrollToTop();
            }}
            className="cursor-pointer inline-block group"
            title="Return to Student Home"
          >
            <AscendantLogo size="md" tagline="YOUR EVERYDAY ACADEMIC COMPANION" light={true} />
          </div>
          <p className="text-xs text-[#E8DCC6]/85 max-w-md leading-relaxed font-medium">
            Designed for college students who want a simple, stress-free way to calculate CGPA, monitor safe attendance skips, and organize upcoming exam schedules.
          </p>
        </div>

        {/* Scroll To Top Button with Ascending Arrow */}
        <button
          type="button"
          onClick={scrollToTop}
          className="clay-btn-latte group flex items-center gap-2 px-5 py-3 text-xs font-bold text-[#541B22] cursor-pointer"
        >
          <span>BACK TO TOP</span>
          <div className="w-6 h-6 rounded-full bg-[#722f37] flex items-center justify-center text-[#FAF6EE] group-hover:-translate-y-0.5 transition-transform shadow-sm">
            <ArrowUp className="w-3.5 h-3.5" />
          </div>
        </button>
      </div>

      {/* Grid of Navigation and Contact Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        {/* Academic Tools */}
        <div className="space-y-3">
          <div className="text-[10px] font-bold text-[#FAF6EE] uppercase tracking-wider font-mono">
            CORE STUDENT TOOLS
          </div>
          <ul className="space-y-2 text-xs font-bold text-[#E8DCC6]/80">
            <li>
              <button
                type="button"
                onClick={() => onNavigateTab('home')}
                className="hover:text-[#FAF6EE] transition-colors cursor-pointer text-left"
              >
                Student Home Dashboard
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigateTab('tools')}
                className="hover:text-[#FAF6EE] transition-colors cursor-pointer text-left"
              >
                CGPA & Attendance Tools
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigateTab('progress')}
                className="hover:text-[#FAF6EE] transition-colors cursor-pointer text-left"
              >
                Grade Growth Charts
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigateTab('ai')}
                className="hover:text-[#FAF6EE] transition-colors cursor-pointer text-left"
              >
                AI Study Companion
              </button>
            </li>
          </ul>
        </div>

        {/* Preferences & Help */}
        <div className="space-y-3">
          <div className="text-[10px] font-bold text-[#FAF6EE] uppercase tracking-wider font-mono">
            STUDENT ACCOUNT
          </div>
          <ul className="space-y-2 text-xs font-bold text-[#E8DCC6]/80">
            <li>
              <button
                type="button"
                onClick={() => onNavigateTab('settings')}
                className="hover:text-[#FAF6EE] transition-colors cursor-pointer text-left"
              >
                Student Profile Settings
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigateTab('settings')}
                className="hover:text-[#FAF6EE] transition-colors cursor-pointer text-left"
              >
                Backup & Restore Records
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigateTab('settings')}
                className="hover:text-[#FAF6EE] transition-colors cursor-pointer text-left"
              >
                Grading Scales (10 vs 4.0)
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigateTab('settings')}
                className="hover:text-[#FAF6EE] transition-colors cursor-pointer text-left"
              >
                Privacy & Security Guide
              </button>
            </li>
          </ul>
        </div>

        {/* Contact Comms (Clickable Email) */}
        <div className="space-y-3 sm:col-span-2">
          <div className="text-[10px] font-bold text-[#FAF6EE] uppercase tracking-wider font-mono">
            STUDENT SUPPORT & QUESTIONS
          </div>
          <p className="text-xs text-[#E8DCC6]/85 leading-relaxed font-medium">
            Have an idea for a feature or need assistance with your study records? Reach out directly.
          </p>

          <div className="flex flex-col gap-2.5 pt-1">
            {/* Clickable Email */}
            <a
              href="mailto:tharikashri19@gmail.com?subject=ASCENDANT%20Student%20Support"
              onClick={() => onShowToast('Email App Opened', 'Contacting tharikashri19@gmail.com', 'info')}
              className="p-2.5 px-3.5 rounded-2xl bg-[#3D1318] border border-[#722f37]/60 hover:bg-[#4A171E] flex items-center gap-3 text-xs font-bold text-[#FAF6EE] transition-colors"
            >
              <div className="w-7 h-7 rounded-xl bg-[#722f37] flex items-center justify-center text-[#FAF6EE] shadow-sm">
                <Mail className="w-3.5 h-3.5" />
              </div>
              <span className="font-mono text-xs">tharikashri19@gmail.com</span>
            </a>
          </div>
        </div>
      </div>

      {/* Copyright & Architecture Credential */}
      <div className="pt-8 border-t border-[#722f37]/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-[#E8DCC6]/70">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>© {currentYear} ASCENDANT • YOUR EVERYDAY ACADEMIC COMPANION</span>
        </div>

        <div className="clay-badge text-[11px] px-3.5 py-1 text-[#FAF6EE] flex items-center gap-1.5 font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>STUDENT FIRST</span>
        </div>
      </div>
    </footer>
  );
}
