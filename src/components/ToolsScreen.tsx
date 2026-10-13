import React, { useState, useMemo } from 'react';
import {
  Calculator,
  CheckSquare,
  PieChart,
  Calendar,
  Hash,
  Code,
  Map,
  Clock,
  FileText,
  Sparkles,
  Award,
  BookOpen,
  Briefcase,
  Search,
  X,
  Pin,
  Check
} from 'lucide-react';
import { ToolType } from '../types';
import { useGradence } from '../context/GradenceContext';

interface ToolsScreenProps {
  onSelectTool: (tool: ToolType) => void;
}

interface ToolItem {
  id: ToolType;
  title: string;
  subtitle: string;
  icon: any;
  categoryName: string;
}

export default function ToolsScreen({ onSelectTool }: ToolsScreenProps) {
  const {
    profile,
    semesters,
    attendanceSubjects,
    exams,
    activities,
    roadmaps,
    timetable,
    habits,
    codingProfiles,
    resumeDraft,
    academicEvents,
    isStorageLoading
  } = useGradence();

  // Search filter state
  const [searchQuery, setSearchQuery] = useState('');

  // Pinned tools state with localStorage persistence
  const [pinnedToolIds, setPinnedToolIds] = useState<ToolType[]>(() => {
    try {
      const saved = localStorage.getItem('ascendant_pinned_tools');
      return saved ? JSON.parse(saved) : ['attendance', 'cgpa'];
    } catch {
      return ['attendance', 'cgpa'];
    }
  });

  const togglePin = (toolId: ToolType, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinnedToolIds((prev) => {
      const updated = prev.includes(toolId)
        ? prev.filter((id) => id !== toolId)
        : [...prev, toolId];
      try {
        localStorage.setItem('ascendant_pinned_tools', JSON.stringify(updated));
      } catch (err) {
        console.warn('Could not persist pinned tools:', err);
      }
      return updated;
    });
  };

  // Categories and Tools definition
  const categories: {
    name: string;
    description: string;
    icon: any;
    tools: ToolItem[];
  }[] = [
    {
      name: 'Grades & Score Planning',
      description: 'Calculate your semester GPA, overall score, and target goals',
      icon: Award,
      tools: [
        {
          id: 'cgpa',
          title: 'CGPA & SGPA Calculator',
          subtitle: 'Calculate semester SGPA, cumulative CGPA, and view your complete grade history.',
          icon: Calculator,
          categoryName: 'Grades & Score Planning'
        },
        {
          id: 'gpa',
          title: 'Target GPA Planner',
          subtitle: 'Find out exactly what grades you need in upcoming semesters to hit your dream GPA.',
          icon: PieChart,
          categoryName: 'Grades & Score Planning'
        },
        {
          id: 'converter',
          title: 'Grade & Marks Converter',
          subtitle: 'Quickly convert between 10-point scale, 4.0 GPA, and percentage marks.',
          icon: Hash,
          categoryName: 'Grades & Score Planning'
        }
      ]
    },
    {
      name: 'Attendance & Class Schedules',
      description: 'Keep your attendance safe and organize tests and daily timetables',
      icon: BookOpen,
      tools: [
        {
          id: 'attendance',
          title: 'Attendance & Safe Skips',
          subtitle: 'Log classes and calculate exactly how many lectures you can safely skip above 75%.',
          icon: CheckSquare,
          categoryName: 'Attendance & Class Schedules'
        },
        {
          id: 'exam',
          title: 'Exam Countdown & Priorities',
          subtitle: 'Schedule upcoming midterms and finals with days-remaining countdowns.',
          icon: Calendar,
          categoryName: 'Attendance & Class Schedules'
        },
        {
          id: 'planner',
          title: 'Daily Routine & Timetable',
          subtitle: 'Keep track of your weekly class schedule, daily study checklist, and habits.',
          icon: Clock,
          categoryName: 'Attendance & Class Schedules'
        },
        {
          id: 'academic-calendar',
          title: 'College Calendar & Events',
          subtitle: 'Upload college PDF calendar to automatically extract exam and break dates.',
          icon: Calendar,
          categoryName: 'Attendance & Class Schedules'
        }
      ]
    },
    {
      name: 'Career & Professional Skills',
      description: 'Build your engineering resume and track career roadmaps',
      icon: Briefcase,
      tools: [
        {
          id: 'resume',
          title: 'Resume Builder',
          subtitle: 'Build a clean, professional engineering resume formatted for job applications.',
          icon: FileText,
          categoryName: 'Career & Professional Skills'
        },
        {
          id: 'coding',
          title: 'Coding Practice Tracker',
          subtitle: 'Keep track of problems solved across LeetCode, GitHub, and Codeforces.',
          icon: Code,
          categoryName: 'Career & Professional Skills'
        },
        {
          id: 'roadmaps',
          title: 'Career Learning Roadmaps',
          subtitle: 'Step-by-step roadmaps for Fullstack, AI, DevOps, and specialized engineering roles.',
          icon: Map,
          categoryName: 'Career & Professional Skills'
        },
        {
          id: 'events',
          title: 'Campus & External Events',
          subtitle: 'Explore college hackathons, competitions, and verified student opportunities.',
          icon: Calendar,
          categoryName: 'Career & Professional Skills'
        }
      ]
    }
  ];

  // Map of all tools by ID for fast lookup
  const allTools = useMemo(() => {
    return categories.flatMap((cat) => cat.tools);
  }, []);

  // Compute live stat line for any tool ID
  const getToolStat = (toolId: ToolType): string | null => {
    switch (toolId) {
      case 'attendance': {
        if (!attendanceSubjects || attendanceSubjects.length === 0) return null;
        const totalHeld = attendanceSubjects.reduce((acc, s) => acc + s.total, 0);
        const totalPresent = attendanceSubjects.reduce((acc, s) => acc + s.present, 0);
        if (totalHeld === 0) return null;
        const pct = ((totalPresent / totalHeld) * 100).toFixed(1);
        let safeSkips = 0;
        attendanceSubjects.forEach((s) => {
          const required = (s.requiredPercentage || 75) / 100;
          const allowedAbsences = Math.floor(s.present / required - s.total);
          if (allowedAbsences > 0) safeSkips += allowedAbsences;
        });
        return `${pct}% attendance • ${safeSkips} safe skip${safeSkips === 1 ? '' : 's'}`;
      }
      case 'exam': {
        if (!exams || exams.length === 0) return null;
        const now = new Date().setHours(0, 0, 0, 0);
        const upcoming = exams
          .map((e) => {
            const examTime = new Date(e.date).setHours(0, 0, 0, 0);
            const diffDays = Math.ceil((examTime - now) / (1000 * 60 * 60 * 24));
            return { ...e, diffDays };
          })
          .filter((e) => e.diffDays >= 0)
          .sort((a, b) => a.diffDays - b.diffDays);

        if (upcoming.length === 0) return `${exams.length} exams completed`;
        const next = upcoming[0];
        if (next.diffDays === 0) return `Exam today: ${next.subject}`;
        if (next.diffDays === 1) return `Exam tomorrow: ${next.subject}`;
        return `${next.diffDays} days to next exam (${next.subject})`;
      }
      case 'coding': {
        if (!codingProfiles) return null;
        const lcSolved = codingProfiles.leetcode?.solved || codingProfiles.leetcodeSolved || 0;
        const streak = codingProfiles.streak || codingProfiles.leetcode?.streak || 0;
        if (lcSolved === 0 && streak === 0) return null;
        if (streak > 0) return `${streak} day coding streak • ${lcSolved} solved`;
        return `${lcSolved} problems solved`;
      }
      case 'cgpa': {
        if (!semesters || semesters.length === 0) return null;
        const withGrades = semesters.filter((s) => (s.sgpa || 0) > 0);
        if (withGrades.length === 0) return null;
        const totalCredits = withGrades.reduce((acc, s) => acc + (s.totalCredits || 20), 0);
        const weighted = withGrades.reduce((acc, s) => acc + s.sgpa * (s.totalCredits || 20), 0);
        const cgpa = totalCredits > 0 ? (weighted / totalCredits).toFixed(2) : withGrades[0].sgpa.toFixed(2);
        return `Current CGPA: ${cgpa} (${withGrades.length} sem${withGrades.length === 1 ? '' : 's'})`;
      }
      case 'gpa': {
        if (!semesters || semesters.length === 0) return null;
        const scale = profile?.gpaScale || 10;
        const target = scale === 10 ? '9.00' : '3.80';
        return `Target goal: ${target} (${scale}.0 Scale)`;
      }
      case 'converter': {
        const scale = profile?.gpaScale || 10;
        return `${scale}.0 Scale active • 10-point ↔ 4.0 GPA`;
      }
      case 'planner': {
        const classCount = timetable ? timetable.length : 0;
        const habitCount = habits ? habits.length : 0;
        if (classCount === 0 && habitCount === 0) return null;
        return `${classCount} classes scheduled • ${habitCount} habits`;
      }
      case 'academic-calendar': {
        if (!academicEvents || academicEvents.length === 0) return null;
        return `${academicEvents.length} calendar events synced`;
      }
      case 'resume': {
        if (!resumeDraft) return null;
        const skillsCount = resumeDraft.skills?.length || 0;
        const hasContent = resumeDraft.basics?.name || skillsCount > 0;
        if (!hasContent) return null;
        return `Resume draft active • ${skillsCount} skills`;
      }
      case 'roadmaps': {
        if (!roadmaps || roadmaps.length === 0) return null;
        return `${roadmaps.length} career roadmap${roadmaps.length === 1 ? '' : 's'} tracked`;
      }
      case 'events': {
        if (!activities || activities.length === 0) return null;
        return `${activities.length} activity milestone${activities.length === 1 ? '' : 's'}`;
      }
      default:
        return null;
    }
  };

  // Filtered tools when searching
  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase().trim();
    return allTools.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.subtitle.toLowerCase().includes(q) ||
        t.categoryName.toLowerCase().includes(q)
    );
  }, [allTools, searchQuery]);

  // Pinned tools list
  const pinnedList = useMemo(() => {
    return pinnedToolIds
      .map((id) => allTools.find((t) => t.id === id))
      .filter((t): t is ToolItem => Boolean(t));
  }, [pinnedToolIds, allTools]);

  // Render a single tool card with WCAG AA contrast, hover lift, focus ring, and live stats
  const renderToolCard = (tool: ToolItem, isFeatured: boolean) => {
    const Icon = tool.icon;
    const isPinned = pinnedToolIds.includes(tool.id);
    const stat = getToolStat(tool.id);

    return (
      <button
        key={tool.id}
        type="button"
        onClick={() => onSelectTool(tool.id)}
        className={`group text-left rounded-3xl p-5 sm:p-6 transition-all duration-200 cursor-pointer ${
          isFeatured
            ? 'col-span-12 bg-gradient-to-br from-[#FAF6EE] to-[#F5ECE0]'
            : 'col-span-12 md:col-span-4 bg-[#FAF6EE]'
        } border border-[#722f37]/20 shadow-[0_4px_16px_rgba(74,53,40,0.12),0_1px_3px_rgba(74,53,40,0.08)] hover:-translate-y-1.5 hover:shadow-[0_12px_28px_rgba(74,53,40,0.18)] active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#722f37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F3EBDD] flex flex-col justify-between gap-4`}
      >
        {/* Top Header inside card: Icon + Pin Button */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#E8DCC6] border border-[#B7A89A]/50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-sm">
              <Icon className="w-6 h-6 text-[#722f37] stroke-[2.2]" />
            </div>
            {isFeatured && (
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-[#722f37]/10 text-[#722f37] border border-[#722f37]/20">
                FEATURED TOOL
              </span>
            )}
          </div>

          {/* Pin Button */}
          <button
            type="button"
            onClick={(e) => togglePin(tool.id, e)}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer border ${
              isPinned
                ? 'bg-[#722f37]/15 border-[#722f37]/30 text-[#722f37]'
                : 'bg-transparent border-transparent text-[#8C7D70] hover:text-[#722f37] hover:bg-[#E8DCC6]/60'
            }`}
            title={isPinned ? 'Unpin tool' : 'Pin tool to top'}
            aria-label={isPinned ? `Unpin ${tool.title}` : `Pin ${tool.title}`}
          >
            <Pin
              className={`w-4 h-4 transition-transform ${
                isPinned ? 'fill-[#722f37] text-[#722f37] rotate-45' : 'text-[#8C7D70]'
              }`}
            />
          </button>
        </div>

        {/* Content details: High contrast text for WCAG AA compliance */}
        <div className="space-y-1.5 w-full">
          <h3 className="text-base sm:text-lg font-black text-[#541B22] group-hover:text-[#722f37] transition-colors leading-snug">
            {tool.title}
          </h3>
          <p className="text-xs sm:text-[13px] text-[#2E1E16] font-medium leading-relaxed">
            {tool.subtitle}
          </p>
        </div>

        {/* Live Stat Line from state */}
        <div className="w-full pt-3 border-t border-[#B7A89A]/30">
          {isStorageLoading ? (
            <div className="h-5 w-36 bg-[#722f37]/10 rounded-md animate-pulse" />
          ) : stat ? (
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#541B22]">
              <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0 shadow-sm" />
              <span className="truncate">{stat}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6E5C4E]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#9C8C7D] shrink-0" />
              <span>Set up</span>
            </div>
          )}
        </div>
      </button>
    );
  };

  return (
    <div id="tools-screen" className="w-full max-w-6xl mx-auto space-y-8 sm:space-y-10 pb-36 sm:pb-44 select-none">
      {/* Header Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#FAF6EE] via-[#F4ECE0] to-[#E8DCC6] border border-[#722f37]/20 shadow-[0_4px_16px_rgba(74,53,40,0.12)] space-y-4">
        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1 text-[10.5px] tracking-wider uppercase inline-flex items-center gap-1.5 font-bold rounded-full bg-[#722f37] text-[#FAF6EE] shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#FAF6EE]" />
            11 STUDENT TOOLS INCLUDED
          </span>
        </div>

        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#541B22] leading-tight">
            Student Academic <span className="underline decoration-[#B7A89A]">Toolkit</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#2E1E16] font-medium max-w-2xl leading-relaxed">
            Plan your grades, protect your attendance threshold, organize tests, and track career roadmaps.
          </p>
        </div>

        {/* Search Bar */}
        <div className="pt-2">
          <div className="relative w-full max-w-xl">
            <Search className="w-4.5 h-4.5 text-[#541B22]/70 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tools (e.g. attendance, gpa, resume, coding)..."
              className="w-full pl-11 pr-10 py-3 rounded-2xl bg-[#FAF6EE] border border-[#722f37]/30 text-sm font-semibold text-[#2E1E16] placeholder:text-[#6E5C4E] focus:outline-none focus:ring-2 focus:ring-[#722f37] focus:border-transparent shadow-inner transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#E8DCC6] text-[#541B22] flex items-center justify-center hover:bg-[#722f37] hover:text-[#FAF6EE] transition-colors cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── SEARCH RESULTS MODE ── */}
      {filteredTools !== null ? (
        <div className="space-y-5">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#722f37]/50 px-1">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-[#FAF6EE]" />
              <h2 className="text-base font-extrabold text-[#FAF6EE]">
                Search Results ({filteredTools.length})
              </h2>
            </div>
            {filteredTools.length > 0 && (
              <span className="text-xs font-mono font-bold text-[#E8DCC6]/80">
                Query: "{searchQuery}"
              </span>
            )}
          </div>

          {filteredTools.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {filteredTools.map((tool, idx) => {
                // If count is not divisible by 3, make the first card featured wide tile
                const isFeatured = filteredTools.length % 3 !== 0 && idx === 0;
                return renderToolCard(tool, isFeatured);
              })}
            </div>
          ) : (
            <div className="rounded-3xl p-8 bg-[#FAF6EE] border border-[#722f37]/20 text-center space-y-3">
              <p className="text-sm font-bold text-[#541B22]">
                No tools found matching "{searchQuery}"
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 rounded-xl bg-[#722f37] text-[#FAF6EE] text-xs font-bold shadow-sm hover:bg-[#541B22] transition-colors cursor-pointer"
              >
                Clear Search
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ── REGULAR MODE (Pinned + Categorized Bento) ── */
        <div className="space-y-10">
          {/* Pinned Quick Access Section */}
          {pinnedList.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2.5 border-b border-[#722f37]/50 px-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#FAF6EE] flex items-center justify-center text-[#722f37] shadow-sm">
                    <Pin className="w-4 h-4 fill-[#722f37]" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-[#FAF6EE]">
                      Pinned Quick Access
                    </h2>
                    <p className="text-xs text-[#E8DCC6]/85 font-medium">
                      Your pinned daily favorites for faster workflow
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-[#E8DCC6]/80">
                  {pinnedList.length} PINNED
                </span>
              </div>

              {/* 12-col grid: No orphan cards */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {pinnedList.map((tool, idx) => {
                  const isFeatured = pinnedList.length % 3 !== 0 && idx === 0;
                  return renderToolCard(tool, isFeatured);
                })}
              </div>
            </div>
          )}

          {/* Categorized Sections */}
          {categories.map((category, catIdx) => {
            const CategoryIcon = category.icon;
            const count = category.tools.length;

            return (
              <div key={catIdx} className="space-y-4 sm:space-y-5">
                {/* Section Header */}
                <div className="flex items-center justify-between pb-2.5 border-b border-[#722f37]/50 px-1">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#FAF6EE] shadow-sm flex items-center justify-center">
                      <CategoryIcon className="w-5 h-5 text-[#722f37]" />
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-[#FAF6EE]">
                        {category.name}
                      </h2>
                      <p className="text-xs text-[#E8DCC6]/85 font-medium">
                        {category.description}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#E8DCC6]/80">
                    0{catIdx + 1}
                  </span>
                </div>

                {/* 12-col Grid: First card is featured wide tile if count % 3 !== 0 */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                  {category.tools.map((tool, idx) => {
                    const isFeatured = count % 3 !== 0 && idx === 0;
                    return renderToolCard(tool, isFeatured);
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Info Notice */}
      <div className="rounded-2xl p-4 sm:p-4.5 flex items-center justify-between gap-4 text-xs sm:text-sm font-semibold text-[#2E1E16] bg-[#FAF6EE] border border-[#722f37]/20 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#722f37]" />
          <span>All academic tools calculate instantly with real-time updates.</span>
        </div>
        <span className="text-xs text-[#541B22] font-bold uppercase tracking-wider">
          Ascendant Companion
        </span>
      </div>
    </div>
  );
}
