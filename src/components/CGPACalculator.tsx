import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, Semester, Subject } from '../types';
import { Plus, Trash2, ArrowLeft, Save, Check, Calculator, Sparkles } from 'lucide-react';

interface CGPACalculatorProps {
  profile: UserProfile;
  savedSemesters: Semester[];
  onSaveSemester: (semester: Semester) => void;
  onBack: () => void;
}

export default function CGPACalculator({ profile, savedSemesters, onSaveSemester, onBack }: CGPACalculatorProps) {
  const [selectedSemNum, setSelectedSemNum] = useState<number>(profile.currentSemester);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [calculatedSGPA, setCalculatedSGPA] = useState<number | null>(null);
  const [calculatedCredits, setCalculatedCredits] = useState<number>(0);
  const [isSavedSuccessfully, setIsSavedSuccessfully] = useState(false);
  const [inputMode, setInputMode] = useState<'subjects' | 'direct'>('subjects');
  const [directSgpa, setDirectSgpa] = useState<string>('');
  const [directCredits, setDirectCredits] = useState<string>('');

  // Define grades based on GPA scale
  const gradeOptions = profile.gpaScale === 10
    ? [
      { label: 'O (10)', value: 'O', points: 10 },
      { label: 'A+ (9)', value: 'A+', points: 9 },
      { label: 'A (8)', value: 'A', points: 8 },
      { label: 'B+ (7.5)', value: 'B+', points: 7.5 },
      { label: 'B (7)', value: 'B', points: 7 },
      { label: 'C (6)', value: 'C', points: 6 },
      { label: 'D (5)', value: 'D', points: 5 },
      { label: 'F (0)', value: 'F', points: 0 }
    ]
    : [
      { label: 'A (4.0)', value: 'A', points: 4.0 },
      { label: 'A- (3.7)', value: 'A-', points: 3.7 },
      { label: 'B+ (3.3)', value: 'B+', points: 3.3 },
      { label: 'B (3.0)', value: 'B', points: 3.0 },
      { label: 'B- (2.7)', value: 'B-', points: 2.7 },
      { label: 'C+ (2.3)', value: 'C+', points: 2.3 },
      { label: 'C (2.0)', value: 'C', points: 2.0 },
      { label: 'D (1.0)', value: 'D', points: 1.0 },
      { label: 'F (0.0)', value: 'F', points: 0.0 }
    ];

  useEffect(() => {
    const existing = savedSemesters.find(s => s.number === selectedSemNum);
    if (existing) {
      if (existing.subjects && existing.subjects.length > 0) {
        setSubjects(existing.subjects);
        setCalculatedSGPA(existing.sgpa);
        setCalculatedCredits(existing.subjects.reduce((sum, s) => sum + s.credits, 0));
        setInputMode('subjects');
      } else {
        setSubjects([]);
        setCalculatedSGPA(existing.sgpa);
        setCalculatedCredits(existing.totalCredits);
        setDirectSgpa(existing.sgpa.toString());
        setDirectCredits(existing.totalCredits.toString());
        setInputMode('direct');
      }
    } else {
      setSubjects([
        { id: '1', name: 'Mathematics', credits: 4, grade: gradeOptions[0].value, gradePoints: gradeOptions[0].points },
        { id: '2', name: 'Computer Science', credits: 3, grade: gradeOptions[1].value, gradePoints: gradeOptions[1].points },
        { id: '3', name: 'Laboratory', credits: 2, grade: gradeOptions[0].value, gradePoints: gradeOptions[0].points }
      ]);
      setCalculatedSGPA(null);
      setCalculatedCredits(0);
      setInputMode('subjects');
      setDirectSgpa('');
      setDirectCredits('');
    }
    setIsSavedSuccessfully(false);
  }, [selectedSemNum, savedSemesters, profile.gpaScale]);

  const handleAddSubject = () => {
    const newId = Date.now().toString();
    const newSub: Subject = {
      id: newId,
      name: `Course ${subjects.length + 1}`,
      credits: 3,
      grade: gradeOptions[0].value,
      gradePoints: gradeOptions[0].points
    };
    setSubjects([...subjects, newSub]);
    setCalculatedSGPA(null);
  };

  const handleRemoveSubject = (id: string) => {
    setSubjects(subjects.filter(s => s.id !== id));
    setCalculatedSGPA(null);
  };

  const handleUpdateSubject = (id: string, updates: Partial<Subject>) => {
    setSubjects(subjects.map(s => {
      if (s.id === id) {
        let updatedGradePoints = s.gradePoints;
        if (updates.grade) {
          const match = gradeOptions.find(opt => opt.value === updates.grade);
          if (match) updatedGradePoints = match.points;
        }
        return { ...s, ...updates, gradePoints: updatedGradePoints };
      }
      return s;
    }));
    setCalculatedSGPA(null);
  };

  const calculateResults = () => {
    if (inputMode === 'direct') {
      const parsedSgpa = parseFloat(directSgpa);
      const parsedCreds = parseInt(directCredits, 10);
      if (isNaN(parsedSgpa) || isNaN(parsedCreds) || parsedCreds <= 0) {
        alert('Please enter valid SGPA and credit numbers.');
        return;
      }
      setCalculatedSGPA(Math.min(profile.gpaScale, Math.max(0, parsedSgpa)));
      setCalculatedCredits(parsedCreds);
      return;
    }

    if (subjects.length === 0) {
      alert('Please add at least one subject to calculate.');
      return;
    }

    let totalPoints = 0;
    let totalCredits = 0;

    subjects.forEach((sub) => {
      totalPoints += sub.credits * sub.gradePoints;
      totalCredits += sub.credits;
    });

    const sgpa = totalCredits > 0 ? parseFloat((totalPoints / totalCredits).toFixed(2)) : 0;
    setCalculatedSGPA(sgpa);
    setCalculatedCredits(totalCredits);
  };

  const handleSaveSemester = () => {
    if (calculatedSGPA === null) return;
    const sem: Semester = {
      id: `sem-${selectedSemNum}`,
      number: selectedSemNum,
      name: `Semester ${selectedSemNum}`,
      sgpa: calculatedSGPA,
      totalCredits: calculatedCredits,
      subjects: inputMode === 'subjects' ? subjects : []
    };
    onSaveSemester(sem);
    setIsSavedSuccessfully(true);
    alert(`Semester ${selectedSemNum} saved successfully!`);
    setTimeout(() => {
      setIsSavedSuccessfully(false);
    }, 2500);
  };

  return (
    <div id="cgpa-calculator" className="space-y-8 sm:space-y-10 pb-16">
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
            GRADENCE • GRADES
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#722f37]">
            CGPA & SGPA Calculator
          </h1>
        </div>
      </div>

      {/* Semester Selector Card */}
      <div className="clay-card p-6 sm:p-7 space-y-4">
        <span className="text-xs sm:text-sm font-extrabold text-[#722f37] uppercase tracking-wider font-mono block">
          SELECT ACTIVE SEMESTER
        </span>
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => {
            const isSaved = savedSemesters.some(s => s.number === num);
            const isSelected = selectedSemNum === num;
            return (
              <button
                key={num}
                type="button"
                onClick={() => setSelectedSemNum(num)}
                className={`flex-1 min-w-[70px] py-3.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'clay-btn-burgundy'
                    : 'clay-btn-latte'
                }`}
              >
                <span>Sem {num}</span>
                {isSaved && (
                  <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-[#FAF6EE]' : 'bg-[#722f37]'}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Input Mode Toggle */}
      <div className="clay-card !p-2 flex gap-2 max-w-md">
        <button
          type="button"
          onClick={() => { setInputMode('subjects'); setCalculatedSGPA(null); }}
          className={`flex-1 py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
            inputMode === 'subjects' ? 'clay-btn-burgundy' : 'clay-btn-latte'
          }`}
        >
          Subject by Subject
        </button>
        <button
          type="button"
          onClick={() => { setInputMode('direct'); setCalculatedSGPA(null); }}
          className={`flex-1 py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
            inputMode === 'direct' ? 'clay-btn-burgundy' : 'clay-btn-latte'
          }`}
        >
          Direct SGPA Number
        </button>
      </div>

      {inputMode === 'subjects' ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs sm:text-sm font-extrabold text-[#722f37] uppercase tracking-wider font-mono">
              COURSES & GRADES ({subjects.length})
            </span>
            <button
              onClick={handleAddSubject}
              className="clay-btn-burgundy px-4 py-2 text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Course</span>
            </button>
          </div>

          <AnimatePresence initial={false}>
            {subjects.map((sub) => (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="clay-card p-5 sm:p-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4"
              >
                <div className="flex-1 space-y-3 sm:space-y-0 sm:flex sm:items-center gap-5">
                  {/* Subject Name */}
                  <div className="clay-inset p-2.5 px-3.5 flex-1 sm:max-w-xs">
                    <input
                      type="text"
                      value={sub.name}
                      onChange={(e) => handleUpdateSubject(sub.id, { name: e.target.value })}
                      placeholder="Course name"
                      className="w-full bg-transparent text-sm font-bold text-[#722f37] focus:outline-none placeholder:text-[#B7A89A]"
                    />
                  </div>

                  <div className="flex items-center justify-between sm:justify-start gap-5">
                    {/* Credits Stepper */}
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-bold text-[#B7A89A] uppercase">Credits</span>
                      <div className="clay-inset p-1.5 flex items-center rounded-xl">
                        <button
                          type="button"
                          onClick={() => handleUpdateSubject(sub.id, { credits: Math.max(1, sub.credits - 1) })}
                          className="w-8 h-8 rounded-lg bg-[#FAF6EE] text-[#722f37] font-black text-sm flex items-center justify-center hover:bg-[#E8DCC6] cursor-pointer"
                        >
                          -
                        </button>
                        <span className="px-3.5 text-sm font-mono font-black text-[#722f37]">{sub.credits}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateSubject(sub.id, { credits: sub.credits + 1 })}
                          className="w-8 h-8 rounded-lg bg-[#FAF6EE] text-[#722f37] font-black text-sm flex items-center justify-center hover:bg-[#E8DCC6] cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Grade Selector */}
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-bold text-[#B7A89A] uppercase">Grade</span>
                      <div className="clay-inset p-1.5 px-3 rounded-xl">
                        <select
                          value={sub.grade}
                          onChange={(e) => handleUpdateSubject(sub.id, { grade: e.target.value })}
                          className="bg-transparent text-sm font-black text-[#722f37] focus:outline-none cursor-pointer h-8"
                        >
                          {gradeOptions.map(opt => (
                            <option key={opt.value} value={opt.value} className="bg-[#FAF6EE] text-[#722f37]">
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trash Action */}
                <button
                  onClick={() => handleRemoveSubject(sub.id)}
                  disabled={subjects.length <= 1}
                  className="clay-btn-latte !w-10 !h-10 !p-0 !rounded-xl flex items-center justify-center text-red-700 hover:text-red-900 cursor-pointer self-end sm:self-auto shrink-0 disabled:opacity-40"
                  title="Remove Course"
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="clay-card p-6 sm:p-7 space-y-5">
          <p className="text-sm text-[#722f37]/80 font-semibold leading-relaxed">
            Already know your result? Enter your final SGPA and total credits for Semester {selectedSemNum} directly:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#722f37] uppercase tracking-wider block">Semester SGPA</label>
              <div className="clay-inset p-3 px-3.5">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={profile.gpaScale}
                  value={directSgpa}
                  onChange={(e) => { setDirectSgpa(e.target.value); setCalculatedSGPA(null); }}
                  placeholder={`e.g. ${profile.gpaScale === 10 ? '8.5' : '3.8'}`}
                  className="w-full bg-transparent text-base font-bold font-mono text-[#722f37] focus:outline-none"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#722f37] uppercase tracking-wider block">Total Credits</label>
              <div className="clay-inset p-3 px-3.5">
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={directCredits}
                  onChange={(e) => { setDirectCredits(e.target.value); setCalculatedSGPA(null); }}
                  placeholder="e.g. 21"
                  className="w-full bg-transparent text-base font-bold font-mono text-[#722f37] focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calculate & Result Section */}
      <div className="space-y-5">
        <button
          onClick={calculateResults}
          className="clay-btn-burgundy w-full py-4.5 rounded-3xl text-base font-black flex items-center justify-center gap-2.5 cursor-pointer shadow-lg"
        >
          <Calculator className="w-5 h-5 text-[#FAF6EE]" />
          <span>Calculate Semester SGPA</span>
        </button>

        {calculatedSGPA !== null && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="clay-card p-6 sm:p-8 space-y-5 border-2 border-[#722f37]"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-[#B7A89A] uppercase tracking-wider block font-mono">
                  SEMESTER {selectedSemNum} RESULT
                </span>
                <div className="text-4xl sm:text-5xl font-black text-[#722f37] mt-1 font-mono">
                  {calculatedSGPA.toFixed(2)}
                  <span className="text-sm font-bold text-[#B7A89A] ml-2">SGPA</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-[#B7A89A] uppercase tracking-wider block font-mono">
                  CREDITS
                </span>
                <div className="text-2xl sm:text-3xl font-black text-[#722f37] font-mono mt-1">
                  {calculatedCredits}
                </div>
              </div>
            </div>

            <div className="clay-inset p-4.5 rounded-2xl">
              <span className="text-xs font-bold text-[#B7A89A] uppercase tracking-wider block mb-1">
                ACADEMIC PERFORMANCE
              </span>
              <p className="text-sm text-[#722f37] font-medium leading-relaxed">
                {inputMode === 'subjects' 
                  ? <>Calculated across <strong>{subjects.length} courses</strong> for a total of <strong>{calculatedCredits} credits</strong>.</>
                  : <>Directly recorded for an aggregated total of <strong>{calculatedCredits} credits</strong>.</>
                } {calculatedSGPA >= (profile.gpaScale === 10 ? 8.5 : 3.5) ? 'Outstanding performance! Keep it up!' : 'Solid progress!'}
              </p>
            </div>

            <button
              onClick={handleSaveSemester}
              className={`w-full py-4 rounded-2xl text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isSavedSuccessfully
                  ? 'clay-btn-latte !text-emerald-800'
                  : 'clay-btn-burgundy'
              }`}
            >
              {isSavedSuccessfully ? (
                <>
                  <Check className="w-4.5 h-4.5 text-emerald-700" />
                  <span>Semester Saved to History!</span>
                </>
              ) : (
                <>
                  <Save className="w-4.5 h-4.5 text-[#FAF6EE]" />
                  <span>Save to Student History</span>
                </>
              )}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
