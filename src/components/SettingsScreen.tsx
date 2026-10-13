import { useState, ChangeEvent } from 'react';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { CapgoFilePicker } from '@capgo/capacitor-file-picker';
import { UserProfile } from '../types';
import {
  User,
  Settings,
  Sliders,
  Trash2,
  Download,
  Upload,
  ShieldAlert,
  Info,
  Sparkles,
  Check,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Palette,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { testGroqConnection, KNOWN_GROQ_MODELS } from '../services/ai';

interface SettingsScreenProps {
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  onResetData: () => void;
  onImportData: (dataString: string) => Promise<boolean>;
  onExportData: () => Promise<string>;
}

export default function SettingsScreen({
  profile,
  onUpdateProfile,
  onResetData,
  onImportData,
  onExportData
}: SettingsScreenProps) {
  const [name, setName] = useState(profile.name);
  const [university, setUniversity] = useState(profile.university);
  const [currentSemester, setCurrentSemester] = useState(profile.currentSemester);
  const [gpaScale, setGpaScale] = useState<4 | 10>(profile.gpaScale);
  const [theme, setTheme] = useState(profile.theme);
  const [groqApiKey, setGroqApiKey] = useState(profile.groqApiKey || '');
  const [testingKey, setTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    models?: string[];
    activeModel?: string;
  } | null>(null);
  const [selectedModel, setSelectedModel] = useState(
    localStorage.getItem('ascendant_groq_model') || ''
  );

  const [isSaved, setIsSaved] = useState(false);
  const [isImportBoxOpen, setIsImportBoxOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [activeInfoPage, setActiveInfoPage] = useState<'about' | 'faq' | 'privacy' | 'terms' | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleTestConnection = async () => {
    if (!groqApiKey.trim()) {
      setTestResult({ success: false, message: 'Please enter your API key first.' });
      return;
    }
    setTestingKey(true);
    setTestResult(null);
    try {
      const res = await testGroqConnection(groqApiKey.trim());
      setTestResult(res);
      if (res.success && res.activeModel && !selectedModel) {
        setSelectedModel(res.activeModel);
        localStorage.setItem('ascendant_groq_model', res.activeModel);
      }
    } catch (e: any) {
      setTestResult({ success: false, message: e.message || String(e) });
    } finally {
      setTestingKey(false);
    }
  };

  const handleSaveProfile = () => {
    onUpdateProfile({
      name: name.trim(),
      university: university.trim(),
      currentSemester,
      theme,
      gpaScale,
      groqApiKey: groqApiKey.trim()
    });
    localStorage.setItem('ascendant_groq_api_key', groqApiKey.trim());
    localStorage.setItem('gradence_groq_api_key', groqApiKey.trim());
    if (selectedModel) {
      localStorage.setItem('ascendant_groq_model', selectedModel);
    } else {
      localStorage.removeItem('ascendant_groq_model');
    }
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 2000);
  };

  const handleBackup = async () => {
    try {
      const dataStr = await onExportData();
      const now = new Date();
      const datePart = now.toISOString().split('T')[0];
      const timePart = now.toTimeString().split(' ')[0].replace(/:/g, '-');
      const filename = `gradence_backup_${datePart}_${timePart}.json`;

      if (Capacitor.isNativePlatform()) {
        let perm = await Filesystem.checkPermissions();
        if (perm.publicStorage !== 'granted') {
          perm = await Filesystem.requestPermissions();
        }
        if (perm.publicStorage !== 'granted') {
          throw new Error('Storage permission denied by user.');
        }
      }

      // Save backup as a physical JSON file using Capacitor Filesystem
      const result = await Filesystem.writeFile({
        path: filename,
        data: dataStr,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
        recursive: true
      });

      alert(`Your study backup was saved successfully!\n\nSaved to your Documents folder:\n${result.uri}`);

      if (navigator.share) {
        try {
          const file = new File([dataStr], filename, { type: 'application/json' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'ASCENDANT Academic Backup',
              text: 'ASCENDANT offline study profile and grades backup.'
            });
          }
        } catch (shareErr) {
          console.warn('Share sheet was dismissed', shareErr);
        }
      }
    } catch (e: any) {
      console.error('Backup trigger failed', e);
      alert(`Could not save backup file: ${e.message || e}`);
    }
  };

  const handleCopyBackup = async () => {
    try {
      const dataStr = await onExportData();
      navigator.clipboard.writeText(dataStr);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (e) {
      console.error(e);
      alert('Could not copy backup. Please try downloading the file.');
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const resultText = event.target?.result;
      if (typeof resultText === 'string') {
        setImportText(resultText);
        setImportStatus('idle');
      }
    };
    reader.onerror = () => {
      alert('Could not read the file. Please make sure it is a valid ASCENDANT backup JSON file.');
    };
    reader.readAsText(file);
  };

  const handleUploadFileClick = async () => {
    try {
      const result = await CapgoFilePicker.pickFiles({
        types: ['application/json'],
        readData: true
      });

      if (result.files && result.files.length > 0) {
        const file = result.files[0];
        if (file.data) {
          const decoded = atob(file.data);
          setImportText(decoded);
          setImportStatus('idle');
          alert(`Backup file "${file.name}" loaded successfully.\n\nClick "Verify and Restore" to finish restoring your notes.`);
        }
      }
    } catch (e: any) {
      console.warn('Falling back to hidden file input', e);
      const hiddenInput = document.getElementById('hidden-file-input');
      if (hiddenInput) {
        hiddenInput.click();
      }
    }
  };

  const handleImport = async () => {
    if (!importText.trim()) return;
    const success = await onImportData(importText.trim());
    if (success) {
      setImportStatus('success');
      setImportText('');
      setTimeout(() => {
        setImportStatus('idle');
        setIsImportBoxOpen(false);
        window.location.reload();
      }, 1500);
    } else {
      setImportStatus('error');
    }
  };

  const handleClearEverything = () => {
    setIsDeleteModalOpen(true);
  };

  if (activeInfoPage === 'about') {
    return (
      <div className="space-y-6 pb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveInfoPage(null)}
            className="clay-btn-latte !w-10 !h-10 !p-0 !rounded-2xl flex items-center justify-center cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-[#722f37]" />
          </button>
          <div>
            <span className="clay-badge text-[10px] px-2.5 py-0.5 inline-block mb-1">ABOUT GRADENCE</span>
            <h1 className="text-2xl font-black text-[#722f37]">
              Your Everyday Academic Companion
            </h1>
          </div>
        </div>

        <div className="clay-card p-6 sm:p-8 space-y-4">
          <p className="text-sm text-[#722f37] leading-relaxed">
            <strong>ASCENDANT</strong> is created to take the stress out of college and university life. Instead of guessing your CGPA or worrying about attendance cuts, ASCENDANT calculates everything instantly with clear numbers.
          </p>
          <p className="text-xs text-[#722f37]/80 leading-relaxed">
            Built using a soft, tactile claymorphic design in warm Mocha Cream, Cosmic Latte, and Deep Burgundy. All your data stays 100% private on your own device—no accounts, no tracking, and no internet required for core calculations.
          </p>

          <div className="pt-4 border-t border-[#B7A89A]/30 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#B7A89A] font-bold">Created By</span>
              <span className="text-[#722f37] font-bold">Done by me</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#B7A89A] font-bold">Design Aesthetic</span>
              <span className="text-[#722f37] font-bold">Warm Claymorphic Light Theme</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#B7A89A] font-bold">Data Privacy</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" /> 100% Offline & Private
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeInfoPage === 'faq') {
    return (
      <div className="space-y-8 pb-12">
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => setActiveInfoPage(null)}
            className="clay-btn-latte !w-11 !h-11 !p-0 !rounded-2xl flex items-center justify-center cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-[#722f37]" />
          </button>
          <div>
            <span className="clay-badge text-xs px-3 py-1 inline-block mb-1.5 font-bold">QUESTIONS & ANSWERS</span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#722f37]">
              Frequently Asked Questions
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {[
            {
              q: 'Where is my student information saved?',
              a: 'Everything is saved locally on your own phone or computer browser. None of your grades, attendance numbers, or notes are uploaded to any external server.'
            },
            {
              q: 'How does the Safe Skip Calculator work?',
              a: 'It looks at how many classes you attended out of total classes held. It then checks against your required target (such as 75%) and tells you exactly how many upcoming classes you can skip safely, or how many you must attend next to recover.'
            },
            {
              q: 'How do I backup my data?',
              a: 'Go to Settings and click "Download Backup File" or "Copy to Clipboard". You can save this file anywhere and restore it on any phone or laptop using "Import Backup".'
            },
            {
              q: 'What GPA scales are supported?',
              a: 'ASCENDANT supports both the standard 10-point college grading scale (with O, A+, A, B+, B, C, D, F) and the 4.0 GPA scale (with A, A-, B+, B, B-, C+, C, D, F).'
            }
          ].map((faq, idx) => (
            <div key={idx} className="clay-card p-6 sm:p-7 space-y-3">
              <h3 className="text-base font-extrabold text-[#722f37]">{faq.q}</h3>
              <p className="text-sm text-[#722f37]/85 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeInfoPage === 'privacy') {
    return (
      <div className="space-y-8 pb-12">
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => setActiveInfoPage(null)}
            className="clay-btn-latte !w-11 !h-11 !p-0 !rounded-2xl flex items-center justify-center cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-[#722f37]" />
          </button>
          <div>
            <span className="clay-badge text-xs px-3 py-1 inline-block mb-1.5 font-bold">YOUR DATA</span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#722f37]">
              Privacy Policy
            </h1>
          </div>
        </div>

        <div className="clay-card p-6 sm:p-8 space-y-5 text-sm text-[#722f37]/90 leading-relaxed">
          <h3 className="font-extrabold text-[#722f37] text-base">1. 100% Private & Device-Only</h3>
          <p>ASCENDANT stores all your semesters, subjects, exams, and daily tasks directly inside your device's browser sandbox. No user tracking, behavioral analytics, or third-party cookies are used.</p>

          <h3 className="font-extrabold text-[#722f37] text-base mt-4">2. Zero Account Requirement</h3>
          <p>You never need to log in, register an email, or submit a password. Your study companion is ready for you offline anytime.</p>

          <h3 className="font-extrabold text-[#722f37] text-base mt-4">3. Optional AI Assistant</h3>
          <p>If you choose to enter an optional Groq API key for the AI study tutor, the key is saved only in your device storage and sent only to Groq for answering your questions.</p>
        </div>
      </div>
    );
  }

  if (activeInfoPage === 'terms') {
    return (
      <div className="space-y-8 pb-12">
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => setActiveInfoPage(null)}
            className="clay-btn-latte !w-11 !h-11 !p-0 !rounded-2xl flex items-center justify-center cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-[#722f37]" />
          </button>
          <div>
            <span className="clay-badge text-xs px-3 py-1 inline-block mb-1.5 font-bold">TERMS OF USE</span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#722f37]">
              Terms & Conditions
            </h1>
          </div>
        </div>

        <div className="clay-card p-6 sm:p-8 space-y-5 text-sm text-[#722f37]/90 leading-relaxed">
          <h3 className="font-extrabold text-[#722f37] text-base">1. Free Academic Companion</h3>
          <p>ASCENDANT is a free companion tool made for students to help plan semesters, attendance, and study schedules easily.</p>

          <h3 className="font-extrabold text-[#722f37] text-base mt-4">2. Self-Verified Calculations</h3>
          <p>Attendance projections and grade predictions are estimates based on the numbers you input. Always cross-check with your official college portal before finalizing decisions.</p>
        </div>
      </div>
    );
  }

  return (
    <div id="settings-screen" className="space-y-8 sm:space-y-10 pb-16">
      {/* Header */}
      <div>
        <div className="clay-badge text-xs px-4 py-1.5 mb-2.5 inline-flex items-center gap-2 font-bold">
          <Settings className="w-4 h-4 text-[#FAF6EE]" />
          <span>ASCENDANT • PREFERENCES</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#722f37] leading-tight">
          Student Preferences & Settings
        </h1>
        <p className="text-sm sm:text-base text-[#722f37]/80 mt-2 font-medium max-w-2xl leading-relaxed">
          Manage your student profile, grading scale, theme, and safe offline backups.
        </p>
      </div>

      {/* 2-Column Responsive Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-start">

        {/* Column 1: Student Profile Card */}
        <div className="clay-card p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-3.5 border-b border-[#B7A89A]/30">
            <div className="flex items-center gap-2.5">
              <User className="w-5 h-5 text-[#722f37]" />
              <h3 className="text-sm sm:text-base font-extrabold text-[#722f37] uppercase tracking-wide">
                Your Student Profile
              </h3>
            </div>
            <span className="text-xs font-bold text-[#B7A89A]">OFFLINE PROFILE</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div className="space-y-2">
              <label htmlFor="student-name-input" className="text-xs font-bold text-[#722f37] uppercase tracking-wider block">
                Your Name
              </label>
              <div className="clay-inset p-3 px-3.5">
                <input
                  id="student-name-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full bg-transparent text-sm font-semibold text-[#722f37] focus:outline-none placeholder:text-[#B7A89A]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="student-university-input" className="text-xs font-bold text-[#722f37] uppercase tracking-wider block">
                College or University
              </label>
              <div className="clay-inset p-3 px-3.5">
                <input
                  id="student-university-input"
                  type="text"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="e.g. Stanford University"
                  className="w-full bg-transparent text-sm font-semibold text-[#722f37] focus:outline-none placeholder:text-[#B7A89A]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="student-semester-select" className="text-xs font-bold text-[#722f37] uppercase tracking-wider block">
                Current Active Semester
              </label>
              <div className="clay-inset p-3 px-3.5">
                <select
                  id="student-semester-select"
                  value={currentSemester}
                  onChange={(e) => setCurrentSemester(parseInt(e.target.value))}
                  className="w-full bg-transparent text-sm font-semibold text-[#722f37] focus:outline-none cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s} className="bg-[#FAF6EE] text-[#722f37]">Semester {s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="student-gpa-select" className="text-xs font-bold text-[#722f37] uppercase tracking-wider block">
                Grading System
              </label>
              <div className="clay-inset p-3 px-3.5">
                <select
                  id="student-gpa-select"
                  value={gpaScale}
                  onChange={(e) => setGpaScale(parseInt(e.target.value) as 4 | 10)}
                  className="w-full bg-transparent text-sm font-semibold text-[#722f37] focus:outline-none cursor-pointer"
                >
                  <option value="10" className="bg-[#FAF6EE] text-[#722f37]">10.0 Scale (O, A+, A, B+, B, C, D)</option>
                  <option value="4" className="bg-[#FAF6EE] text-[#722f37]">4.0 Scale (A, A-, B+, B, B-, C+, C)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="student-theme-select" className="text-xs font-bold text-[#722f37] uppercase tracking-wider block">
                Color Theme
              </label>
              <div className="clay-inset p-3 px-3.5">
                <select
                  id="student-theme-select"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as any)}
                  className="w-full bg-transparent text-sm font-semibold text-[#722f37] focus:outline-none cursor-pointer"
                >
                  <option value="se-light" className="bg-[#FAF6EE] text-[#722f37]">Cosmic Latte & Mocha Cream (Clay Light)</option>
                  <option value="light" className="bg-[#FAF6EE] text-[#722f37]">Warm Ivory Light</option>
                  <option value="system" className="bg-[#FAF6EE] text-[#722f37]">Automatic System Match</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="groq-api-key-input" className="text-xs font-bold text-[#722f37] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#722f37]" />
                  <span>Groq AI Cloud API Key</span>
                </label>
                {groqApiKey && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-300 px-2 py-0.5 rounded-full">
                    Key Configured
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <div className="clay-inset p-3 px-3.5 flex-1 min-w-0">
                  <input
                    id="groq-api-key-input"
                    type="password"
                    value={groqApiKey}
                    onChange={(e) => {
                      setGroqApiKey(e.target.value);
                      setTestResult(null);
                    }}
                    placeholder="gsk_... (from console.groq.com)"
                    className="w-full bg-transparent text-sm font-mono font-semibold text-[#722f37] focus:outline-none placeholder:text-[#B7A89A]"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingKey || !groqApiKey.trim()}
                  className="clay-btn-latte px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 shrink-0"
                  title="Test API Key & check accessible models"
                >
                  {testingKey ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#722f37]" />
                      <span>Testing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-[#722f37]" />
                      <span>Test Key</span>
                    </>
                  )}
                </button>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium flex items-start gap-2 border ${
                    testResult.success
                      ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900'
                      : 'bg-rose-50/80 border-rose-300 text-rose-900'
                  }`}
                >
                  {testResult.success ? (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <p className="font-semibold">{testResult.message}</p>
                    {testResult.models && testResult.models.length > 0 && (
                      <p className="text-[11px] opacity-80">
                        Authorized models on your key: {testResult.models.slice(0, 5).join(', ')}
                        {testResult.models.length > 5 ? ` +${testResult.models.length - 5} more` : ''}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Model Selection Override */}
              <div className="space-y-1.5 pt-1">
                <label htmlFor="groq-model-select" className="text-[11px] font-bold text-[#722f37]/80 uppercase tracking-wider block">
                  AI Model
                </label>
                <div className="clay-inset p-2.5 px-3">
                  <select
                    id="groq-model-select"
                    value={selectedModel}
                    onChange={(e) => {
                      setSelectedModel(e.target.value);
                      if (e.target.value) {
                        localStorage.setItem('ascendant_groq_model', e.target.value);
                      } else {
                        localStorage.removeItem('ascendant_groq_model');
                      }
                    }}
                    className="w-full bg-transparent text-xs font-semibold text-[#722f37] focus:outline-none cursor-pointer"
                  >
                    <option value="" className="bg-[#FAF6EE] text-[#722f37]">
                      ✨ Auto-Detect Best Active Model (Recommended)
                    </option>
                    {Array.from(new Set([
                      ...(testResult?.models || []),
                      ...KNOWN_GROQ_MODELS
                    ])).map(m => (
                      <option key={m} value={m} className="bg-[#FAF6EE] text-[#722f37]">
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <p className="text-[11px] text-[#7A6B5E] leading-relaxed">
                Free high-speed AI inference. Get your free key at{' '}
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#722f37] font-bold underline hover:text-[#5A232A]"
                >
                  console.groq.com/keys
                </a>{' '}
                (starts with <code className="font-mono bg-[#E8DCC6] px-1 rounded text-[#722f37] font-bold">gsk_...</code>).
                Also supports OpenRouter (<code className="font-mono bg-[#E8DCC6] px-1 rounded text-[#722f37] font-bold">sk-or-...</code>) & OpenAI keys.
              </p>
            </div>
          </div>

          <button
            onClick={handleSaveProfile}
            className={`w-full py-3.5 rounded-2xl text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
              isSaved
                ? 'clay-btn-latte !border-emerald-500 !text-emerald-800'
                : 'clay-btn-burgundy'
            }`}
          >
            {isSaved ? (
              <>
                <Check className="w-4.5 h-4.5 text-emerald-700" />
                <span>Preferences Saved Successfully!</span>
              </>
            ) : (
              <span>Save Student Preferences</span>
            )}
          </button>
        </div>

        {/* Column 2: Data Management, Info & Reset */}
        <div className="space-y-6 sm:space-y-8">

          {/* Backup and Restore container */}
          <div className="clay-card p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#B7A89A]/30">
              <div className="flex items-center gap-2.5">
                <Sliders className="w-5 h-5 text-[#722f37]" />
                <h3 className="text-sm sm:text-base font-extrabold text-[#722f37] uppercase tracking-wide">
                  Backup & Restore Records
                </h3>
              </div>
              <span className="text-xs font-bold text-[#B7A89A]">SAFE & PRIVATE</span>
            </div>

            <p className="text-sm text-[#722f37]/80 leading-relaxed">
              ASCENDANT stores all your grade logs, attendance marks, and exam reminders inside your device's browser memory. Download or copy a backup anytime to keep your study history safe or move to a new device.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
              <button
                onClick={handleBackup}
                className="clay-btn-latte p-3.5 text-xs sm:text-sm font-bold flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 text-[#722f37]" />
                <span>Download Backup</span>
              </button>
              <button
                onClick={handleCopyBackup}
                className="clay-btn-latte p-3.5 text-xs sm:text-sm font-bold flex items-center justify-center gap-2"
              >
                <Check className={`w-4 h-4 ${copySuccess ? 'text-emerald-700' : 'text-[#722f37]'}`} />
                <span>{copySuccess ? 'Copied Backup!' : 'Copy to Clipboard'}</span>
              </button>
              <button
                onClick={() => setIsImportBoxOpen(!isImportBoxOpen)}
                className="clay-btn-latte p-3.5 text-xs sm:text-sm font-bold flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4 text-[#722f37]" />
                <span>Import Backup</span>
              </button>
            </div>

            {isImportBoxOpen && (
              <div className="clay-card !bg-[#FAF6EE] p-5 space-y-4 mt-3 border border-[#B7A89A]/50">
                <span className="text-xs font-bold text-[#722f37] uppercase tracking-wider block">
                  Paste Backup JSON Data:
                </span>
                <div className="clay-inset p-3.5">
                  <textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder='Paste backup content here (e.g. {"profile": ...})'
                    rows={4}
                    className="w-full bg-transparent text-sm font-mono text-[#722f37] focus:outline-none placeholder:text-[#B7A89A]"
                  />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                  <button
                    type="button"
                    onClick={handleUploadFileClick}
                    className="clay-btn-latte py-3 px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 flex-1"
                  >
                    <Upload className="w-4 h-4 text-[#722f37]" />
                    <span>Upload Backup File</span>
                  </button>
                  <input
                    id="hidden-file-input"
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />

                  <button
                    onClick={handleImport}
                    className="clay-btn-burgundy py-3 px-5 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 flex-1"
                  >
                    <span>Verify & Restore Records</span>
                  </button>
                </div>

                {importStatus === 'success' && (
                  <p className="text-sm text-emerald-700 font-bold">✓ Backup restored successfully! Refreshing...</p>
                )}
                {importStatus === 'error' && (
                  <p className="text-sm text-red-700 font-bold">✗ Could not read backup format. Please verify the JSON text.</p>
                )}
              </div>
            )}
          </div>

          {/* Helpful Guides & Information */}
          <div className="clay-card p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#B7A89A]/30">
              <div className="flex items-center gap-2.5">
                <Info className="w-5 h-5 text-[#722f37]" />
                <h3 className="text-sm sm:text-base font-extrabold text-[#722f37] uppercase tracking-wide">
                  Helpful Guides & Info
                </h3>
              </div>
              <span className="text-xs font-bold text-[#B7A89A]">LEARN MORE</span>
            </div>

            <div className="space-y-3">
              {[
                { id: 'about', label: 'About ASCENDANT' },
                { id: 'faq', label: 'Frequently Asked Questions (FAQ)' },
                { id: 'privacy', label: 'Privacy Policy' },
                { id: 'terms', label: 'Terms & Conditions' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveInfoPage(item.id as any)}
                  className="clay-btn-latte w-full p-4 text-left flex justify-between items-center text-sm font-bold text-[#722f37] transition-all"
                >
                  <span>{item.label}</span>
                  <ChevronRight className="w-4 h-4 text-[#B7A89A]" />
                </button>
              ))}
            </div>
          </div>

          {/* Reset Data Danger Zone */}
          <div className="clay-card p-6 sm:p-8 space-y-4 border border-red-200">
            <div className="flex items-center justify-between pb-3 border-b border-red-200">
              <div className="flex items-center gap-2.5 text-red-800">
                <ShieldAlert className="w-5 h-5" />
                <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wide">
                  Reset Study Records
                </h3>
              </div>
              <span className="text-xs font-bold text-red-600">PERMANENT ACTION</span>
            </div>

            <p className="text-sm text-[#722f37]/80 leading-relaxed">
              If you want to start fresh from Semester 1, you can erase all stored classes, grades, and exams from this device.
            </p>

            <button
              onClick={handleClearEverything}
              className="w-full py-3.5 rounded-2xl text-xs sm:text-sm font-extrabold text-red-700 bg-red-100 border border-red-300 hover:bg-red-200 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Trash2 className="w-4.5 h-4.5" />
              <span>Clear All Stored Study Records</span>
            </button>
          </div>

        </div>

      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="clay-card !bg-[#FAF6EE] max-w-sm w-full p-6 sm:p-7 space-y-5 shadow-2xl border-2 border-[#B7A89A]">
            <div className="space-y-2 text-center">
              <ShieldAlert className="w-12 h-12 text-red-600 mx-auto" />
              <h3 className="text-lg font-black text-[#722f37]">
                Clear All Records?
              </h3>
              <p className="text-xs text-[#722f37]/80 leading-relaxed">
                This will delete all your attendance logs and semester grades from this device. We recommend downloading a backup first!
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={async () => {
                  await handleBackup();
                }}
                className="clay-btn-latte py-2.5 text-xs font-bold flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Export Backup First</span>
              </button>

              <button
                onClick={async () => {
                  await onResetData();
                  setIsDeleteModalOpen(false);
                  window.location.reload();
                }}
                className="py-2.5 rounded-2xl bg-red-700 text-[#FAF6EE] text-xs font-extrabold hover:bg-red-800 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Trash2 className="w-4 h-4" />
                <span>Yes, Reset Everything</span>
              </button>

              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="clay-btn-latte py-2 text-xs font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
