import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Exam } from '../types';
import { ArrowLeft, Calendar, Plus, Clock, CheckCircle, Trash2 } from 'lucide-react';

interface ExamPlannerProps {
  savedExams: Exam[];
  onSaveExams: (exams: Exam[]) => void;
  onBack: () => void;
}

export default function ExamPlanner({ savedExams, onSaveExams, onBack }: ExamPlannerProps) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);

  const [subName, setSubName] = useState('');
  const [examDate, setExamDate] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');

  // Load and sort exams by date
  useEffect(() => {
    if (savedExams) {
      const sorted = [...savedExams].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setExams(sorted);
    }
  }, [savedExams]);

  const handleAddExam = () => {
    if (!subName.trim() || !examDate) return;
    const newExam: Exam = {
      id: `exam-${Date.now()}`,
      subject: subName.trim(),
      date: examDate,
      priority
    };
    const updated = [...exams, newExam].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setExams(updated);
    onSaveExams(updated);

    // Reset Form
    setSubName('');
    setExamDate('');
    setPriority('medium');
    setIsAddFormOpen(false);
  };

  const handleRemoveExam = (id: string) => {
    const updated = exams.filter(e => e.id !== id);
    setExams(updated);
    onSaveExams(updated);
  };

  const getDaysRemaining = (dateString: string) => {
    const examTime = new Date(dateString).getTime();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = examTime - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div id="exam-planner" className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
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
              GRADENCE • SCHEDULE
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#722f37]">
              Exam & Test Countdown
            </h1>
          </div>
        </div>

        {exams.length > 0 && (
          <button
            onClick={() => setIsAddFormOpen(!isAddFormOpen)}
            className="clay-btn-burgundy px-4 py-2 text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Exam</span>
          </button>
        )}
      </div>

      {/* Add Exam Form Drawer */}
      <AnimatePresence>
        {isAddFormOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="clay-card p-6 space-y-4 border-2 border-[#B7A89A]"
          >
            <span className="text-xs font-bold text-[#722f37] uppercase tracking-wider font-mono block">
              SCHEDULE UPCOMING EXAM
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="new-exam-sub" className="text-[11px] font-bold text-[#722f37] uppercase">Subject / Course Name</label>
                <div className="clay-inset p-2 px-3">
                  <input
                    id="new-exam-sub"
                    type="text"
                    value={subName}
                    onChange={(e) => setSubName(e.target.value)}
                    placeholder="e.g. Database Management Systems"
                    className="w-full bg-transparent text-xs font-semibold text-[#722f37] focus:outline-none placeholder:text-[#B7A89A]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="new-exam-date" className="text-[11px] font-bold text-[#722f37] uppercase">Exam Date</label>
                <div className="clay-inset p-2 px-3">
                  <input
                    id="new-exam-date"
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full bg-transparent text-xs font-bold text-[#722f37] focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#722f37] uppercase block mb-1">Priority</label>
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-2 text-xs font-bold rounded-2xl transition-all cursor-pointer ${
                      priority === p
                        ? 'clay-btn-burgundy'
                        : 'clay-btn-latte'
                    }`}
                  >
                    {p.toUpperCase()} PRIORITY
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleAddExam}
                className="clay-btn-burgundy flex-1 py-3 text-xs font-bold cursor-pointer"
              >
                Save Exam Schedule
              </button>
              <button
                onClick={() => setIsAddFormOpen(false)}
                className="clay-btn-latte px-5 py-3 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Timeline View */}
      {exams.length === 0 ? (
        <div className="clay-card p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-[#FAF6EE] border border-[#B7A89A]/40 flex items-center justify-center mx-auto shadow-inner text-[#722f37]">
            <Calendar className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-[#722f37]">No upcoming exams scheduled.</h3>
            <p className="text-xs text-[#722f37]/75 font-medium max-w-sm mx-auto">
              Add your midterms, finals, or assignment deadlines to keep track of remaining study days.
            </p>
          </div>
          <button
            onClick={() => setIsAddFormOpen(true)}
            className="clay-btn-burgundy px-6 py-2.5 text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Exam</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {exams.map((exam, idx) => {
            const daysLeft = getDaysRemaining(exam.date);
            const isCritical = daysLeft <= 3 && daysLeft >= 0;
            const isPassed = daysLeft < 0;

            return (
              <motion.div
                key={exam.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="clay-card p-5 space-y-3"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-[#722f37]">
                      {exam.subject}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#722f37]/75">
                      <Calendar className="w-3.5 h-3.5 text-[#B7A89A]" />
                      <span>
                        {new Date(exam.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveExam(exam.id)}
                    className="clay-btn-latte !w-8 !h-8 !p-0 !rounded-xl flex items-center justify-center text-red-700 hover:text-red-900 cursor-pointer"
                    title="Delete Exam"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#B7A89A]/30">
                  <span className={`clay-badge px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                    exam.priority === 'high' ? '!bg-red-800 text-white' : exam.priority === 'medium' ? '!bg-amber-800 text-white' : ''
                  }`}>
                    {exam.priority} Priority
                  </span>

                  <div className="flex items-center gap-1.5 text-xs font-black">
                    <Clock className="w-3.5 h-3.5 text-[#B7A89A]" />
                    {isPassed ? (
                      <span className="text-[#B7A89A] flex items-center gap-1 font-bold">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-700" /> Completed
                      </span>
                    ) : daysLeft === 0 ? (
                      <span className="text-red-700 font-extrabold uppercase animate-pulse">
                        Today!
                      </span>
                    ) : daysLeft === 1 ? (
                      <span className="text-amber-800 font-extrabold uppercase">
                        Tomorrow!
                      </span>
                    ) : (
                      <span className={`font-mono ${isCritical ? 'text-red-700 font-black' : 'text-[#722f37]'}`}>
                        {daysLeft} Days Remaining
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
