import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, Semester, AttendanceSubject, Exam, Activity, CareerRoadmap, TimetableItem, HabitItem, CountdownItem, AcademicEvent } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  fetchUserData,
  upsertProfile,
  syncSemesters,
  syncAttendance,
  syncExams,
  syncTimetable,
  syncCountdowns,
  syncHabits,
  logActivityToSupabase,
  clearActivitiesInSupabase,
  syncRoadmaps,
  syncAcademicEvents,
  saveCodingProfilesToSupabase,
  saveResumeDraftToSupabase,
  resetAllUserData
} from '../services/supabaseService';
import { scheduleExamNotifications, scheduleClassNotifications, scheduleAcademicNotifications } from '../utils/notifications';

export interface ProfileData {
  username: string;
  solved: number;
  rating: string;
  hackos?: number;
}

export interface CodingProfilesState {
  leetcode: ProfileData;
  github: ProfileData;
  codeforces: ProfileData;
  codechef: ProfileData;
}

interface GradenceContextType {
  profile: UserProfile | null;
  semesters: Semester[];
  attendanceSubjects: AttendanceSubject[];
  exams: Exam[];
  activities: Activity[];
  roadmaps: CareerRoadmap[];
  timetable: TimetableItem[];
  countdowns: CountdownItem[];
  habits: HabitItem[];
  codingProfiles: CodingProfilesState | null;
  academicEvents: AcademicEvent[];
  isInitialized: boolean;
  isStorageLoading: boolean;
  user: any | null;
  isSupabaseConfigured: boolean;

  updateProfile: (profile: UserProfile) => Promise<void>;
  saveSemester: (semester: Semester) => Promise<void>;
  saveSemesters: (semesters: Semester[]) => Promise<void>;
  saveAttendance: (subjects: AttendanceSubject[]) => Promise<void>;
  saveExams: (newExams: Exam[]) => Promise<void>;
  saveTimetable: (list: TimetableItem[]) => Promise<void>;
  saveCountdowns: (list: CountdownItem[]) => Promise<void>;
  saveHabits: (list: HabitItem[]) => Promise<void>;
  saveCodingProfiles: (data: CodingProfilesState) => Promise<void>;
  saveRoadmaps: (roadmaps: CareerRoadmap[]) => Promise<void>;
  saveAcademicEvents: (events: AcademicEvent[]) => Promise<void>;
  logActivity: (type: Activity['type'], title: string, detail: string) => Promise<void>;
  clearActivities: () => Promise<void>;
  resetData: () => Promise<void>;
  importData: (dataString: string) => Promise<boolean>;
  exportData: () => Promise<string>;
  saveResumeDraft: (draft: any) => Promise<void>;
  resumeDraft: any | null;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const GradenceContext = createContext<GradenceContextType | undefined>(undefined);

export const GradenceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [attendanceSubjects, setAttendanceSubjects] = useState<AttendanceSubject[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [roadmaps, setRoadmaps] = useState<CareerRoadmap[]>([]);
  const [timetable, setTimetable] = useState<TimetableItem[]>([]);
  const [countdowns, setCountdowns] = useState<CountdownItem[]>([]);
  const [habits, setHabits] = useState<HabitItem[]>([]);
  const [codingProfiles, setCodingProfiles] = useState<CodingProfilesState | null>(null);
  const [resumeDraft, setResumeDraft] = useState<any | null>(null);
  const [academicEvents, setAcademicEvents] = useState<AcademicEvent[]>([]);

  const [user, setUser] = useState<any | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isStorageLoading, setIsStorageLoading] = useState(true);

  // Load user data from Supabase
  const loadUserData = async (activeUserId: string, userMeta?: any) => {
    try {
      if (!activeUserId) {
        setIsStorageLoading(false);
        setIsInitialized(false);
        return;
      }

      const data = await fetchUserData(activeUserId);

      if (data.profile) {
        setProfile(data.profile);
        setIsInitialized(true);
      } else {
        // Create initial default profile if none exists
        const defaultProf: UserProfile = {
          name: userMeta?.name || 'Student',
          university: userMeta?.university || 'College Workspace',
          currentSemester: Number(userMeta?.currentSemester) || 1,
          theme: 'se-light',
          gpaScale: Number(userMeta?.gpaScale) === 4 ? 4 : 10,
          groqApiKey: ''
        };
        setProfile(defaultProf);
        // Non-blocking upsert
        upsertProfile(activeUserId, defaultProf).catch(e => console.warn('Profile sync:', e));
        setIsInitialized(true);
      }

      setSemesters(data.semesters);
      setAttendanceSubjects(data.attendanceSubjects);
      setExams(data.exams);
      setActivities(data.activities);
      setRoadmaps(data.roadmaps);
      setTimetable(data.timetable);
      setCountdowns(data.countdowns);
      setHabits(data.habits);
      setCodingProfiles(data.codingProfiles);
      setResumeDraft(data.resumeDraft);
      setAcademicEvents(data.academicEvents);
    } catch (e) {
      console.error('Failed to load user data from Supabase', e);
    } finally {
      setIsStorageLoading(false);
    }
  };

  // Listen to Supabase Auth State changes with 2.5s safety timeout
  useEffect(() => {
    let mounted = true;

    // Safety timeout: prevents app from hanging on "Opening ASCENDANT..."
    const safetyTimer = setTimeout(() => {
      if (mounted) {
        setIsStorageLoading(false);
      }
    }, 2500);

    if (!isSupabaseConfigured) {
      setIsStorageLoading(false);
      return () => clearTimeout(safetyTimer);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        setUser(session.user);
        await loadUserData(session.user.id, session.user.user_metadata);
      } else {
        setUser(null);
        setProfile(null);
        setSemesters([]);
        setAttendanceSubjects([]);
        setExams([]);
        setActivities([]);
        setRoadmaps([]);
        setTimetable([]);
        setCountdowns([]);
        setHabits([]);
        setCodingProfiles(null);
        setResumeDraft(null);
        setAcademicEvents([]);
        setIsInitialized(false);
        setIsStorageLoading(false);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const refreshData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await loadUserData(session.user.id, session.user.user_metadata);
      } else {
        setIsStorageLoading(false);
      }
    } catch {
      setIsStorageLoading(false);
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    setSemesters([]);
    setAttendanceSubjects([]);
    setExams([]);
    setActivities([]);
    setRoadmaps([]);
    setTimetable([]);
    setCountdowns([]);
    setHabits([]);
    setCodingProfiles(null);
    setResumeDraft(null);
    setAcademicEvents([]);
    setIsInitialized(false);
  };

  const deleteAccount = async () => {
    if (user?.id) {
      await resetAllUserData(user.id);
    }
    await signOut();
  };

  const logActivity = async (type: Activity['type'], title: string, detail: string) => {
    const newActivity: Activity = {
      id: `act-${Date.now()}`,
      type,
      title,
      detail,
      timestamp: new Date().toISOString()
    };
    const updated = [newActivity, ...activities].slice(0, 30);
    setActivities(updated);

    if (user?.id) {
      await logActivityToSupabase(user.id, newActivity);
    }
  };

  const clearActivities = async () => {
    setActivities([]);
    if (user?.id) {
      await clearActivitiesInSupabase(user.id);
    }
  };

  const updateProfile = async (newProfile: UserProfile) => {
    setProfile(newProfile);
    setIsInitialized(true);

    if (user?.id) {
      await upsertProfile(user.id, newProfile);
    }
    await logActivity('profile', 'Settings Changed', 'System and academic parameters updated.');
  };

  const saveSemesters = async (newSemesters: Semester[]) => {
    if (newSemesters.length === 0) return;

    let updated = [...semesters];
    newSemesters.forEach(semester => {
      const existsIdx = updated.findIndex(s => s.number === semester.number);
      if (existsIdx >= 0) {
        updated[existsIdx] = semester;
      } else {
        updated.push(semester);
      }
    });
    updated.sort((a, b) => a.number - b.number);
    setSemesters(updated);

    if (user?.id) {
      await syncSemesters(user.id, updated);
    }

    for (const semester of newSemesters) {
      await logActivity('cgpa', `Semester ${semester.number} Saved`, `Archived ${semester.subjects.length} courses with an SGPA of ${semester.sgpa.toFixed(2)}.`);
    }

    if (profile) {
      const maxSemNum = Math.max(...newSemesters.map(s => s.number));
      if (maxSemNum >= profile.currentSemester && maxSemNum < 8) {
        const updatedProfile = { ...profile, currentSemester: maxSemNum + 1 };
        setProfile(updatedProfile);
        if (user?.id) {
          await upsertProfile(user.id, updatedProfile);
        }
      }
    }
  };

  const saveSemester = async (semester: Semester) => {
    await saveSemesters([semester]);
  };

  const saveAttendance = async (subjects: AttendanceSubject[]) => {
    setAttendanceSubjects(subjects);
    if (user?.id) {
      await syncAttendance(user.id, subjects);
    }
  };

  const saveExams = async (newExams: Exam[]) => {
    setExams(newExams);
    if (user?.id) {
      await syncExams(user.id, newExams);
    }

    if (newExams.length > exams.length) {
      const added = newExams[newExams.length - 1];
      await logActivity('exam', 'Exam Scheduled', `Assessment for "${added.subject}" set for ${added.date}.`);
    } else if (newExams.length < exams.length) {
      await logActivity('exam', 'Assessment Cleared', 'Upcoming assessment log updated.');
    }

    scheduleExamNotifications(newExams);
  };

  const saveTimetable = async (list: TimetableItem[]) => {
    setTimetable(list);
    if (user?.id) {
      await syncTimetable(user.id, list);
    }

    if (list.length > timetable.length) {
      const added = list[list.length - 1];
      await logActivity('planner', 'Class Added 📚', `New class "${added.subject}" scheduled at ${added.time} in Room ${added.room}.`);
    } else if (list.length < timetable.length) {
      await logActivity('planner', 'Class Removed 🗑️', 'Class schedule was updated.');
    }

    scheduleClassNotifications(list);
  };

  const saveCountdowns = async (list: CountdownItem[]) => {
    setCountdowns(list);
    if (user?.id) {
      await syncCountdowns(user.id, list);
    }

    if (list.length > countdowns.length) {
      const added = list[list.length - 1];
      await logActivity('planner', 'Countdown Set ⏳', `Target date set for "${added.title}" on ${added.date}.`);
    } else if (list.length < countdowns.length) {
      await logActivity('planner', 'Countdown Cleared 🗑️', 'Countdown list updated.');
    }
  };

  const saveHabits = async (list: HabitItem[]) => {
    setHabits(list);
    if (user?.id) {
      await syncHabits(user.id, list);
    }
  };

  const saveAcademicEvents = async (events: AcademicEvent[]) => {
    setAcademicEvents(events);
    if (user?.id) {
      await syncAcademicEvents(user.id, events);
    }
    scheduleAcademicNotifications(events);
  };

  const saveCodingProfiles = async (data: CodingProfilesState) => {
    setCodingProfiles(data);
    if (user?.id) {
      await saveCodingProfilesToSupabase(user.id, data);
    }
  };

  const saveResumeDraft = async (draft: any) => {
    setResumeDraft(draft);
    if (user?.id) {
      await saveResumeDraftToSupabase(user.id, draft);
    }
  };

  const saveRoadmaps = async (updated: CareerRoadmap[]) => {
    setRoadmaps(updated);
    if (user?.id) {
      await syncRoadmaps(user.id, updated);
    }
  };

  const resetData = async () => {
    if (user?.id) {
      await resetAllUserData(user.id);
    }
    setProfile(null);
    setSemesters([]);
    setAttendanceSubjects([]);
    setExams([]);
    setActivities([]);
    setRoadmaps([]);
    setTimetable([]);
    setCountdowns([]);
    setHabits([]);
    setCodingProfiles(null);
    setResumeDraft(null);
    setAcademicEvents([]);
    setIsInitialized(false);
  };

  const exportData = async (): Promise<string> => {
    const backupObj = {
      profile,
      semesters,
      attendanceSubjects,
      exams,
      activities,
      roadmaps,
      timetable,
      countdowns,
      habits,
      coding: codingProfiles,
      academicEvents
    };
    return JSON.stringify(backupObj, null, 2);
  };

  const importData = async (dataString: string): Promise<boolean> => {
    try {
      if (!dataString || !dataString.trim()) return false;
      const parsed = JSON.parse(dataString);
      if (!parsed.profile || typeof parsed.profile !== 'object' || typeof parsed.profile.name !== 'string') {
        return false;
      }

      const rawProfile = parsed.profile;
      const sanitizedProfile: UserProfile = {
        name: typeof rawProfile.name === 'string' ? rawProfile.name : 'Student',
        university: typeof rawProfile.university === 'string' ? rawProfile.university : 'General University',
        currentSemester: typeof rawProfile.currentSemester === 'number' ? rawProfile.currentSemester : 1,
        theme: (rawProfile.theme === 'se-dark' || rawProfile.theme === 'se-light' || rawProfile.theme === 'light' || rawProfile.theme === 'dark' || rawProfile.theme === 'system') ? rawProfile.theme : 'se-light',
        gpaScale: (rawProfile.gpaScale === 4 || rawProfile.gpaScale === 10) ? rawProfile.gpaScale : 10,
        groqApiKey: typeof rawProfile.groqApiKey === 'string' ? rawProfile.groqApiKey : ''
      };

      setProfile(sanitizedProfile);
      const sems = Array.isArray(parsed.semesters) ? parsed.semesters : [];
      setSemesters(sems);
      const att = Array.isArray(parsed.attendanceSubjects) ? parsed.attendanceSubjects : (Array.isArray(parsed.attendance) ? parsed.attendance : []);
      setAttendanceSubjects(att);
      const ex = Array.isArray(parsed.exams) ? parsed.exams : [];
      setExams(ex);
      const act = Array.isArray(parsed.activities) ? parsed.activities : [];
      setActivities(act);
      const road = Array.isArray(parsed.roadmaps) ? parsed.roadmaps : [];
      setRoadmaps(road);
      const time = Array.isArray(parsed.timetable) ? parsed.timetable : [];
      setTimetable(time);
      const count = Array.isArray(parsed.countdowns) ? parsed.countdowns : [];
      setCountdowns(count);
      const habs = Array.isArray(parsed.habits) ? parsed.habits : [];
      setHabits(habs);
      const coding = (parsed.coding && typeof parsed.coding === 'object') ? parsed.coding : null;
      setCodingProfiles(coding);
      const acaEvents = Array.isArray(parsed.academicEvents) ? parsed.academicEvents : [];
      setAcademicEvents(acaEvents);

      if (user?.id) {
        await upsertProfile(user.id, sanitizedProfile);
        await syncSemesters(user.id, sems);
        await syncAttendance(user.id, att);
        await syncExams(user.id, ex);
        await syncTimetable(user.id, time);
        await syncCountdowns(user.id, count);
        await syncHabits(user.id, habs);
        await syncRoadmaps(user.id, road);
        await syncAcademicEvents(user.id, acaEvents);
        if (coding) await saveCodingProfilesToSupabase(user.id, coding);
      }

      setIsInitialized(true);
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  };

  return (
    <GradenceContext.Provider
      value={{
        profile,
        semesters,
        attendanceSubjects,
        exams,
        activities,
        roadmaps,
        timetable,
        countdowns,
        habits,
        codingProfiles,
        isInitialized,
        isStorageLoading,
        user,
        isSupabaseConfigured,
        updateProfile,
        saveSemester,
        saveSemesters,
        saveAttendance,
        saveExams,
        saveTimetable,
        saveCountdowns,
        saveHabits,
        saveCodingProfiles,
        saveRoadmaps,
        saveAcademicEvents,
        saveResumeDraft,
        resumeDraft,
        academicEvents,
        logActivity,
        clearActivities,
        resetData,
        importData,
        exportData,
        signOut,
        deleteAccount,
        refreshData
      }}
    >
      {children}
    </GradenceContext.Provider>
  );
};

export const useGradence = () => {
  const context = useContext(GradenceContext);
  if (context === undefined) {
    throw new Error('useGradence must be used within a GradenceProvider');
  }
  return context;
};
