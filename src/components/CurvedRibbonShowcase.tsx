import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Calculator,
  CheckSquare,
  PieChart,
  Calendar,
  Clock,
  FileText,
  Code,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ToolType } from '../types';

interface CurvedRibbonShowcaseProps {
  onSelectTool: (tool: ToolType) => void;
}

interface RibbonCard {
  id: ToolType;
  title: string;
  category: string;
  metric: string;
  icon: React.ComponentType<{ className?: string }>;
}

export default function CurvedRibbonShowcase({ onSelectTool }: CurvedRibbonShowcaseProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );
  const touchStartX = useRef<number | null>(null);

  const cards: RibbonCard[] = [
    {
      id: 'cgpa',
      title: 'CGPA & SGPA Calculator',
      category: 'GRADES',
      metric: 'Calculate semester grades and cumulative GPA on 4.0 or 10.0 scale with real-time target projection.',
      icon: Calculator
    },
    {
      id: 'attendance',
      title: 'Attendance & Safe Skips',
      category: 'ATTENDANCE',
      metric: 'Calculate exactly how many lectures you can safely miss above 75% without attendance detention.',
      icon: CheckSquare
    },
    {
      id: 'gpa',
      title: 'Target GPA Planner',
      category: 'GOALS',
      metric: 'Determine required grades in future semesters to reach your target honors or graduation GPA.',
      icon: PieChart
    },
    {
      id: 'exam',
      title: 'Exam Countdown',
      category: 'SCHEDULE',
      metric: 'Track upcoming semester examinations, preparation priorities, and remaining study days.',
      icon: Calendar
    },
    {
      id: 'planner',
      title: 'Daily Study Routine',
      category: 'HABITS',
      metric: 'Check off daily revision goals, productive study habits, and personalized timetable blocks.',
      icon: Clock
    },
    {
      id: 'resume',
      title: 'Resume Builder',
      category: 'CAREER',
      metric: 'Format and export a clean, ATS-ready engineering resume optimized for internships and placements.',
      icon: FileText
    },
    {
      id: 'coding',
      title: 'Coding Practice Tracker',
      category: 'SKILLS',
      metric: 'Monitor problem-solving streaks and contest ratings across LeetCode, GitHub, and competitive hubs.',
      icon: Code
    }
  ];

  // Track viewport width for responsive 3D transforms
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalCards = cards.length;

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + totalCards) % totalCards);
  }, [totalCards]);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % totalCards);
  }, [totalCards]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handlePrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleNext();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      onSelectTool(cards[activeIndex].id);
    }
  };

  // Touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (diff > 40) {
      handlePrev();
    } else if (diff < -40) {
      handleNext();
    }
    touchStartX.current = null;
  };

  // Calculate refined 3D styling parameters for card at index `idx`
  const getCardTransform = (idx: number) => {
    let diff = ((idx - activeIndex) % totalCards + totalCards) % totalCards;
    if (diff > totalCards / 2) {
      diff -= totalCards;
    }

    const isMobile = windowWidth < 640;
    const isTablet = windowWidth >= 640 && windowWidth < 1024;

    // Slot parameters based on offset `diff` (-3 to +3)
    if (diff === 0) {
      // Active center card: upright, prominent, sharp contrast
      return {
        x: 0,
        z: isMobile ? 15 : 35,
        rotateY: 0,
        scale: 1,
        opacity: 1,
        zIndex: 35,
        pointerEvents: 'auto' as const,
        isCenter: true,
      };
    }

    const sign = diff > 0 ? 1 : -1;
    const absDiff = Math.abs(diff);

    if (absDiff === 1) {
      // Immediate adjacent cards: high visibility & contrast, gentle 14-18° rotation
      const stepX = isMobile ? 140 : isTablet ? 195 : 255;
      const angle = isMobile ? 10 : isTablet ? 14 : 16;
      return {
        x: sign * stepX,
        z: isMobile ? -20 : -35,
        rotateY: -sign * angle,
        scale: isMobile ? 0.86 : 0.90,
        opacity: isMobile ? 0.75 : 0.94,
        zIndex: 25,
        pointerEvents: 'auto' as const,
        isCenter: false,
      };
    }

    if (absDiff === 2) {
      // Secondary wings: clearly legible titles & icons, subtle depth scale
      const stepX = isMobile ? 245 : isTablet ? 345 : 465;
      const angle = isMobile ? 16 : isTablet ? 22 : 26;
      return {
        x: sign * stepX,
        z: isMobile ? -50 : -85,
        rotateY: -sign * angle,
        scale: isMobile ? 0.74 : 0.79,
        opacity: isMobile ? 0 : 0.78,
        zIndex: 15,
        pointerEvents: isMobile ? ('none' as const) : ('auto' as const),
        isCenter: false,
      };
    }

    // Outer buffer slots (diff === 3 or -3): smoothly tucked offscreen
    const outerX = isMobile ? 320 : isTablet ? 470 : 640;
    return {
      x: sign * outerX,
      z: -160,
      rotateY: -sign * 36,
      scale: 0.68,
      opacity: 0,
      zIndex: 5,
      pointerEvents: 'none' as const,
      isCenter: false,
    };
  };

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-full rounded-[26px] sm:rounded-[32px] bg-[#FAF6EE] border-2 border-white/85 shadow-[0_6px_24px_rgba(114,47,55,0.05),inset_0_2px_4px_rgba(255,255,255,0.9)] overflow-hidden select-none outline-none focus:ring-2 focus:ring-[#722f37]/20 transition-all p-3 sm:p-4 md:p-5"
      style={{
        backgroundImage: 'radial-gradient(rgba(183, 168, 154, 0.18) 1px, transparent 1px)',
        backgroundSize: '22px 22px',
        backgroundPosition: 'center center'
      }}
      aria-label="Student Tools 3D Perspective Gallery"
    >
      {/* ── Top Header: Refined Title, Compact Proportions ─────────────────── */}
      <div className="flex flex-col items-center text-center space-y-1 mb-1 sm:mb-2 px-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E8DCC6]/75 border border-white/90 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#722f37] animate-pulse" />
          <span className="text-[9.5px] sm:text-[10px] font-sans uppercase tracking-widest text-[#722f37] font-extrabold">
            Interactive Academic Suite
          </span>
          <span className="text-[9.5px] text-[#7A6B5E] font-bold">• 7 Utilities</span>
        </div>

        <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold text-[#4A2026] tracking-tight leading-snug">
          Student Tools at a Glance
        </h2>

        <p className="text-[11.5px] sm:text-xs text-[#7A6B5E] max-w-lg font-medium leading-normal hidden sm:block">
          Curved perspective access to grades, attendance safe margins, goals, and daily academic mastery.
        </p>
      </div>

      {/* ── Gallery Stage with Smooth Symmetrical 3D Arc ───────────────────── */}
      <div
        className="relative w-full h-[215px] sm:h-[228px] md:h-[240px] flex items-center justify-center overflow-hidden"
        style={{
          perspective: '1100px',
          transformStyle: 'preserve-3d'
        }}
      >
        {/* Soft Edge-Feathering Masks to Blend Wings Gracefully */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 sm:w-16 md:w-20 bg-gradient-to-r from-[#FAF6EE] to-transparent z-30" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 sm:w-16 md:w-20 bg-gradient-to-l from-[#FAF6EE] to-transparent z-30" />

        {/* Previous Button (Left) */}
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous academic tool"
          title="Previous tool"
          className="absolute left-1.5 sm:left-3.5 z-40 w-8.5 h-8.5 sm:w-9.5 sm:h-9.5 rounded-full bg-[#FAF6EE]/95 hover:bg-white border border-[#E8DCC6] shadow-[2px_2px_8px_rgba(114,47,55,0.08),-1px_-1px_4px_rgba(255,255,255,0.95)] flex items-center justify-center text-[#722f37] hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <ChevronLeft className="w-4.5 h-4.5 stroke-[2.5]" />
        </button>

        {/* Next Button (Right) */}
        <button
          type="button"
          onClick={handleNext}
          aria-label="Next academic tool"
          title="Next tool"
          className="absolute right-1.5 sm:right-3.5 z-40 w-8.5 h-8.5 sm:w-9.5 sm:h-9.5 rounded-full bg-[#FAF6EE]/95 hover:bg-white border border-[#E8DCC6] shadow-[2px_2px_8px_rgba(114,47,55,0.08),-1px_-1px_4px_rgba(255,255,255,0.95)] flex items-center justify-center text-[#722f37] hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <ChevronRight className="w-4.5 h-4.5 stroke-[2.5]" />
        </button>

        {/* 7 Academic Tool Cards positioned along balanced 3D curve */}
        {cards.map((card, idx) => {
          const Icon = card.icon;
          const { x, z, rotateY, scale, opacity, zIndex, pointerEvents, isCenter } =
            getCardTransform(idx);

          return (
            <div
              key={card.id}
              onClick={() => {
                if (isCenter) {
                  onSelectTool(card.id);
                } else {
                  setActiveIndex(idx);
                }
              }}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%) translateX(${x}px) translateZ(${z}px) rotateY(${rotateY}deg) scale(${scale})`,
                opacity,
                zIndex,
                pointerEvents,
                transformStyle: 'preserve-3d',
                transition:
                  'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.45s ease, filter 0.45s ease, box-shadow 0.45s ease'
              }}
              className={`shrink-0 w-[275px] sm:w-[305px] md:w-[325px] h-[168px] sm:h-[180px] md:h-[188px] rounded-[22px] p-3.5 sm:p-4 flex flex-col justify-between cursor-pointer transition-all duration-300 relative select-none ${
                isCenter
                  ? 'bg-gradient-to-br from-[#FFFDF9] via-[#F8F2E7] to-[#EBE0CD] border-2 border-[#722f37]/50 shadow-[0_12px_28px_rgba(114,47,55,0.11),0_2px_6px_rgba(114,47,55,0.04),inset_0_1px_3px_rgba(255,255,255,0.95)]'
                  : 'bg-gradient-to-br from-[#FCF9F3] via-[#F5EFE3] to-[#E9DCBE] border-2 border-white/90 shadow-[0_6px_18px_rgba(114,47,55,0.06),-2px_-2px_6px_rgba(255,255,255,0.9)] hover:brightness-105'
              }`}
            >
              {/* Card Top Row: Icon, Category Pill, Index */}
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                      isCenter
                        ? 'bg-gradient-to-br from-[#722f37] to-[#552026] text-[#FAF6EE] shadow-sm'
                        : 'bg-gradient-to-br from-[#EFE5D2] to-[#DECFA8] text-[#722f37] border border-white/90 shadow-xs'
                    }`}
                  >
                    <Icon className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <span
                    className={`text-[9.5px] sm:text-[10px] font-sans tracking-wider uppercase font-extrabold px-2.5 py-0.5 rounded-full border shadow-xs transition-colors ${
                      isCenter
                        ? 'bg-[#722f37]/10 text-[#722f37] border-[#722f37]/25'
                        : 'bg-[#E8DCC6] text-[#722f37] border-white/80'
                    }`}
                  >
                    {card.category}
                  </span>
                </div>

                <span
                  className={`text-xs font-mono font-bold ${
                    isCenter ? 'text-[#722f37]' : 'text-[#7A6B5E]'
                  }`}
                >
                  0{idx + 1}
                </span>
              </div>

              {/* Card Middle: Title & Metric Description (Crisp Contrast) */}
              <div className="space-y-0.5 relative z-10 my-0.5">
                <h3
                  className={`font-extrabold transition-colors leading-snug line-clamp-1 ${
                    isCenter
                      ? 'text-[13.5px] sm:text-[14.5px] text-[#722f37]'
                      : 'text-xs sm:text-[13.5px] text-[#5A232A]'
                  }`}
                >
                  {card.title}
                </h3>
                <p
                  className={`text-[11px] sm:text-[11.5px] leading-relaxed line-clamp-2 ${
                    isCenter ? 'text-[#7A6B5E]' : 'text-[#6A5A4D]'
                  }`}
                >
                  {card.metric}
                </p>
              </div>

              {/* Card Bottom Row: Action or Focus Trigger */}
              <div className="pt-1.5 border-t border-[#B7A89A]/25 relative z-10">
                {isCenter ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTool(card.id);
                    }}
                    className="w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-[#722f37] to-[#5E242B] hover:from-[#5E242B] hover:to-[#4A1C22] text-[#FAF6EE] text-[11.5px] sm:text-xs font-bold flex items-center justify-between shadow-sm active:scale-98 transition-all cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#F3EBDD]" />
                      <span>Launch Tool</span>
                    </span>
                    <div className="w-4.5 h-4.5 rounded-full bg-white/20 flex items-center justify-center">
                      <ArrowRight className="w-3 h-3 text-white stroke-[2.5]" />
                    </div>
                  </button>
                ) : (
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#722f37] group-hover:text-[#5A232A] transition-colors py-0.5">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-[#722f37]/70" />
                      <span>Click to Focus</span>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#722f37]/70" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Bottom Controls: Perfectly Aligned 3-Column Footer ─────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2 pt-2 px-1 sm:px-2 border-t border-[#E8DCC6]/70">
        {/* Left: Active Tool Counter & Name */}
        <div className="flex items-center justify-center sm:justify-start gap-2">
          <span className="text-[11px] sm:text-xs font-mono font-bold text-[#722f37] bg-[#E8DCC6]/75 border border-white/90 px-2.5 py-0.5 rounded-full shadow-xs shrink-0">
            {activeIndex + 1} of {totalCards}
          </span>
          <span className="text-xs text-[#7A6B5E] font-medium truncate max-w-[170px] lg:max-w-[210px] hidden md:inline">
            Active: <strong className="text-[#722f37]">{cards[activeIndex].title}</strong>
          </span>
        </div>

        {/* Center: Pagination Indicators */}
        <div className="flex items-center justify-center gap-1.5" role="tablist" aria-label="Tool indicators">
          {cards.map((c, i) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={i === activeIndex}
              aria-label={`Jump to tool ${i + 1}: ${c.title}`}
              onClick={() => setActiveIndex(i)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                i === activeIndex
                  ? 'w-6 bg-[#722f37] shadow-xs'
                  : 'w-2 bg-[#D1C2AF] hover:bg-[#722f37]/50'
              }`}
            />
          ))}
        </div>

        {/* Right: Keyboard / Swipe Instructions */}
        <div className="flex items-center justify-center sm:justify-end text-[11px] text-[#8C7D70] font-sans font-medium">
          <span>Use <kbd className="px-1.5 py-0.5 rounded bg-[#E8DCC6] text-[#722f37] font-mono text-[10px] font-bold">←</kbd> <kbd className="px-1.5 py-0.5 rounded bg-[#E8DCC6] text-[#722f37] font-mono text-[10px] font-bold">→</kbd> or swipe</span>
        </div>
      </div>
    </div>
  );
}
