import { useState, useEffect, useRef, Fragment, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, Semester, AttendanceSubject, RoadmapStage } from '../types';
import { askGroq, ChatMessage, calculateHeuristicScore, extractScore } from '../services/ai';
import { useGradence } from '../context/GradenceContext';
import {
  Sparkles,
  Send,
  UserCheck,
  BookOpen,
  Compass,
  FileText,
  User,
  Zap,
  Map,
  Copy,
  Check,
  Award,
  HeartHandshake
} from 'lucide-react';
import ATSScorer from './ATSScorer';

interface AISpaceProps {
  profile: UserProfile;
  semesters: Semester[];
  attendanceSubjects: AttendanceSubject[];
  onNavigateToTool?: (tool: any) => void;
}

function parseInline(text: string, isUser = false) {
  // Handle <br> tags cleanly
  const brParts = text.split(/<br\s*\/?>/gi);
  return brParts.map((brPart, bIdx) => (
    <Fragment key={bIdx}>
      {bIdx > 0 && <br />}
      {brPart.split(/\*\*([^*]+)\*\*/g).map((part, idx) => {
        if (idx % 2 === 1) {
          return (
            <strong
              key={idx}
              className={`font-extrabold ${isUser ? 'text-white' : 'text-[#722f37]'}`}
            >
              {part}
            </strong>
          );
        }
        return part;
      })}
    </Fragment>
  ));
}

function parseMarkdown(text: string, isUser = false) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements: ReactNode[] = [];
  let i = 0;

  const isTableRow = (l: string) => {
    const t = l.trim();
    return t.startsWith('|') && t.includes('|');
  };
  const isTableSeparator = (l: string) => {
    const t = l.trim();
    return /^\|?(\s*[-:]+\s*\|?)+$/.test(t) && t.includes('-');
  };
  const parseCells = (rowStr: string) => {
    let clean = rowStr.trim();
    if (clean.startsWith('|')) clean = clean.substring(1);
    if (clean.endsWith('|')) clean = clean.substring(0, clean.length - 1);
    return clean.split('|').map(c => c.trim());
  };

  while (i < lines.length) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // 1. Table Detection
    if (isTableRow(trimmed)) {
      const tableLines: string[] = [];
      while (i < lines.length && isTableRow(lines[i])) {
        tableLines.push(lines[i].trim());
        i++;
      }

      const rows = tableLines.filter(line => !isTableSeparator(line));

      if (rows.length > 0) {
        const headerCells = parseCells(rows[0]);
        const bodyRows = rows.slice(1).map(r => parseCells(r));

        elements.push(
          <div key={`table-${i}`} className="my-3.5 overflow-x-auto rounded-2xl border border-[#B7A89A]/40 shadow-sm bg-white">
            <table className="w-full text-left text-xs sm:text-[13px] border-collapse min-w-[320px]">
              <thead>
                <tr className="bg-[#722f37] text-[#FAF6EE]">
                  {headerCells.map((cell, cIdx) => (
                    <th key={cIdx} className="px-3.5 py-2.5 font-bold tracking-wide border-b border-[#8C3A45] whitespace-nowrap">
                      {parseInline(cell, false)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#B7A89A]/20">
                {bodyRows.map((row, rIdx) => (
                  <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-[#FAF6EE]' : 'bg-[#FAF6EE]/50 hover:bg-[#F3EDE2] transition-colors'}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3.5 py-2.5 text-[#722f37] font-medium align-top leading-relaxed">
                        {parseInline(cell, false)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    }

    // 2. Horizontal divider
    if (trimmed === '---' || trimmed === '***') {
      elements.push(<hr key={`hr-${i}`} className="my-3 border-t border-[#B7A89A]/40" />);
      i++;
      continue;
    }

    // 3. Blockquote
    if (trimmed.startsWith('> ')) {
      elements.push(
        <div key={`quote-${i}`} className="my-2 p-3 rounded-2xl bg-[#722f37]/10 border-l-4 border-[#722f37] text-xs font-semibold text-[#722f37] italic">
          {parseInline(trimmed.substring(2), isUser)}
        </div>
      );
      i++;
      continue;
    }

    // 4. Headings
    if (trimmed.startsWith('## ')) {
      elements.push(
        <h2 key={`h2-${i}`} className={`text-base sm:text-lg font-black mt-4 mb-1.5 ${isUser ? 'text-white' : 'text-[#722f37]'}`}>
          {parseInline(trimmed.replace('## ', ''), isUser)}
        </h2>
      );
      i++;
      continue;
    }

    if (trimmed.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${i}`} className={`text-sm sm:text-base font-extrabold mt-3.5 mb-1.5 ${isUser ? 'text-white' : 'text-[#722f37]'}`}>
          {parseInline(trimmed.replace('### ', ''), isUser)}
        </h3>
      );
      i++;
      continue;
    }

    if (trimmed.startsWith('#### ')) {
      elements.push(
        <h4 key={`h4-${i}`} className={`text-xs sm:text-sm font-bold mt-2.5 mb-1 ${isUser ? 'text-[#FAF6EE]' : 'text-[#722f37]'}`}>
          {parseInline(trimmed.replace('#### ', ''), isUser)}
        </h4>
      );
      i++;
      continue;
    }

    // 5. Lists (unordered or numbered)
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      elements.push(
        <li key={`li-${i}`} className={`ml-4 list-disc my-1 ${isUser ? 'text-[#FAF6EE]/95' : 'text-[#722f37]/90'}`}>
          {parseInline(trimmed.substring(2), isUser)}
        </li>
      );
      i++;
      continue;
    }

    if (/^\d+\.\s/.test(trimmed)) {
      elements.push(
        <li key={`oli-${i}`} className={`ml-4 list-decimal my-1 ${isUser ? 'text-[#FAF6EE]/95' : 'text-[#722f37]/90'}`}>
          {parseInline(trimmed.replace(/^\d+\.\s*/, ''), isUser)}
        </li>
      );
      i++;
      continue;
    }

    // 6. Regular paragraphs
    if (trimmed.length > 0) {
      elements.push(
        <p key={`p-${i}`} className={`min-h-[1em] ${isUser ? 'text-[#FAF6EE]' : 'text-[#722f37]'}`}>
          {parseInline(rawLine, isUser)}
        </p>
      );
    }

    i++;
  }

  return (
    <div className={`space-y-1.5 text-sm sm:text-[14px] leading-relaxed ${isUser ? 'text-[#FAF6EE]' : 'text-[#722f37]'}`}>
      {elements}
    </div>
  );
}

export default function AISpace({ profile, semesters, attendanceSubjects, onNavigateToTool }: AISpaceProps) {
  const { roadmaps, saveRoadmaps } = useGradence();
  const [activeModule, setActiveModule] = useState<'chat' | 'placement' | 'career' | 'ats'>('chat');
  const [userInput, setUserInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { role: 'assistant', content: `Hello, **${profile.name || 'Scholar'}**! I am your ASCENDANT AI Study Companion. Ask me anything about improving your grades, planning exams, attendance tips, or career preparation!` }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lastMessage = chatHistory[chatHistory.length - 1];
    if (lastMessage && (lastMessage.role === 'user' || isLoading)) {
      messagesContainerRef.current?.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [chatHistory, isLoading]);

  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopyWholeChat = () => {
    const formattedChat = chatHistory
      .map(msg => {
        const sender = msg.role === 'user' ? 'Student' : 'ASCENDANT AI Companion';
        return `[${sender}]:\n${msg.content}\n`;
      })
      .join('\n---\n\n');

    navigator.clipboard.writeText(formattedChat)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy chat: ', err);
      });
  };

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopySingleMessage = (content: string, index: number) => {
    navigator.clipboard.writeText(content)
      .then(() => {
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
      })
      .catch(err => {
        console.error('Failed to copy message: ', err);
      });
  };

  const [copiedPlacement, setCopiedPlacement] = useState(false);
  const handleCopyPlacementFeedback = () => {
    let header = 'Placement Feedback';
    if (placementTab === 'skills') header = 'Skills Alignment Feedback';
    else if (placementTab === 'project') header = 'Project Ideas & Tech Stack Feedback';
    else if (placementTab === 'resume') header = 'Resume Audit Feedback';

    const scoreString = placementTab === 'resume' ? ` (Score: ${placementScore}/100)` : '';
    const textToCopy = `${header}${scoreString}\n\n${placementFeedback}`;
    
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        setCopiedPlacement(true);
        setTimeout(() => setCopiedPlacement(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };

  const [copiedRoadmap, setCopiedRoadmap] = useState(false);
  const handleCopyRoadmap = () => {
    const textToCopy = `AI Career Roadmap - ${careerGoal}\n\n${roadmapResult}`;
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        setCopiedRoadmap(true);
        setTimeout(() => setCopiedRoadmap(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy roadmap: ', err);
      });
  };

  // Resume & Placement states
  const [resumeText, setResumeText] = useState('');
  const [placementScore, setPlacementScore] = useState<number | null>(null);
  const [placementFeedback, setPlacementFeedback] = useState('');
  const [placementTab, setPlacementTab] = useState<'skills' | 'project' | 'resume'>('skills');

  // Custom Roadmap states
  const [careerGoal, setCareerGoal] = useState('Full Stack Software Engineer');
  const [roadmapResult, setRoadmapResult] = useState('');

  const handleFollowRoadmap = () => {
    try {
      const activeCount = roadmaps.filter(rm => !rm.isCompleted).length;
      if (activeCount >= 4) {
        alert('You can track at most 4 active roadmaps at a time. Please mark one complete or delete an older one.');
        return;
      }

      const lines = roadmapResult.split('\n');
      const parsedStages: RoadmapStage[] = [];
      let currentParent: RoadmapStage | null = null;
      let stageCount = 1;
      let subCount = 1;

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        const isHeader = trimmed.startsWith('#');
        const isNumbered = /^\d+\.\s+/.test(trimmed);
        const isBullet = trimmed.startsWith('*') || trimmed.startsWith('-');

        if (isHeader || isNumbered) {
          let name = trimmed
            .replace(/^#+\s*/, '')
            .replace(/^\d+\.\s*/, '')
            .replace(/\*\*?/g, '')
            .trim();

          if (name.endsWith(':')) {
            name = name.slice(0, -1).trim();
          }

          const lowerName = name.toLowerCase();
          if (
            lowerName === 'skill roadmap' ||
            lowerName === 'skills roadmap' ||
            lowerName === 'action plan' ||
            lowerName === 'career roadmap' ||
            lowerName === 'roadmap'
          ) {
            continue;
          }

          if (name.length > 2 && name.length < 120) {
            currentParent = {
              id: `st-${stageCount++}`,
              name: name,
              completed: false,
              subStages: []
            };
            parsedStages.push(currentParent);
          }
        } else if (isBullet && currentParent) {
          const subName = trimmed
            .replace(/^[\*\-\s]+/, '')
            .replace(/\*\*?/g, '')
            .trim();

          if (subName.length > 2 && subName.length < 200) {
            currentParent.subStages = currentParent.subStages || [];
            currentParent.subStages.push({
              id: `${currentParent.id}-sub-${subCount++}`,
              name: subName,
              completed: false
            });
          }
        }
      }

      const finalStages = parsedStages.length > 0 ? parsedStages : [
        { id: 'st-1', name: 'Stage 1: Core Fundamentals (Learn syntax and fundamental principles)', completed: false },
        { id: 'st-2', name: 'Stage 2: Hands-on Projects (Build and deploy full applications)', completed: false },
        { id: 'st-3', name: 'Stage 3: Interview Preparation (Practice problem-solving and mock interviews)', completed: false },
      ];

      const newRm = {
        id: `rm-${Date.now()}`,
        title: careerGoal || 'Custom Specialist',
        targetRole: careerGoal,
        stages: finalStages,
        isCompleted: false,
        createdAt: new Date().toISOString()
      };

      const updated = [...roadmaps, newRm];
      saveRoadmaps(updated);
      if (onNavigateToTool) {
        onNavigateToTool('roadmaps');
      } else {
        alert(`Now following: "${careerGoal}". You can view and tick off your stages under Tools > Career Roadmaps.`);
      }
    } catch (e) {
      console.error('Follow roadmap failed', e);
    }
  };

  const apiKey = profile.groqApiKey || localStorage.getItem('ascendant_groq_api_key') || localStorage.getItem('gradence_groq_api_key') || '';

  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: userInput };
    const updatedHistory = [...chatHistory, userMsg];
    setChatHistory(updatedHistory);
    setUserInput('');
    setIsLoading(true);

    const contextPrompt = `
      Current Student Context:
      Name: ${profile.name}
      University: ${profile.university}
      Semester: ${profile.currentSemester}
      GPA Scale: ${profile.gpaScale}
      Current Semesters Data: ${JSON.stringify(semesters)}
      Current Attendance Data: ${JSON.stringify(attendanceSubjects)}
    `;

    const historyForModel = updatedHistory
      .filter(m => m.content && !m.content.includes('[System Connection Error]'))
      .filter((m, idx) => !(idx === 0 && m.role === 'assistant'));

    const messagesToSend: ChatMessage[] = [
      { role: 'system', content: `You are ASCENDANT, a friendly, supportive, and clear Academic Companion for college students. Answer with empathy, structured markdown, and clear practical steps. ${contextPrompt}` },
      ...historyForModel
    ];

    const response = await askGroq(messagesToSend, apiKey);
    setChatHistory([...updatedHistory, { role: 'assistant', content: response }]);
    setIsLoading(false);
  };

  const handleAnalyzePlacement = async () => {
    if (!resumeText.trim()) return;
    setIsLoading(true);

    let systemPrompt = '';
    if (placementTab === 'skills') {
      systemPrompt = `You are the ASCENDANT Career & Skills Advisor.
Analyze the student's technical skills list for job and placement readiness.
Suggest relevant entry-level positions and recommend key complementary skills they should learn next.
Keep the advice friendly, clear, and structured with markdown (under 140 words).
End with a realistic compatibility score in format: "SCORE: X" (e.g. SCORE: 75).`;
    } else if (placementTab === 'project') {
      systemPrompt = `You are the ASCENDANT Project Mentor.
Analyze the student's project idea.
Recommend a modern beginner-to-intermediate tech stack (Frontend, Backend, Database).
Provide a clear 3-step build plan.
Keep the response clear and structured with markdown (under 140 words).
End with a realistic feasibility score in format: "SCORE: X" (e.g. SCORE: 75).`;
    } else {
      systemPrompt = `You are the ASCENDANT Resume Helper.
Review the student's resume points.
Identify what can be phrased more clearly with measurable results (e.g. improved speed, number of users).
Give 2 actionable rewrite examples.
Keep the advice encouraging and clear (under 140 words).
End with a score in format: "SCORE: X" (e.g. SCORE: 75).`;
    }

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `PlacementTab: ${placementTab}\nInput: ${resumeText}\nUniversity: ${profile.university}` }
    ];

    const response = await askGroq(messages, apiKey);

    let parsedScore = extractScore(response);
    if (parsedScore === 75 && !response.includes('75')) {
      parsedScore = calculateHeuristicScore(resumeText);
    }

    const cleanFeedback = response.replace(/\bSCORE:\s*\d+\b/g, '').trim();

    setPlacementFeedback(cleanFeedback);
    setPlacementScore(parsedScore);
    setIsLoading(false);
  };

  const handleGenerateRoadmap = async () => {
    setIsLoading(true);
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are an encouraging student career advisor. Generate a step-by-step learning roadmap for the student\'s desired role. Structure with clear phases (e.g. "Phase 1: Fundamentals", "Phase 2: Projects", "Phase 3: Interview Prep") with bullet points. Include key tools, practical project ideas, and free learning certifications. Keep language simple, practical, and highly motivating.'
      },
      {
        role: 'user',
        content: `Target Role: ${careerGoal}. Current Semester: ${profile.currentSemester}`
      }
    ];

    const response = await askGroq(messages, apiKey);
    setRoadmapResult(response);
    setIsLoading(false);
  };

  const calculateCGPA = () => {
    if (semesters.length === 0) return 0.0;
    const totalSGPACredits = semesters.reduce((sum, sem) => sum + (sem.sgpa * sem.totalCredits), 0);
    const totalCredits = semesters.reduce((sum, sem) => sum + sem.totalCredits, 0);
    return totalCredits === 0 ? 0.0 : parseFloat((totalSGPACredits / totalCredits).toFixed(2));
  };
  const currentCGPA = calculateCGPA();
  const healthScore = Math.min(100, Math.round((currentCGPA / profile.gpaScale) * 100));

  return (
    <div id="ai-space" className="space-y-8 sm:space-y-10 pb-16">
      {/* Top Banner */}
      <div>
        <div className="clay-badge text-xs px-4 py-1.5 mb-2.5 inline-flex items-center gap-2 font-bold">
          <Sparkles className="w-4 h-4 text-[#FAF6EE]" />
          <span>GRADENCE • AI STUDY COMPANION</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#FAF6EE] leading-tight">
          Your Personal AI Study Helper
        </h1>
        <p className="text-sm sm:text-base text-[#E8DCC6]/85 mt-2 font-medium max-w-2xl leading-relaxed">
          Ask questions about your courses, homework concepts, study plans, or placement preparation.
        </p>
      </div>

      {/* Study Pulse Card */}
      <div className="clay-card p-6 sm:p-8 space-y-5">
        <div className="flex justify-between items-center pb-3 border-b border-[#B7A89A]/30">
          <div className="flex items-center gap-2.5">
            <Zap className="w-5 h-5 text-[#722f37]" />
            <h3 className="text-sm sm:text-base font-extrabold text-[#722f37] uppercase tracking-wider font-mono">
              YOUR STUDY PULSE
            </h3>
          </div>
          <span className="text-xs font-bold text-[#B7A89A]">SYNCHRONIZED WITH YOUR GRADES</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          <div className="clay-inset p-5 space-y-2">
            <span className="text-xs font-bold text-[#722f37]/80 uppercase block">ACADEMIC HEALTH</span>
            <span className="text-3xl sm:text-4xl font-black text-[#722f37] block">{healthScore}%</span>
            <div className="w-full bg-[#FAF6EE] h-2 rounded-full overflow-hidden border border-[#B7A89A]/40 mt-1">
              <div className="bg-[#722f37] h-full rounded-full" style={{ width: `${healthScore}%` }} />
            </div>
          </div>

          <div className="clay-inset p-5 space-y-2">
            <span className="text-xs font-bold text-[#722f37]/80 uppercase block">CAREER READINESS</span>
            <span className="text-3xl sm:text-4xl font-black text-[#722f37] block">
              {placementScore ? `${placementScore}%` : '68%'}
            </span>
            <div className="w-full bg-[#FAF6EE] h-2 rounded-full overflow-hidden border border-[#B7A89A]/40 mt-1">
              <div className="bg-[#722f37] h-full rounded-full" style={{ width: `${placementScore || 68}%` }} />
            </div>
          </div>

          <div className="clay-inset p-5 space-y-2">
            <span className="text-xs font-bold text-[#722f37]/80 uppercase block">SEMESTER SUCCESS INDEX</span>
            <span className="text-3xl sm:text-4xl font-black text-[#722f37] block">91.4%</span>
            <div className="w-full bg-[#FAF6EE] h-2 rounded-full overflow-hidden border border-[#B7A89A]/40 mt-1">
              <div className="bg-[#722f37] h-full rounded-full" style={{ width: '91.4%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Module Selector Tabs */}
      <div className="clay-card !p-2 flex gap-2">
        {[
          { id: 'chat', label: 'Study Chat', icon: BookOpen },
          { id: 'placement', label: 'Job & Skills Prep', icon: UserCheck },
          { id: 'career', label: 'Career Roadmaps', icon: Compass },
          { id: 'ats', label: 'Resume ATS Score', icon: Sparkles },
        ].map((mod) => {
          const Icon = mod.icon;
          const isActive = activeModule === mod.id;
          return (
            <button
              key={mod.id}
              onClick={() => setActiveModule(mod.id as any)}
              className={`flex-1 py-3.5 px-3 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                isActive
                  ? 'clay-btn-burgundy'
                  : 'clay-btn-latte'
              }`}
            >
              <Icon className="w-4.5 h-4.5 shrink-0" />
              <span className="hidden sm:inline">{mod.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Module Content Card */}
      <div className="clay-card p-6 sm:p-8 min-h-[480px] flex flex-col">

        {/* Chat Module */}
        {activeModule === 'chat' && (
          <div className="flex flex-col flex-1">
            <div className="flex justify-between items-center mb-5 pb-3.5 border-b border-[#B7A89A]/30">
              <div className="flex items-center gap-2.5">
                <HeartHandshake className="w-5 h-5 text-[#722f37]" />
                <span className="text-sm sm:text-base font-extrabold text-[#722f37] uppercase tracking-wide">
                  Friendly Study Tutor Chat
                </span>
              </div>
              {chatHistory.length > 1 && (
                <button
                  onClick={handleCopyWholeChat}
                  className="clay-btn-latte py-2 px-3.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {copySuccess ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
                  <span>{copySuccess ? 'Copied!' : 'Copy Chat'}</span>
                </button>
              )}
            </div>

            <div ref={messagesContainerRef} className="h-[440px] sm:h-[480px] overflow-y-auto space-y-5 pr-2 scrollbar-none">
              {chatHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3.5 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                    msg.role === 'user' ? 'bg-[#722f37] text-[#FAF6EE]' : 'bg-[#FAF6EE] text-[#722f37] border border-[#B7A89A]/40'
                  }`}>
                    {msg.role === 'user' ? <User className="w-4.5 h-4.5" /> : <Sparkles className="w-4.5 h-4.5" />}
                  </div>
                  <div className={`p-4 sm:p-5 rounded-[22px] relative group shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-[#722f37] text-[#FAF6EE]'
                      : 'bg-[#FAF6EE] border border-[#B7A89A]/40 text-[#722f37]'
                  }`}>
                    <div className="pr-6">
                      {parseMarkdown(msg.content, msg.role === 'user')}
                    </div>
                    <button
                      onClick={() => handleCopySingleMessage(msg.content, idx)}
                      className={`absolute top-2.5 right-2.5 p-1 cursor-pointer transition-colors ${
                        msg.role === 'user'
                          ? 'text-[#FAF6EE]/60 hover:text-white'
                          : 'text-[#B7A89A] hover:text-[#722f37]'
                      }`}
                      title="Copy text"
                    >
                      {copiedIndex === idx ? (
                        <Check className={`w-4 h-4 ${msg.role === 'user' ? 'text-emerald-300' : 'text-emerald-700'}`} />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3.5 max-w-[85%]">
                  <div className="w-9 h-9 rounded-full bg-[#FAF6EE] border border-[#B7A89A]/40 flex items-center justify-center text-[#722f37]">
                    <Sparkles className="w-4.5 h-4.5 animate-spin" />
                  </div>
                  <div className="p-4.5 rounded-[22px] bg-[#FAF6EE] border border-[#B7A89A]/40 text-sm text-[#722f37] font-semibold">
                    ASCENDANT is preparing an easy-to-understand explanation...
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-4.5 mt-4 border-t border-[#B7A89A]/30">
              <div className="clay-inset flex-1 min-w-0 px-4.5 py-3.5 flex items-center">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask: 'How do I raise my CGPA?' or 'Explain concepts simply'"
                  className="w-full bg-transparent text-sm sm:text-base font-semibold text-[#722f37] focus:outline-none placeholder:text-[#B7A89A] placeholder:text-sm"
                />
              </div>
              <button
                onClick={handleSendMessage}
                className="clay-btn-burgundy w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center cursor-pointer shadow-md active:scale-95 transition-transform"
                title="Send message"
              >
                <Send className="w-5 h-5 text-[#FAF6EE]" />
              </button>
            </div>
          </div>
        )}

        {/* Placement Readiness Module */}
        {activeModule === 'placement' && (() => {
          const tabConfig = {
            skills: {
              title: "SKILLS COMPATIBILITY CHECK",
              desc: "Paste the technical skills you have learned to see which entry-level job roles fit your strengths.",
              placeholder: "e.g., Python, SQL, HTML, CSS, JavaScript, React basics...",
              btnLabel: "Check Skills Alignment",
              scoreLabel: "COMPATIBILITY SCORE"
            },
            project: {
              title: "PROJECT ROADMAP & TECH STACK",
              desc: "Describe a project idea you want to build for your resume or coursework.",
              placeholder: "e.g., A student budget tracker app that sends weekly email summaries...",
              btnLabel: "Generate Project Build Steps",
              scoreLabel: "PROJECT SCOPE SCORE"
            },
            resume: {
              title: "RESUME BULLET POINT IMPROVER",
              desc: "Paste bullet points from your resume to make them stronger, clearer, and more impactful.",
              placeholder: "e.g., Created student club website. Managed database and added members...",
              btnLabel: "Review & Improve Points",
              scoreLabel: "RESUME IMPACT SCORE"
            }
          }[placementTab];

          return (
            <div className="space-y-6 sm:space-y-7">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div>
                  <h3 className="text-base font-extrabold text-[#722f37] uppercase tracking-wide">Job & Interview Preparation</h3>
                  <p className="text-xs sm:text-sm text-[#722f37]/70 mt-0.5">Select a tool to audit your skills, projects, or resume points.</p>
                </div>

                <div className="clay-card !p-1.5 flex gap-1.5">
                  {[
                    { id: 'skills', label: 'Skills' },
                    { id: 'project', label: 'Project Idea' },
                    { id: 'resume', label: 'Resume Check' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setPlacementTab(tab.id as any);
                        setPlacementFeedback('');
                        setPlacementScore(null);
                        setResumeText('');
                      }}
                      className={`py-2 px-3.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                        placementTab === tab.id ? 'clay-btn-burgundy' : 'clay-btn-latte'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 space-y-2.5">
                <span className="text-xs font-bold text-[#B7A89A] uppercase tracking-wider block">
                  {tabConfig.title}
                </span>
                <p className="text-xs sm:text-sm text-[#722f37]/80">{tabConfig.desc}</p>

                <div className="clay-inset p-4">
                  <textarea
                    rows={6}
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    placeholder={tabConfig.placeholder}
                    className="w-full bg-transparent text-sm text-[#722f37] font-medium focus:outline-none placeholder:text-[#B7A89A] placeholder:text-sm leading-relaxed"
                  />
                </div>
              </div>

              <button
                onClick={handleAnalyzePlacement}
                disabled={isLoading || !resumeText.trim()}
                className="clay-btn-burgundy w-full py-4 text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <FileText className="w-4.5 h-4.5 text-[#FAF6EE]" />
                <span>{tabConfig.btnLabel}</span>
              </button>

              {placementFeedback && (
                <div className="clay-card !bg-[#FAF6EE] p-6 space-y-4 border border-[#B7A89A]/40">
                  <div className="flex justify-between items-center pb-3 border-b border-[#B7A89A]/30">
                    <span className="text-sm font-bold text-[#722f37]">Feedback & Advice</span>
                    <button
                      onClick={handleCopyPlacementFeedback}
                      className="clay-btn-latte py-1.5 px-3 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedPlacement ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedPlacement ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>

                  {placementTab === 'resume' && (
                    <div className="flex justify-between items-center pb-3 border-b border-[#B7A89A]/30">
                      <span className="text-sm font-bold text-[#722f37]">{tabConfig.scoreLabel}</span>
                      <span className="text-2xl font-black text-[#722f37]">{placementScore}/100</span>
                    </div>
                  )}

                  <div className="text-sm leading-relaxed text-[#722f37]/90 pt-1">
                    {parseMarkdown(placementFeedback)}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Career Roadmaps Module */}
        {activeModule === 'career' && (
          <div className="space-y-6 sm:space-y-7">
            <div>
              <h3 className="text-base font-extrabold text-[#722f37] uppercase tracking-wide">Generate Career Roadmap</h3>
              <p className="text-xs sm:text-sm text-[#722f37]/70 mt-0.5">Tell the AI what dream role you want, and get a clear semester-by-semester learning roadmap.</p>
            </div>

            <div className="flex gap-3">
              <div className="clay-inset flex-1 px-4 py-3">
                <input
                  type="text"
                  value={careerGoal}
                  onChange={(e) => setCareerGoal(e.target.value)}
                  placeholder="e.g. Cloud Engineer, Data Analyst, App Developer"
                  className="w-full bg-transparent text-sm font-semibold text-[#722f37] focus:outline-none placeholder:text-[#B7A89A] placeholder:text-sm"
                />
              </div>
              <button
                onClick={handleGenerateRoadmap}
                className="clay-btn-burgundy px-6 py-3 text-sm font-bold cursor-pointer"
              >
                Create Roadmap
              </button>
            </div>

            {isLoading && !roadmapResult && (
              <div className="text-center py-10 text-sm text-[#722f37]/70 font-semibold animate-pulse">
                Building your comprehensive study roadmap and milestone list...
              </div>
            )}

            {roadmapResult && (
              <div className="space-y-5">
                <div className="flex justify-between items-center pb-3 border-b border-[#B7A89A]/30">
                  <span className="text-sm font-bold text-[#722f37]">Roadmap Stages</span>
                  <button
                    onClick={handleCopyRoadmap}
                    className="clay-btn-latte py-1.5 px-3 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedRoadmap ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedRoadmap ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>

                <div className="clay-card !bg-[#FAF6EE] p-6 text-sm text-[#722f37]/90 leading-relaxed border border-[#B7A89A]/40">
                  {parseMarkdown(roadmapResult)}
                </div>

                <button
                  onClick={handleFollowRoadmap}
                  className="clay-btn-burgundy w-full py-4 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Map className="w-4.5 h-4.5 text-[#FAF6EE]" />
                  <span>Follow & Track this Roadmap</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ATS Resume Scorer Module */}
        {activeModule === 'ats' && (
          <div className="p-2">
            <ATSScorer apiKey={apiKey} />
          </div>
        )}

      </div>
    </div>
  );
}
