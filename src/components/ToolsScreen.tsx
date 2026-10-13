import React from 'react';
import {
  Calculator,
  CheckSquare,
  PieChart,
  Calendar,
  Hash,
  ArrowRight,
  Code,
  Map,
  Clock,
  FileText,
  Sparkles,
  Award,
  BookOpen,
  Briefcase
} from 'lucide-react';
import { ToolType } from '../types';

interface ToolsScreenProps {
  onSelectTool: (tool: ToolType) => void;
}

interface ToolItem {
  id: ToolType;
  title: string;
  subtitle: string;
  icon: any;
  tag: string;
}

export default function ToolsScreen({ onSelectTool }: ToolsScreenProps) {
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
          subtitle: 'Calculate your semester SGPA, cumulative CGPA, and view your complete grade history.',
          icon: Calculator,
          tag: 'GRADES',
        },
        {
          id: 'gpa',
          title: 'Target GPA Planner',
          subtitle: 'Find out exactly what grades you need in upcoming semesters to hit your dream GPA.',
          icon: PieChart,
          tag: 'GOALS',
        },
        {
          id: 'converter',
          title: 'Grade & Marks Converter',
          subtitle: 'Quickly convert between 10-point scale, 4.0 GPA, and percentage marks.',
          icon: Hash,
          tag: 'CONVERTER',
        },
      ],
    },
    {
      name: 'Attendance & Class Schedules',
      description: 'Keep your attendance safe and organize tests and daily timetables',
      icon: BookOpen,
      tools: [
        {
          id: 'attendance',
          title: 'Attendance & Safe Skips',
          subtitle: 'Log your classes and calculate exactly how many lectures you can safely skip above 75%.',
          icon: CheckSquare,
          tag: 'ATTENDANCE',
        },
        {
          id: 'exam',
          title: 'Exam Countdown & Priorities',
          subtitle: 'Schedule upcoming midterms and finals with days-remaining countdowns.',
          icon: Calendar,
          tag: 'EXAMS',
        },
        {
          id: 'planner',
          title: 'Daily Routine & Timetable',
          subtitle: 'Keep track of your weekly class schedule, daily study checklist, and routines.',
          icon: Clock,
          tag: 'HABITS',
        },
        {
          id: 'academic-calendar',
          title: 'College Academic Calendar',
          subtitle: 'Upload your college PDF calendar to automatically extract exam and break dates.',
          icon: Calendar,
          tag: 'CALENDAR',
        },
      ],
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
          tag: 'CAREER',
        },
        {
          id: 'coding',
          title: 'Coding Practice Tracker',
          subtitle: 'Keep track of problems solved across LeetCode, GitHub, and Codeforces.',
          icon: Code,
          tag: 'CODING',
        },
        {
          id: 'roadmaps',
          title: 'Career Learning Roadmaps',
          subtitle: 'Step-by-step roadmaps for Fullstack, AI, DevOps, and tech roles.',
          icon: Map,
          tag: 'ROADMAPS',
        },
        {
          id: 'events',
          title: 'Campus & External Events',
          subtitle: 'Explore college hackathons, competitions, and student opportunities.',
          icon: Calendar,
          tag: 'EVENTS',
        },
      ],
    },
  ];

  return (
    <div id="tools-screen" className="space-y-8 sm:space-y-10 pb-16 select-none">
      {/* Header Banner */}
      <div className="clay-card p-6 sm:p-8 bg-gradient-to-br from-[#FDFBF7] via-[#F6EFE3] to-[#E8DCC6]">
        <div className="flex items-center gap-2 mb-2">
          <span className="clay-badge-burgundy px-3.5 py-1 text-[10.5px] tracking-wider uppercase inline-flex items-center gap-1.5 font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            11 STUDENT TOOLS INCLUDED
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#722f37] leading-tight">
          Student Academic <span className="underline decoration-[#B7A89A]">Toolkit</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#7A6B5E] mt-2 font-medium max-w-2xl leading-relaxed">
          Helpful offline calculators to help you plan your grades, protect your attendance, and build your career portfolio.
        </p>
      </div>

      {/* Categorized Bento Sections */}
      {categories.map((category, catIdx) => {
        const CategoryIcon = category.icon;
        return (
          <div key={catIdx} className="space-y-4 sm:space-y-5">
            {/* Section Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-[#B7A89A]/30 px-1">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#E8DCC6] border border-white/80 shadow-sm flex items-center justify-center">
                  <CategoryIcon className="w-5 h-5 text-[#722f37]" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-[#722f37]">
                    {category.name}
                  </h2>
                  <p className="text-xs text-[#7A6B5E]">
                    {category.description}
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-[#8C7D70]">
                0{catIdx + 1}
              </span>
            </div>

            {/* Grid of Tools (3 Columns on large screens to fill screen width) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {category.tools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    onClick={() => onSelectTool(tool.id)}
                    className="clay-card p-5 sm:p-5.5 text-left flex flex-col justify-between gap-4 cursor-pointer transition-all active:scale-95 group hover:-translate-y-1"
                  >
                    {/* Top Row: Icon + Badge + Arrow Action */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FDF8F0] to-[#E2D5BE] border border-white/80 shadow-[3px_3px_8px_rgba(183,168,154,0.3),inset_2px_2px_3px_rgba(255,255,255,0.9)] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <Icon className="w-6 h-6 text-[#722f37] stroke-[2.2]" />
                        </div>
                        <span className="clay-badge px-3 py-0.5 text-[9.5px] uppercase font-bold">
                          {tool.tag}
                        </span>
                      </div>

                      {/* Pill Arrow button */}
                      <div className="w-8 h-8 rounded-full bg-[#722f37] text-[#FAF6EE] flex items-center justify-center shrink-0 shadow-md group-hover:translate-x-1 transition-transform">
                        <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-1.5">
                      <h3 className="text-base font-extrabold text-[#722f37] group-hover:text-[#5a232a] transition-colors leading-tight">
                        {tool.title}
                      </h3>
                      <p className="text-xs sm:text-[13px] text-[#7A6B5E] leading-relaxed">
                        {tool.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Footer Offline Notice */}
      <div className="clay-card p-4 sm:p-4.5 flex items-center justify-between gap-4 text-xs sm:text-sm font-semibold text-[#7A6B5E] bg-[#E8DCC6]/40">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#722f37]" />
          <span>All calculations run 100% offline on your device with zero cloud lag.</span>
        </div>
        <span className="text-xs text-[#722f37] font-bold uppercase tracking-wider">Ascendant Companion</span>
      </div>
    </div>
  );
}
