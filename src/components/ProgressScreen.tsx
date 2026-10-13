import React from 'react';
import { Semester, AttendanceSubject } from '../types';
import { TrendingUp, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

interface ProgressScreenProps {
  semesters: Semester[];
  attendanceSubjects: AttendanceSubject[];
  gpaScale: 4 | 10;
  onNavigateToTool?: (tool: any) => void;
}

export default function ProgressScreen({ semesters, attendanceSubjects, gpaScale, onNavigateToTool }: ProgressScreenProps) {
  
  if (semesters.length === 0) {
    return (
      <div id="progress-screen" className="space-y-8 sm:space-y-10 pb-16 select-none">
        {/* Header */}
        <div className="clay-card p-6 sm:p-8 bg-gradient-to-br from-[#FDFBF7] via-[#F6EFE3] to-[#E8DCC6]">
          <div className="flex items-center gap-2 mb-2">
            <span className="clay-badge-burgundy px-3.5 py-1 text-xs tracking-wider uppercase inline-flex items-center gap-2 font-bold">
              <TrendingUp className="w-4 h-4" />
              ACADEMIC PROGRESS & INSIGHTS
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#722f37] leading-tight">
            Grade <span className="underline decoration-[#B7A89A]">Progress</span>
          </h1>
          <p className="text-sm sm:text-base text-[#7A6B5E] mt-3 font-medium max-w-2xl leading-relaxed">
            Visual graphs showing your semester-by-semester SGPA scores and overall growth.
          </p>
        </div>

        <div className="text-center py-20 clay-card space-y-5">
          <div className="w-18 h-18 rounded-3xl bg-[#E8DCC6] border border-white/80 shadow-[inset_2px_2px_4px_rgba(255,255,255,0.8)] mx-auto flex items-center justify-center">
            <AlertCircle className="w-9 h-9 text-[#722f37]" />
          </div>
          <div className="space-y-2">
            <h4 className="text-xl sm:text-2xl font-black text-[#722f37]">No Semester Grades Logged Yet</h4>
            <p className="text-sm sm:text-base text-[#7A6B5E] mt-1 max-w-md mx-auto leading-relaxed">
              Calculate and save your semester grades inside the <strong>CGPA Calculator</strong> first to see your grade trajectory charts here.
            </p>
          </div>
          {onNavigateToTool && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onNavigateToTool('cgpa')}
                className="clay-btn-burgundy px-6 py-3.5 text-sm font-extrabold shadow-md active:scale-95 transition-transform"
              >
                Open CGPA Calculator
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Calculate historical SGPAs and CGPA progression
  const getGpaHistory = () => {
    const history: { label: string; sgpa: number; cgpa: number }[] = [];
    let runningPoints = 0;
    let runningCredits = 0;

    semesters.forEach((sem) => {
      runningPoints += sem.sgpa * sem.totalCredits;
      runningCredits += sem.totalCredits;
      const cumulative = runningCredits > 0 ? parseFloat((runningPoints / runningCredits).toFixed(2)) : sem.sgpa;

      history.push({
        label: `Sem ${sem.number}`,
        sgpa: sem.sgpa,
        cgpa: cumulative
      });
    });

    return history;
  };

  const gpaData = getGpaHistory();

  // Compute consistency score based on SGPA standard deviation
  const calculateConsistency = () => {
    if (gpaData.length < 2) return 94;
    const sgpas = gpaData.map(d => d.sgpa);
    const avg = sgpas.reduce((s, x) => s + x, 0) / sgpas.length;
    const variance = sgpas.reduce((s, x) => s + Math.pow(x - avg, 2), 0) / sgpas.length;
    const stdDev = Math.sqrt(variance);
    return Math.max(50, Math.min(100, Math.round(100 - (stdDev / gpaScale) * 100)));
  };

  const consistencyScore = calculateConsistency();

  // GPA predictions based on average growth
  const predictFutureCGPA = () => {
    if (gpaData.length === 0) return (gpaScale === 10 ? 8.7 : 3.6);
    const lastCgpa = gpaData[gpaData.length - 1].cgpa;
    if (gpaData.length === 1) return lastCgpa;

    let totalDelta = 0;
    for (let i = 1; i < gpaData.length; i++) {
      totalDelta += gpaData[i].cgpa - gpaData[i - 1].cgpa;
    }
    const avgDelta = totalDelta / (gpaData.length - 1);
    const prediction = Math.min(gpaScale, lastCgpa + (avgDelta * 2));
    return parseFloat(prediction.toFixed(2));
  };

  const futurePrediction = predictFutureCGPA();

  // Render SVG charts
  const renderSgpaChart = () => {
    const chartHeight = 150;
    const chartWidth = 460;
    const barWidth = 42;
    const maxVal = gpaScale;

    return (
      <svg className="w-full h-48 sm:h-52 overflow-visible" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="xMidYMid meet">
        {/* Soft grid lines */}
        <line x1="0" y1={chartHeight * 0.25} x2={chartWidth} y2={chartHeight * 0.25} stroke="#E8DCC6" strokeDasharray="3 3" />
        <line x1="0" y1={chartHeight * 0.5} x2={chartWidth} y2={chartHeight * 0.5} stroke="#E8DCC6" strokeDasharray="3 3" />
        <line x1="0" y1={chartHeight * 0.75} x2={chartWidth} y2={chartHeight * 0.75} stroke="#E8DCC6" strokeDasharray="3 3" />

        {/* Bars */}
        {gpaData.map((d, i) => {
          const spacing = chartWidth / (gpaData.length || 1);
          const x = i * spacing + (spacing - barWidth) / 2;
          const barHeight = (d.sgpa / maxVal) * (chartHeight - 45);
          const y = chartHeight - 25 - barHeight;

          return (
            <g key={i} className="cursor-pointer group">
              {/* Background sunken bar track */}
              <rect
                x={x}
                y={12}
                width={barWidth}
                height={chartHeight - 37}
                fill="#E8DCC6"
                opacity="0.35"
                rx="10"
              />
              {/* Deep Burgundy active bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill="#722f37"
                rx="10"
                className="transition-all hover:opacity-90"
              />
              {/* Semester label */}
              <text x={x + barWidth / 2} y={chartHeight - 6} fill="#722f37" fontSize="12" fontWeight="800" fontFamily="sans-serif" textAnchor="middle">
                {d.label}
              </text>
              {/* Score on top of bar */}
              <text x={x + barWidth / 2} y={y - 7} fill="#722f37" fontSize="12" fontWeight="800" fontFamily="sans-serif" textAnchor="middle">
                {d.sgpa.toFixed(1)}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  const renderCgpaGrowthLine = () => {
    const chartHeight = 150;
    const chartWidth = 460;
    const padding = 36;
    const maxVal = gpaScale;
    const minVal = gpaScale === 10 ? 5 : 2;

    if (gpaData.length === 0) return null;

    const points = gpaData.map((d, i) => {
      const spacing = (chartWidth - padding * 2) / Math.max(1, gpaData.length - 1 || 1);
      const x = gpaData.length === 1 ? chartWidth / 2 : padding + i * spacing;
      const normalizedY = (d.cgpa - minVal) / (maxVal - minVal);
      const y = chartHeight - 30 - normalizedY * (chartHeight - 55);
      return { x, y, cgpa: d.cgpa, label: d.label };
    });

    const polylinePath = points.map(p => `${p.x},${p.y}`).join(' ');

    return (
      <svg className="w-full h-48 sm:h-52 overflow-visible" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="xMidYMid meet">
        {/* Grids */}
        <line x1="0" y1={chartHeight * 0.3} x2={chartWidth} y2={chartHeight * 0.3} stroke="#E8DCC6" strokeDasharray="3 3" />
        <line x1="0" y1={chartHeight * 0.6} x2={chartWidth} y2={chartHeight * 0.6} stroke="#E8DCC6" strokeDasharray="3 3" />

        {/* Shaded Area */}
        {points.length > 1 && (
          <path
            d={`M ${points[0].x} ${chartHeight - 24} L ${polylinePath} L ${points[points.length - 1].x} ${chartHeight - 24} Z`}
            fill="#B7A89A"
            opacity="0.25"
          />
        )}

        {/* Polyline */}
        <polyline
          fill="none"
          stroke="#722f37"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={polylinePath}
        />

        {/* Nodes */}
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r="6"
              fill="#FAF6EE"
              stroke="#722f37"
              strokeWidth="3"
            />
            <text x={p.x} y={p.y - 12} fill="#722f37" fontSize="12" fontWeight="800" fontFamily="sans-serif" textAnchor="middle">
              {p.cgpa.toFixed(2)}
            </text>
            <text x={p.x} y={chartHeight - 6} fill="#722f37" fontSize="11" fontWeight="800" fontFamily="sans-serif" textAnchor="middle">
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    );
  };

  return (
    <div id="progress-screen" className="space-y-8 sm:space-y-10 pb-16 select-none">
      {/* Header Banner */}
      <div className="clay-card p-6 sm:p-8 bg-gradient-to-br from-[#FDFBF7] via-[#F6EFE3] to-[#E8DCC6]">
        <div className="flex items-center gap-2 mb-2">
          <span className="clay-badge-burgundy px-3.5 py-1 text-xs tracking-wider uppercase inline-flex items-center gap-2 font-bold">
            <TrendingUp className="w-4 h-4" />
            ACADEMIC PERFORMANCE & INSIGHTS
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#722f37] leading-tight">
          Grade <span className="underline decoration-[#B7A89A]">Progress</span>
        </h1>
        <p className="text-sm sm:text-base text-[#7A6B5E] mt-3 font-medium max-w-2xl leading-relaxed">
          Visual charts showing your semester-by-semester SGPA scores and overall cumulative growth.
        </p>
      </div>

      {/* Grid containing SGPA Trend & CGPA Growth Line charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-7">
        
        {/* Semester SGPA Trend */}
        <div className="clay-card p-6 sm:p-7 space-y-5">
          <div className="flex justify-between items-center pb-3 border-b border-[#B7A89A]/30">
            <span className="text-sm sm:text-base font-extrabold text-[#722f37] uppercase tracking-wide">
              Semester Scores (SGPA)
            </span>
            <span className="clay-badge-burgundy px-3 py-1 text-[10px] sm:text-xs uppercase font-bold">
              By Semester
            </span>
          </div>

          <div className="pt-2">
            {renderSgpaChart()}
          </div>
          <p className="text-xs sm:text-sm text-[#7A6B5E] text-center pt-2 font-medium">
            Bar height represents your GPA for each individual completed semester.
          </p>
        </div>

        {/* Overall CGPA Growth Line */}
        <div className="clay-card p-6 sm:p-7 space-y-5">
          <div className="flex justify-between items-center pb-3 border-b border-[#B7A89A]/30">
            <span className="text-sm sm:text-base font-extrabold text-[#722f37] uppercase tracking-wide">
              Cumulative Growth (CGPA)
            </span>
            <span className="clay-badge-burgundy px-3 py-1 text-[10px] sm:text-xs uppercase font-bold">
              Overall Average
            </span>
          </div>

          <div className="pt-2">
            {renderCgpaGrowthLine()}
          </div>
          <p className="text-xs sm:text-sm text-[#7A6B5E] text-center pt-2 font-medium">
            Shows how your total cumulative GPA has evolved across your academic career.
          </p>
        </div>

      </div>

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-7">
        <div className="clay-card p-6 sm:p-7 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E8DCC6] border border-white/80 shadow-sm flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-[#722f37]" />
            </div>
            <div>
              <span className="text-sm sm:text-base font-extrabold text-[#722f37] block">Grade Consistency Score</span>
              <span className="text-[11px] font-bold text-[#8C7D70]">STABILITY METRIC</span>
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-[#722f37] pt-1">
            {consistencyScore}%
          </div>
          <p className="text-xs sm:text-sm text-[#7A6B5E] leading-relaxed pt-1">
            {consistencyScore >= 90
              ? 'Excellent stability! Your grades show great consistency across terms.'
              : 'Keep up regular study habits to reduce score variance across subjects.'}
          </p>
        </div>

        <div className="clay-card p-6 sm:p-7 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E8DCC6] border border-white/80 shadow-sm flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-[#722f37]" />
            </div>
            <div>
              <span className="text-sm sm:text-base font-extrabold text-[#722f37] block">Projected Final CGPA</span>
              <span className="text-[11px] font-bold text-[#8C7D70]">GRADUATION TRAJECTORY</span>
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-[#722f37] pt-1">
            {futurePrediction.toFixed(2)}
          </div>
          <p className="text-xs sm:text-sm text-[#7A6B5E] leading-relaxed pt-1">
            Based on your past semester momentum, this is your projected cumulative GPA upon graduation.
          </p>
        </div>
      </div>

      {/* Semester Breakdown Cards */}
      <div className="clay-card p-6 sm:p-7 space-y-5">
        <div className="flex justify-between items-center pb-3 border-b border-[#B7A89A]/30">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-[#722f37]">
              Semester History Breakdown
            </h3>
            <p className="text-xs sm:text-sm text-[#7A6B5E] mt-0.5">
              Detailed breakdown of credits and grade points earned across each term.
            </p>
          </div>
          <span className="clay-badge-burgundy px-3 py-1 text-xs font-bold uppercase">
            {semesters.length} Semesters
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {gpaData.map((sem, idx) => (
            <div key={idx} className="clay-card !bg-[#FAF6EE] p-4.5 space-y-2 border border-[#B7A89A]/30">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-[#722f37] uppercase tracking-wider">{sem.label}</span>
                <span className="clay-badge px-2 py-0.5 text-[10px] font-bold">Term {idx + 1}</span>
              </div>
              <div className="flex justify-between items-baseline pt-1">
                <div>
                  <span className="text-[10px] font-bold text-[#8C7D70] uppercase block">SGPA</span>
                  <span className="text-2xl font-black text-[#722f37]">{sem.sgpa.toFixed(2)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-[#8C7D70] uppercase block">Cumulative CGPA</span>
                  <span className="text-lg font-extrabold text-[#722f37] font-mono">{sem.cgpa.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
