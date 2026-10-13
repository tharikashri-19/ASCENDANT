import React from 'react';
import { Home, Compass, BarChart2, Settings, Sparkles } from 'lucide-react';
import { TabType } from '../types';

interface BottomNavBarProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

export default function BottomNavBar({ activeTab, onChangeTab }: BottomNavBarProps) {
  const tabs = [
    { id: 'home' as TabType, label: 'Home', icon: Home },
    { id: 'tools' as TabType, label: 'Tools', icon: Compass },
    { id: 'ai' as TabType, label: 'AI Study', icon: Sparkles },
    { id: 'progress' as TabType, label: 'Progress', icon: BarChart2 },
    { id: 'settings' as TabType, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 w-full max-w-[360px] px-3 z-40 select-none pointer-events-none">
      {/* Tactile Clay Floating Dock Capsule */}
      <div className="pointer-events-auto clay-dock p-1 sm:p-1.5 flex items-center justify-between gap-1 shadow-[0_12px_28px_rgba(114,47,55,0.14)]">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`relative flex-1 py-1.5 px-2 rounded-full flex flex-col items-center justify-center gap-0.5 transition-all duration-200 cursor-pointer group active:scale-95 ${
                isActive
                  ? 'clay-btn-burgundy text-[#FAF6EE] shadow-md'
                  : 'text-[#7A6B5E] hover:text-[#722f37] hover:bg-[#E8DCC6]/50'
              }`}
            >
              <IconComponent className={`w-3.5 h-3.5 stroke-[2.2] transition-transform duration-200 ${isActive ? 'scale-110 text-[#FAF6EE]' : 'group-hover:scale-105'}`} />
              <span className={`text-[8.5px] font-sans font-extrabold tracking-wide uppercase transition-colors ${isActive ? 'text-[#FAF6EE]' : 'text-[#7A6B5E]'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
