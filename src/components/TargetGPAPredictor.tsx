import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../types';
import { ArrowLeft, Sparkles, TrendingUp, AlertTriangle, CheckCircle2, PieChart } from 'lucide-react';

interface TargetGPAPredictorProps {
  profile: UserProfile;
  onBack: () => void;
}

export default function TargetGPAPredictor({ profile, onBack }: TargetGPAPredictorProps) {
  const [currentCgpa, setCurrentCgpa] = useState<string>('8.2');
  const [completedCredits, setCompletedCredits] = useState<string>('60');
  const [targetCgpa, setTargetCgpa] = useState<string>('8.5');
  const [upcomingCredits, setUpcomingCredits] = useState<string>('20');

  const [predictedSgpa, setPredictedSgpa] = useState<number | null>(null);
  const [probabilityText, setProbabilityText] = useState<string>('');
  const [probabilityLevel, setProbabilityLevel] = useState<'high' | 'medium' | 'low' | 'impossible'>('medium');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const [sem5Sgpa, setSem5Sgpa] = useState<number>(8.0);
  const [sem6Sgpa, setSem6Sgpa] = useState<number>(8.0);
  const [sem7Sgpa, setSem7Sgpa] = useState<number>(8.0);
  const [sem8Sgpa, setSem8Sgpa] = useState<number>(8.0);

  const handlePredict = () => {
    setErrorMessage('');
    const curCgpa = parseFloat(currentCgpa);
    const complCreds = parseFloat(completedCredits);
    const tarCgpa = parseFloat(targetCgpa);
    const upCreds = parseFloat(upcomingCredits);

    if (isNaN(curCgpa) || isNaN(complCreds) || isNaN(tarCgpa) || isNaN(upCreds)) {
      setErrorMessage('Please provide valid numbers for all fields.');
      setPredictedSgpa(null);
      return;
    }

    if (curCgpa > profile.gpaScale || tarCgpa > profile.gpaScale || curCgpa < 0 || tarCgpa < 0) {
      setErrorMessage(`GPA cannot exceed ${profile.gpaScale}.0`);
      setPredictedSgpa(null);
      return;
    }

    if (complCreds <= 0 || upCreds <= 0) {
      setErrorMessage('Credits must be greater than zero.');
      setPredictedSgpa(null);
      return;
    }

    const totalCredits = complCreds + upCreds;
    const requiredSgpa = ((tarCgpa * totalCredits) - (curCgpa * complCreds)) / upCreds;

    setPredictedSgpa(parseFloat(requiredSgpa.toFixed(2)));

    if (requiredSgpa > profile.gpaScale) {
      setProbabilityLevel('impossible');
      setProbabilityText('Exceeds maximum achievable grade scale');
    } else if (requiredSgpa <= curCgpa) {
      setProbabilityLevel('high');
      setProbabilityText('Easily attainable (lower than your current CGPA)');
    } else if (profile.gpaScale === 10) {
      if (requiredSgpa <= 7.5) {
        setProbabilityLevel('high');
        setProbabilityText('Very High Probability (Easily attainable with standard passing marks)');
      } else if (requiredSgpa <= 8.5) {
        setProbabilityLevel('high');
        setProbabilityText('High Probability (Achievable with consistent coursework prep)');
      } else if (requiredSgpa <= 9.2) {
        setProbabilityLevel('medium');
        setProbabilityText('Moderate Probability (Requires consistent top grades)');
      } else {
        setProbabilityLevel('low');
        setProbabilityText('Challenging (Requires near-perfect straight A+ grades)');
      }
    } else {
      if (requiredSgpa <= 3.0) {
        setProbabilityLevel('high');
        setProbabilityText('Very High Probability (Comfortably achievable)');
      } else if (requiredSgpa <= 3.5) {
        setProbabilityLevel('high');
        setProbabilityText('High Probability (Requires solid B+ to A grades)');
      } else if (requiredSgpa <= 3.8) {
        setProbabilityLevel('medium');
        setProbabilityText('Moderate Probability (Requires mostly A grades)');
      } else {
        setProbabilityLevel('low');
        setProbabilityText('Challenging (Requires straight 4.0 A grades)');
      }
    }
  };

  return (
    <div id="target-gpa-predictor" className="space-y-8 pb-10">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="clay-btn-latte !w-10 !h-10 !p-0 !rounded-2xl flex items-center justify-center cursor-pointer"
          title="Back to Tools"
        >
          <ArrowLeft className="w-5 h-5 text-[#722f37]" />
        </button>
        <div>
          <div className="clay-badge text-[10px] px-3 py-0.5 inline-block mb-1">
            GRADENCE • GOALS
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#722f37]">
            Target CGPA Planner
          </h1>
        </div>
      </div>

      {/* Simulator Inputs Grid */}
      <div className="clay-card p-6 sm:p-7 space-y-6">
        <div>
          <h3 className="text-sm font-black text-[#722f37] uppercase tracking-wide">
            Your Target Parameters
          </h3>
          <p className="text-xs text-[#722f37]/75 mt-1 font-medium">
            Enter your current CGPA and the target you want to reach to see exactly what semester SGPA you need.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 bg-red-100 border border-red-300 text-red-900 text-xs rounded-2xl flex items-center gap-2 font-bold">
            <AlertTriangle className="w-4 h-4 text-red-700" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="cur-cgpa" className="text-[11px] font-bold text-[#722f37] uppercase">Current CGPA</label>
            <div className="clay-inset p-2 px-3">
              <input
                id="cur-cgpa"
                type="number"
                step="0.01"
                value={currentCgpa}
                onChange={(e) => setCurrentCgpa(e.target.value)}
                className="w-full bg-transparent text-sm font-bold font-mono text-[#722f37] focus:outline-none"
                placeholder="e.g. 8.2"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="completed-credits" className="text-[11px] font-bold text-[#722f37] uppercase">Completed Credits</label>
            <div className="clay-inset p-2 px-3">
              <input
                id="completed-credits"
                type="number"
                value={completedCredits}
                onChange={(e) => setCompletedCredits(e.target.value)}
                className="w-full bg-transparent text-sm font-bold font-mono text-[#722f37] focus:outline-none"
                placeholder="e.g. 60"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="target-cgpa" className="text-[11px] font-bold text-[#722f37] uppercase">Target CGPA Goal</label>
            <div className="clay-inset p-2 px-3">
              <input
                id="target-cgpa"
                type="number"
                step="0.01"
                value={targetCgpa}
                onChange={(e) => setTargetCgpa(e.target.value)}
                className="w-full bg-transparent text-sm font-bold font-mono text-[#722f37] focus:outline-none"
                placeholder="e.g. 8.5"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="upcoming-credits" className="text-[11px] font-bold text-[#722f37] uppercase">Upcoming Semester Credits</label>
            <div className="clay-inset p-2 px-3">
              <input
                id="upcoming-credits"
                type="number"
                value={upcomingCredits}
                onChange={(e) => setUpcomingCredits(e.target.value)}
                className="w-full bg-transparent text-sm font-bold font-mono text-[#722f37] focus:outline-none"
                placeholder="e.g. 20"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handlePredict}
          className="clay-btn-burgundy w-full py-3.5 text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-md"
        >
          <Sparkles className="w-4 h-4 text-[#FAF6EE]" />
          <span>Calculate Required Semester SGPA</span>
        </button>
      </div>

      {/* Result Card */}
      <AnimatePresence>
        {predictedSgpa !== null && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="clay-card p-6 sm:p-7 space-y-5 border-2 border-[#722f37]"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-[#B7A89A] uppercase tracking-wider block font-mono">
                  REQUIRED FUTURE SGPA
                </span>
                <div className="text-4xl sm:text-5xl font-black text-[#722f37] mt-1 font-mono">
                  {predictedSgpa <= 0 ? '0.00' : predictedSgpa}
                  <span className="text-xs font-bold text-[#B7A89A] ml-2 font-sans">SGPA NEEDED</span>
                </div>
              </div>

              <span className={`clay-badge px-3 py-1 text-xs font-bold uppercase ${
                probabilityLevel === 'high' ? '!bg-emerald-700' : probabilityLevel === 'medium' ? '!bg-amber-700' : '!bg-red-800'
              }`}>
                {probabilityLevel} Chance
              </span>
            </div>

            <div className="clay-card !bg-[#FAF6EE] p-4 flex items-start gap-3 border border-[#B7A89A]/40">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black text-[#722f37] uppercase tracking-wide">
                  Analysis
                </h4>
                <p className="text-xs text-[#722f37]/85 leading-relaxed mt-1 font-medium">
                  {probabilityText}. To raise your cumulative score from <strong>{currentCgpa}</strong> to <strong>{targetCgpa}</strong>, you need to score an average of <strong>{predictedSgpa} SGPA</strong> across your upcoming <strong>{upcomingCredits} credits</strong>.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Graduation Projection Simulator */}
      <div className="clay-card p-6 sm:p-7 space-y-5">
        <div>
          <h3 className="text-sm font-black text-[#722f37] uppercase tracking-wide">
            Graduation Simulator & Honors Projection
          </h3>
          <p className="text-xs text-[#722f37]/75 mt-0.5 font-medium">
            Slide future expected semester grades to preview your projected final degree classification.
          </p>
        </div>

        <div className="space-y-3">
          {[
            { sem: 5, val: sem5Sgpa, set: setSem5Sgpa },
            { sem: 6, val: sem6Sgpa, set: setSem6Sgpa },
            { sem: 7, val: sem7Sgpa, set: setSem7Sgpa },
            { sem: 8, val: sem8Sgpa, set: setSem8Sgpa },
          ].map((item) => (
            <div key={item.sem} className="clay-inset p-3.5 rounded-2xl space-y-1">
              <div className="flex justify-between items-center text-xs font-bold text-[#722f37]">
                <span>Semester {item.sem} Projected SGPA</span>
                <span className="clay-badge px-2 py-0.5 text-[10px]">{item.val.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="4"
                max={profile.gpaScale}
                step="0.05"
                value={item.val}
                onChange={(e) => item.set(parseFloat(e.target.value))}
                className="w-full accent-[#722f37] cursor-pointer"
              />
            </div>
          ))}
        </div>

        {(() => {
          const curCgpaNum = parseFloat(currentCgpa) || 0;
          const complCredsNum = parseFloat(completedCredits) || 0;
          const totalSemCredits = 20;
          const totalGradCredits = complCredsNum + (totalSemCredits * 4);
          const estimatedPoints = (curCgpaNum * complCredsNum) +
            ((sem5Sgpa + sem6Sgpa + sem7Sgpa + sem8Sgpa) * totalSemCredits);
          const estimatedGradCGPA = totalGradCredits > 0 ? parseFloat((estimatedPoints / totalGradCredits).toFixed(2)) : 0.0;

          let graduationClass = 'Second Class';
          if (estimatedGradCGPA >= (profile.gpaScale === 10 ? 8.5 : 3.5)) {
            graduationClass = 'First Class with Distinction 🏆';
          } else if (estimatedGradCGPA >= (profile.gpaScale === 10 ? 6.5 : 3.0)) {
            graduationClass = 'First Class 🎓';
          } else if (estimatedGradCGPA >= (profile.gpaScale === 10 ? 5.0 : 2.0)) {
            graduationClass = 'Second Class 📁';
          } else {
            graduationClass = 'Pass Class 📋';
          }

          return (
            <div className="clay-card !bg-[#FAF6EE] p-4 space-y-2 border border-[#B7A89A]/40">
              <div className="flex justify-between items-center text-xs font-bold text-[#722f37]">
                <span>PROJECTED FINAL GRADUATION CGPA</span>
                <span className="text-xl font-black font-mono text-[#722f37]">{estimatedGradCGPA.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-[#722f37] border-t border-[#B7A89A]/30 pt-2">
                <span>ESTIMATED DEGREE HONORS</span>
                <span className="text-[#722f37] font-black">{graduationClass}</span>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
