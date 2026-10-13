import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AttendanceSubject } from '../types';
import { ArrowLeft, Plus, Trash2, CheckCircle2, AlertCircle, Sparkles, Check, Sliders } from 'lucide-react';

interface AttendanceTrackerProps {
  savedSubjects: AttendanceSubject[];
  onSaveSubjects: (subjects: AttendanceSubject[]) => void;
  onBack: () => void;
}

export default function AttendanceTracker({ savedSubjects, onSaveSubjects, onBack }: AttendanceTrackerProps) {
  const [subjects, setSubjects] = useState<AttendanceSubject[]>([]);
  const [selectedSubId, setSelectedSubId] = useState<string>('');
  const [newSubName, setNewSubName] = useState('');
  const [newSubTarget, setNewSubTarget] = useState(75);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [simAttended, setSimAttended] = useState<number>(0);
  const [simMissed, setSimMissed] = useState<number>(0);

  // Initialize from saved state or load defaults
  useEffect(() => {
    setSubjects(savedSubjects);
    if (savedSubjects && savedSubjects.length > 0) {
      setSelectedSubId(prev => savedSubjects.some(s => s.id === prev) ? prev : savedSubjects[0].id);
    } else {
      setSelectedSubId('');
    }
  }, [savedSubjects]);

  useEffect(() => {
    setSimAttended(0);
    setSimMissed(0);
  }, [selectedSubId]);

  const activeSubject = subjects.find(s => s.id === selectedSubId) || subjects[0] || null;

  const handleAddSubject = () => {
    if (!newSubName.trim()) return;
    const newSub: AttendanceSubject = {
      id: `att-${Date.now()}`,
      name: newSubName.trim(),
      present: 0,
      total: 0,
      requiredPercentage: newSubTarget,
      history: []
    };
    const updated = [...subjects, newSub];
    setSubjects(updated);
    setSelectedSubId(newSub.id);
    onSaveSubjects(updated);
    setNewSubName('');
    setIsAddFormOpen(false);
  };

  const handleRemoveSubject = (id: string) => {
    const updated = subjects.filter(s => s.id !== id);
    setSubjects(updated);
    if (selectedSubId === id && updated.length > 0) {
      setSelectedSubId(updated[0].id);
    }
    onSaveSubjects(updated);
  };

  const handleUpdateAttendance = (id: string, isPresent: boolean, isIncrement: boolean) => {
    const updated = subjects.map(s => {
      if (s.id === id) {
        let p = s.present;
        let t = s.total;
        let hist = [...(s.history || [])];

        if (t < p) {
          t = p;
        }

        if (isIncrement) {
          t += 1;
          if (isPresent) {
            p += 1;
            hist.push('present');
          } else {
            hist.push('absent');
          }
        } else {
          // Decrement (reverting/deleting last logged state)
          if (isPresent) {
            if (p > 0) {
              p -= 1;
              t -= 1;
              const lastIdx = hist.lastIndexOf('present');
              if (lastIdx !== -1) {
                hist.splice(lastIdx, 1);
              }
            }
          } else {
            if (t > p) {
              t -= 1;
              const lastIdx = hist.lastIndexOf('absent');
              if (lastIdx !== -1) {
                hist.splice(lastIdx, 1);
              }
            }
          }
        }

        if (p < 0) p = 0;
        if (t < p) t = p;

        return { ...s, present: p, total: t, history: hist };
      }
      return s;
    });
    setSubjects(updated);
    onSaveSubjects(updated);
  };

  const handleSetTarget = (id: string, target: number) => {
    const updated = subjects.map(s => {
      if (s.id === id) {
        return { ...s, requiredPercentage: target };
      }
      return s;
    });
    setSubjects(updated);
    onSaveSubjects(updated);
  };

  // Compute live calculations
  const calculateAttendanceStats = (sub: AttendanceSubject | null) => {
    if (!sub) return null;
    const { present, total, requiredPercentage } = sub;
    const currentPercent = total > 0 ? parseFloat(((present / total) * 100).toFixed(1)) : 0.0;

    let skipCount = 0;
    let attendCount = 0;

    // Projection calculation: can skip
    if (currentPercent >= requiredPercentage && total > 0) {
      let tempPresent = present;
      let tempTotal = total;
      while (tempTotal > 0) {
        const nextPercent = (tempPresent / (tempTotal + 1)) * 100;
        if (nextPercent >= requiredPercentage) {
          skipCount += 1;
          tempTotal += 1;
        } else {
          break;
        }
      }
    }

    // Projection calculation: need to attend consecutively
    if (currentPercent < requiredPercentage) {
      let tempPresent = present;
      let tempTotal = total;
      while (true) {
        tempPresent += 1;
        tempTotal += 1;
        const nextPercent = (tempPresent / tempTotal) * 100;
        attendCount += 1;
        if (nextPercent >= requiredPercentage) {
          break;
        }
        if (attendCount > 100) break;
      }
    }

    const ifAttendPercent = total > 0 ? parseFloat((((present + 1) / (total + 1)) * 100).toFixed(1)) : 100.0;
    const ifSkipPercent = total > 0 ? parseFloat(((present / (total + 1)) * 100).toFixed(1)) : 0.0;

    return {
      percentage: currentPercent,
      skipCount,
      attendCount,
      ifAttendPercent,
      ifSkipPercent,
      isSafe: currentPercent >= requiredPercentage
    };
  };

  const stats = calculateAttendanceStats(activeSubject);

  const simulatedPresent = activeSubject ? activeSubject.present + simAttended : 0;
  const simulatedTotal = (activeSubject && (simAttended > 0 || simMissed > 0)) ? activeSubject.total + simAttended + simMissed : 0;
  const simulatedPercentCapped = Math.min(100, simulatedTotal > 0 ? parseFloat(((simulatedPresent / simulatedTotal) * 100).toFixed(1)) : 0);

  // SVG parameters for circular progress
  const radius = 68;
  const strokeWidth = 11;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = stats ? circumference - (Math.min(stats.percentage, 100) / 100) * circumference : circumference;

  return (
    <div id="attendance-tracker" className="space-y-8 sm:space-y-10 pb-16">
      {/* Top Header */}
      <div className="flex items-center gap-3.5">
        <button
          onClick={onBack}
          className="clay-btn-latte !w-11 !h-11 !p-0 !rounded-2xl flex items-center justify-center cursor-pointer"
          title="Back to Tools"
        >
          <ArrowLeft className="w-5 h-5 text-[#722f37]" />
        </button>
        <div>
          <div className="clay-badge text-xs px-3.5 py-1 inline-block mb-1 font-bold">
            GRADENCE • ATTENDANCE
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#722f37]">
            Attendance & Safe Skip Tracker
          </h1>
        </div>
      </div>

      {/* Two Column Layout: Subject list & Main active subject details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-7 items-start">
        {/* Left Column: Subject List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs sm:text-sm font-extrabold text-[#722f37] uppercase tracking-wider font-mono">
              YOUR SUBJECTS ({subjects.length})
            </span>
            <button
              onClick={() => setIsAddFormOpen(!isAddFormOpen)}
              className="clay-btn-burgundy px-3.5 py-2 text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Track New</span>
            </button>
          </div>

          <AnimatePresence mode="wait">
            {isAddFormOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="clay-card p-5 sm:p-6 space-y-4 overflow-hidden border-2 border-[#B7A89A]"
              >
                <div>
                  <label htmlFor="new-sub-name" className="text-xs font-bold text-[#722f37] uppercase tracking-wider block">
                    Subject Name
                  </label>
                  <div className="clay-inset p-3 px-3.5 mt-1.5">
                    <input
                      id="new-sub-name"
                      type="text"
                      value={newSubName}
                      onChange={(e) => setNewSubName(e.target.value)}
                      placeholder="e.g. Operating Systems"
                      className="w-full bg-transparent text-sm font-semibold text-[#722f37] focus:outline-none placeholder:text-[#B7A89A]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs sm:text-sm font-bold text-[#722f37]">
                    <span>Minimum Target</span>
                    <span className="clay-badge px-2.5 py-0.5 text-xs font-bold">{newSubTarget}%</span>
                  </div>
                  <input
                    id="new-sub-target"
                    type="range"
                    min="50"
                    max="95"
                    value={newSubTarget}
                    onChange={(e) => setNewSubTarget(parseInt(e.target.value))}
                    className="w-full accent-[#722f37] mt-2 cursor-pointer"
                  />
                  <div className="flex justify-between text-xs font-bold text-[#B7A89A] mt-1">
                    <span>50%</span>
                    <span>75%</span>
                    <span>95%</span>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-1">
                  <button
                    onClick={handleAddSubject}
                    className="clay-btn-burgundy flex-1 py-2.5 text-xs sm:text-sm font-bold cursor-pointer"
                  >
                    Add Subject
                  </button>
                  <button
                    onClick={() => setIsAddFormOpen(false)}
                    className="clay-btn-latte px-4 py-2.5 text-xs sm:text-sm font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
            {subjects.length === 0 ? (
              <div className="clay-card p-6 text-center text-xs sm:text-sm text-[#722f37]/70 font-semibold">
                No subjects tracked yet. Click "Track New" above to add your first course!
              </div>
            ) : (
              subjects.map((sub) => {
                const isSelected = selectedSubId === sub.id;
                const subPercent = sub.total > 0 ? parseFloat(((sub.present / sub.total) * 100).toFixed(1)) : 0;
                const isSafe = subPercent >= sub.requiredPercentage || sub.total === 0;

                return (
                  <div
                    key={sub.id}
                    onClick={() => setSelectedSubId(sub.id)}
                    className={`clay-card p-4.5 transition-all cursor-pointer flex items-center justify-between gap-3.5 ${
                      isSelected
                        ? '!border-2 !border-[#722f37] shadow-lg'
                        : '!bg-[#FAF6EE] opacity-85 hover:opacity-100'
                    }`}
                  >
                    <div className="truncate pr-2 space-y-1">
                      <h4 className="text-base font-black text-[#722f37] truncate">{sub.name}</h4>
                      <span className="text-xs sm:text-[13px] font-semibold text-[#722f37]/75 block">
                        {sub.present}/{sub.total} attended • {sub.total - sub.present} missed
                      </span>
                      <span className="text-xs font-bold text-[#B7A89A] block">
                        Target {sub.requiredPercentage}%
                      </span>
                    </div>

                    <div className="text-right shrink-0 space-y-1">
                      <span className={`text-lg font-black font-mono block ${isSafe ? 'text-[#722f37]' : 'text-amber-800'}`}>
                        {sub.total > 0 ? `${subPercent}%` : '—'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Delete ${sub.name}?`)) {
                            handleRemoveSubject(sub.id);
                          }
                        }}
                        className="text-xs font-bold text-red-700 hover:text-red-900 transition-colors cursor-pointer"
                        title="Delete subject"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Active subject insights */}
        <div className="lg:col-span-2">
          {activeSubject ? (
            <div className="clay-card p-6 sm:p-8 space-y-7">

              {/* Active Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4.5 border-b border-[#B7A89A]/30">
                <div>
                  <h3 className="text-2xl font-black text-[#722f37]">{activeSubject.name}</h3>
                  <p className="text-xs sm:text-sm text-[#722f37]/75 mt-0.5 font-medium">
                    Tap buttons below to mark your classes as attended or missed.
                  </p>
                </div>

                {/* Live Class Log Actions */}
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => handleUpdateAttendance(activeSubject.id, false, true)}
                    className="clay-btn-latte px-4 py-2.5 text-xs sm:text-sm font-bold text-[#722f37] cursor-pointer flex items-center gap-1.5"
                  >
                    <span>+ Missed Class</span>
                  </button>
                  <button
                    onClick={() => handleUpdateAttendance(activeSubject.id, true, true)}
                    className="clay-btn-burgundy px-4.5 py-2.5 text-xs sm:text-sm font-bold text-[#FAF6EE] cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>+ Attended Class</span>
                  </button>
                </div>
              </div>

              {/* Large circular attendance tracker & Stats block */}
              <div className="flex flex-col sm:flex-row items-center justify-around gap-8 py-2">
                {/* SVG circular indicator in Claymorphism */}
                <div className="relative flex items-center justify-center select-none shrink-0">
                  <svg className="w-48 h-48 transform -rotate-90">
                    {/* Background track circle in Cosmic Latte */}
                    <circle
                      cx="96"
                      cy="96"
                      r={radius}
                      stroke="#E0D3BD"
                      strokeWidth={strokeWidth}
                      fill="transparent"
                    />
                    {/* Progress circle in Deep Burgundy */}
                    <circle
                      cx="96"
                      cy="96"
                      r={radius}
                      stroke="#722f37"
                      strokeWidth={strokeWidth}
                      fill="transparent"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-500 ease-out"
                    />
                  </svg>
                  {/* Inside central text */}
                  <div className="absolute text-center">
                    <span className="text-3xl sm:text-4xl font-black text-[#722f37] block">
                      {activeSubject.total > 0 ? `${stats?.percentage}%` : '—'}
                    </span>
                    <span className="text-xs font-bold text-[#B7A89A] uppercase tracking-widest block mt-0.5">
                      ATTENDANCE
                    </span>
                  </div>
                </div>

                {/* Mini metrics columns */}
                <div className="space-y-4 w-full sm:max-w-xs">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="clay-inset p-3.5 rounded-2xl text-center">
                      <span className="text-xs font-bold text-[#B7A89A] uppercase block">Logged</span>
                      <span className="text-xl font-black text-[#722f37] mt-0.5 block">{activeSubject.total}</span>
                    </div>
                    <div className="clay-inset p-3.5 rounded-2xl text-center">
                      <span className="text-xs font-bold text-[#B7A89A] uppercase block">Attended</span>
                      <span className="text-xl font-black text-emerald-800 mt-0.5 block">{activeSubject.present}</span>
                    </div>
                    <div className="clay-inset p-3.5 rounded-2xl text-center">
                      <span className="text-xs font-bold text-[#B7A89A] uppercase block">Missed</span>
                      <span className="text-xl font-black text-amber-800 mt-0.5 block">{activeSubject.total - activeSubject.present}</span>
                    </div>
                  </div>

                  {/* Target Goal Slider */}
                  <div className="clay-inset p-4 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center text-xs sm:text-sm font-bold text-[#722f37]">
                      <span>Required Goal</span>
                      <span className="clay-badge px-2.5 py-0.5 text-xs font-bold">{activeSubject.requiredPercentage}%</span>
                    </div>
                    <input
                      type="range"
                      min="60"
                      max="95"
                      value={activeSubject.requiredPercentage}
                      onChange={(e) => handleSetTarget(activeSubject.id, parseInt(e.target.value))}
                      className="w-full accent-[#722f37] cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Live Safe-Skip & Recovery Recommendation Card */}
              {stats && activeSubject && activeSubject.total > 0 && (
                <div className="space-y-4">
                  <div className={`clay-card p-6 border-2 ${
                    stats.isSafe
                      ? '!bg-[#F2F8EE] !border-emerald-300 text-emerald-950'
                      : '!bg-[#FFF4EE] !border-amber-300 text-amber-950'
                  }`}>
                    <div className="flex items-start gap-3.5">
                      {stats.isSafe ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <h4 className="text-sm sm:text-base font-extrabold uppercase tracking-wide">
                          {stats.isSafe ? 'Attendance Target Met' : 'Attention: Attendance Below Target'}
                        </h4>
                        <p className="text-sm leading-relaxed mt-1.5 font-medium">
                          {stats.isSafe ? (
                            <>
                              You are meeting your target of <strong>{activeSubject.requiredPercentage}%</strong>. You can safely skip the next <strong className="text-base font-black underline">{stats.skipCount}</strong> upcoming classes without falling below requirements.
                            </>
                          ) : (
                            <>
                              You are currently below target. You need to attend the next <strong className="text-base font-black underline">{stats.attendCount}</strong> consecutive classes to reach your goal of <strong>{activeSubject.requiredPercentage}%</strong>.
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-3.5 mt-3.5 border-t border-black/10 text-xs sm:text-sm font-semibold">
                      <div>
                        <span className="opacity-75 block text-xs">If you attend next class:</span>
                        <span className="font-black text-base block mt-0.5">{stats.ifAttendPercent}%</span>
                      </div>
                      <div>
                        <span className="opacity-75 block text-xs">If you miss next class:</span>
                        <span className="font-black text-base block mt-0.5">{stats.ifSkipPercent}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Attendance Rescue Engine Simulator */}
                  <div className="clay-card !bg-[#FAF6EE] p-6 space-y-4 border border-[#B7A89A]/40">
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm font-extrabold text-[#722f37] uppercase tracking-wide font-mono flex items-center gap-2">
                        <Sliders className="w-4 h-4" />
                        WHAT-IF CLASS SIMULATOR
                      </span>
                      {simulatedTotal > 0 && (
                        <span className={`clay-badge px-3 py-1 text-xs font-bold ${
                          simulatedPercentCapped >= activeSubject.requiredPercentage
                            ? '!bg-emerald-700 text-white'
                            : '!bg-amber-700 text-white'
                        }`}>
                          Projected: {simulatedPercentCapped}%
                        </span>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-[#722f37]/75 font-medium leading-relaxed">
                      Test future classes to see how your percentage will change before making decisions.
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="sim-attended" className="text-[10px] font-bold text-[#722f37] uppercase">Will Attend (Classes)</label>
                        <div className="clay-inset p-2 px-3 mt-1">
                          <input
                            id="sim-attended"
                            type="number"
                            min="0"
                            value={simAttended || ''}
                            onChange={(e) => setSimAttended(Math.max(0, parseInt(e.target.value) || 0))}
                            placeholder="0"
                            className="w-full bg-transparent text-xs font-bold text-[#722f37] focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="sim-missed" className="text-[10px] font-bold text-[#722f37] uppercase">Will Skip (Classes)</label>
                        <div className="clay-inset p-2 px-3 mt-1">
                          <input
                            id="sim-missed"
                            type="number"
                            min="0"
                            value={simMissed || ''}
                            onChange={(e) => setSimMissed(Math.max(0, parseInt(e.target.value) || 0))}
                            placeholder="0"
                            className="w-full bg-transparent text-xs font-bold text-[#722f37] focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {simulatedTotal > 0 && (
                      <div className={`p-3.5 rounded-2xl text-xs font-semibold leading-relaxed border ${
                        simulatedPercentCapped >= activeSubject.requiredPercentage
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                          : 'bg-amber-50 border-amber-300 text-amber-900'
                      }`}>
                        {simulatedPercentCapped >= activeSubject.requiredPercentage ? (
                          <span>✓ Great! This schedule keeps your attendance at <strong>{simulatedPercentCapped}%</strong> (safely above your target {activeSubject.requiredPercentage}%).</span>
                        ) : (
                          <span>✗ Notice: This schedule results in <strong>{simulatedPercentCapped}%</strong>, which is below your target of {activeSubject.requiredPercentage}%.</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Manual logs adjustments */}
                  <div className="flex justify-between items-center clay-inset p-3 text-xs font-bold text-[#722f37]">
                    <span>Revert a misclicked class log</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateAttendance(activeSubject.id, false, false)}
                        className="clay-btn-latte px-2.5 py-1 text-[11px] cursor-pointer"
                        title="Undo 1 missed class"
                      >
                        - Missed
                      </button>
                      <button
                        onClick={() => handleUpdateAttendance(activeSubject.id, true, false)}
                        className="clay-btn-latte px-2.5 py-1 text-[11px] cursor-pointer"
                        title="Undo 1 attended class"
                      >
                        - Attended
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="text-center py-16 clay-card">
              <span className="text-xs font-bold text-[#B7A89A] block uppercase">No subject active</span>
              <p className="text-sm font-black text-[#722f37] mt-2">Select a subject on the left or add a new one.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
