import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  UserProfile,
  Semester,
  AttendanceSubject,
  Exam,
  Activity,
  CareerRoadmap,
  TimetableItem,
  HabitItem,
  CountdownItem,
  AcademicEvent
} from '../types';

export interface UserDataPayload {
  profile: UserProfile | null;
  semesters: Semester[];
  attendanceSubjects: AttendanceSubject[];
  exams: Exam[];
  activities: Activity[];
  roadmaps: CareerRoadmap[];
  timetable: TimetableItem[];
  countdowns: CountdownItem[];
  habits: HabitItem[];
  codingProfiles: any | null;
  resumeDraft: any | null;
  academicEvents: AcademicEvent[];
}

/**
 * Fetch all academic and student data for the logged-in user
 */
export async function fetchUserData(userId: string): Promise<UserDataPayload> {
  const result: UserDataPayload = {
    profile: null,
    semesters: [],
    attendanceSubjects: [],
    exams: [],
    activities: [],
    roadmaps: [],
    timetable: [],
    countdowns: [],
    habits: [],
    codingProfiles: null,
    resumeDraft: null,
    academicEvents: []
  };

  if (!isSupabaseConfigured || !userId) {
    return result;
  }

  try {
    const [
      profileRes,
      semestersRes,
      attendanceRes,
      examsRes,
      activitiesRes,
      roadmapsRes,
      timetableRes,
      countdownsRes,
      habitsRes,
      codingRes,
      resumeRes,
      eventsRes
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('semesters').select('*').eq('user_id', userId).order('number', { ascending: true }),
      supabase.from('attendance_subjects').select('*').eq('user_id', userId),
      supabase.from('exams').select('*').eq('user_id', userId).order('date', { ascending: true }),
      supabase.from('activities').select('*').eq('user_id', userId).order('timestamp', { ascending: false }).limit(30),
      supabase.from('career_roadmaps').select('*').eq('user_id', userId),
      supabase.from('timetable').select('*').eq('user_id', userId),
      supabase.from('countdowns').select('*').eq('user_id', userId),
      supabase.from('habits').select('*').eq('user_id', userId),
      supabase.from('coding_profiles').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('resume_drafts').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('academic_events').select('*').eq('user_id', userId).order('date', { ascending: true })
    ]);

    if (profileRes.data) {
      result.profile = {
        name: profileRes.data.name || 'Student',
        university: profileRes.data.university || 'General University',
        currentSemester: profileRes.data.current_semester || 1,
        theme: profileRes.data.theme || 'se-light',
        gpaScale: profileRes.data.gpa_scale || 10,
        groqApiKey: profileRes.data.groq_api_key || ''
      };
    }

    if (semestersRes.data) {
      result.semesters = semestersRes.data.map((s: any) => ({
        id: s.id,
        number: s.number,
        name: s.name,
        sgpa: Number(s.sgpa) || 0,
        totalCredits: s.total_credits || 0,
        subjects: Array.isArray(s.subjects) ? s.subjects : []
      }));
    }

    if (attendanceRes.data) {
      result.attendanceSubjects = attendanceRes.data.map((a: any) => ({
        id: a.id,
        name: a.name,
        present: a.present || 0,
        total: a.total || 0,
        requiredPercentage: a.required_percentage || 75,
        history: a.history || []
      }));
    }

    if (examsRes.data) {
      result.exams = examsRes.data.map((e: any) => ({
        id: e.id,
        subject: e.subject,
        date: e.date,
        priority: e.priority || 'medium'
      }));
    }

    if (activitiesRes.data) {
      result.activities = activitiesRes.data.map((act: any) => ({
        id: act.id,
        type: act.type,
        title: act.title,
        detail: act.detail,
        timestamp: act.timestamp
      }));
    }

    if (roadmapsRes.data) {
      result.roadmaps = roadmapsRes.data.map((r: any) => ({
        id: r.id,
        title: r.title,
        targetRole: r.target_role,
        stages: r.stages || [],
        isCompleted: r.is_completed || false,
        createdAt: r.created_at
      }));
    }

    if (timetableRes.data) {
      result.timetable = timetableRes.data.map((t: any) => ({
        id: t.id,
        subject: t.subject,
        time: t.time,
        room: t.room
      }));
    }

    if (countdownsRes.data) {
      result.countdowns = countdownsRes.data.map((c: any) => ({
        id: c.id,
        title: c.title,
        date: c.date
      }));
    }

    if (habitsRes.data) {
      result.habits = habitsRes.data.map((h: any) => ({
        id: h.id,
        name: h.name,
        completed: h.completed || false
      }));
    }

    if (codingRes.data?.data) {
      result.codingProfiles = codingRes.data.data;
    }

    if (resumeRes.data?.draft) {
      result.resumeDraft = resumeRes.data.draft;
    }

    if (eventsRes.data) {
      result.academicEvents = eventsRes.data.map((ev: any) => ({
        id: ev.id,
        date: ev.date,
        title: ev.title,
        targetYear: ev.target_year,
        isHoliday: ev.is_holiday || false
      }));
    }
  } catch (err) {
    console.error('Error fetching data from Supabase:', err);
  }

  return result;
}

/**
 * Upsert User Profile
 */
export async function upsertProfile(userId: string, profile: UserProfile): Promise<void> {
  if (!isSupabaseConfigured || !userId) return;

  await supabase.from('profiles').upsert({
    id: userId,
    name: profile.name,
    university: profile.university,
    current_semester: profile.currentSemester,
    theme: profile.theme,
    gpa_scale: profile.gpaScale,
    groq_api_key: profile.groqApiKey || '',
    updated_at: new Date().toISOString()
  });
}

/**
 * Sync All Semesters
 */
export async function syncSemesters(userId: string, semesters: Semester[]): Promise<void> {
  if (!isSupabaseConfigured || !userId) return;

  // Clear previous and insert new to maintain exact state
  await supabase.from('semesters').delete().eq('user_id', userId);

  if (semesters.length > 0) {
    const rows = semesters.map(s => ({
      user_id: userId,
      id: s.id,
      number: s.number,
      name: s.name,
      sgpa: s.sgpa,
      total_credits: s.totalCredits,
      subjects: s.subjects
    }));
    await supabase.from('semesters').insert(rows);
  }
}

/**
 * Sync Attendance Subjects
 */
export async function syncAttendance(userId: string, subjects: AttendanceSubject[]): Promise<void> {
  if (!isSupabaseConfigured || !userId) return;

  await supabase.from('attendance_subjects').delete().eq('user_id', userId);

  if (subjects.length > 0) {
    const rows = subjects.map(s => ({
      user_id: userId,
      id: s.id,
      name: s.name,
      present: s.present,
      total: s.total,
      required_percentage: s.requiredPercentage,
      history: s.history || []
    }));
    await supabase.from('attendance_subjects').insert(rows);
  }
}

/**
 * Sync Exams
 */
export async function syncExams(userId: string, exams: Exam[]): Promise<void> {
  if (!isSupabaseConfigured || !userId) return;

  await supabase.from('exams').delete().eq('user_id', userId);

  if (exams.length > 0) {
    const rows = exams.map(e => ({
      user_id: userId,
      id: e.id,
      subject: e.subject,
      date: e.date,
      priority: e.priority
    }));
    await supabase.from('exams').insert(rows);
  }
}

/**
 * Sync Timetable
 */
export async function syncTimetable(userId: string, timetable: TimetableItem[]): Promise<void> {
  if (!isSupabaseConfigured || !userId) return;

  await supabase.from('timetable').delete().eq('user_id', userId);

  if (timetable.length > 0) {
    const rows = timetable.map(t => ({
      user_id: userId,
      id: t.id,
      subject: t.subject,
      time: t.time,
      room: t.room
    }));
    await supabase.from('timetable').insert(rows);
  }
}

/**
 * Sync Countdowns
 */
export async function syncCountdowns(userId: string, countdowns: CountdownItem[]): Promise<void> {
  if (!isSupabaseConfigured || !userId) return;

  await supabase.from('countdowns').delete().eq('user_id', userId);

  if (countdowns.length > 0) {
    const rows = countdowns.map(c => ({
      user_id: userId,
      id: c.id,
      title: c.title,
      date: c.date
    }));
    await supabase.from('countdowns').insert(rows);
  }
}

/**
 * Sync Habits
 */
export async function syncHabits(userId: string, habits: HabitItem[]): Promise<void> {
  if (!isSupabaseConfigured || !userId) return;

  await supabase.from('habits').delete().eq('user_id', userId);

  if (habits.length > 0) {
    const rows = habits.map(h => ({
      user_id: userId,
      id: h.id,
      name: h.name,
      completed: h.completed
    }));
    await supabase.from('habits').insert(rows);
  }
}

/**
 * Log an Activity
 */
export async function logActivityToSupabase(userId: string, activity: Activity): Promise<void> {
  if (!isSupabaseConfigured || !userId) return;

  await supabase.from('activities').insert({
    user_id: userId,
    id: activity.id,
    type: activity.type,
    title: activity.title,
    detail: activity.detail,
    timestamp: activity.timestamp
  });
}

/**
 * Clear Activities
 */
export async function clearActivitiesInSupabase(userId: string): Promise<void> {
  if (!isSupabaseConfigured || !userId) return;

  await supabase.from('activities').delete().eq('user_id', userId);
}

/**
 * Sync Career Roadmaps
 */
export async function syncRoadmaps(userId: string, roadmaps: CareerRoadmap[]): Promise<void> {
  if (!isSupabaseConfigured || !userId) return;

  await supabase.from('career_roadmaps').delete().eq('user_id', userId);

  if (roadmaps.length > 0) {
    const rows = roadmaps.map(r => ({
      user_id: userId,
      id: r.id,
      title: r.title,
      target_role: r.targetRole,
      stages: r.stages,
      is_completed: r.isCompleted,
      created_at: r.createdAt
    }));
    await supabase.from('career_roadmaps').insert(rows);
  }
}

/**
 * Sync Academic Events
 */
export async function syncAcademicEvents(userId: string, events: AcademicEvent[]): Promise<void> {
  if (!isSupabaseConfigured || !userId) return;

  await supabase.from('academic_events').delete().eq('user_id', userId);

  if (events.length > 0) {
    const rows = events.map(ev => ({
      user_id: userId,
      id: ev.id,
      date: ev.date,
      title: ev.title,
      target_year: ev.targetYear ?? null,
      is_holiday: ev.isHoliday || false
    }));
    await supabase.from('academic_events').insert(rows);
  }
}

/**
 * Save Coding Profiles
 */
export async function saveCodingProfilesToSupabase(userId: string, data: any): Promise<void> {
  if (!isSupabaseConfigured || !userId) return;

  await supabase.from('coding_profiles').upsert({
    user_id: userId,
    data,
    updated_at: new Date().toISOString()
  });
}

/**
 * Save Resume Draft
 */
export async function saveResumeDraftToSupabase(userId: string, draft: any): Promise<void> {
  if (!isSupabaseConfigured || !userId) return;

  await supabase.from('resume_drafts').upsert({
    user_id: userId,
    draft,
    updated_at: new Date().toISOString()
  });
}

/**
 * Reset all user data in Supabase
 */
export async function resetAllUserData(userId: string): Promise<void> {
  if (!isSupabaseConfigured || !userId) return;

  await Promise.all([
    supabase.from('profiles').delete().eq('id', userId),
    supabase.from('semesters').delete().eq('user_id', userId),
    supabase.from('attendance_subjects').delete().eq('user_id', userId),
    supabase.from('exams').delete().eq('user_id', userId),
    supabase.from('activities').delete().eq('user_id', userId),
    supabase.from('career_roadmaps').delete().eq('user_id', userId),
    supabase.from('timetable').delete().eq('user_id', userId),
    supabase.from('countdowns').delete().eq('user_id', userId),
    supabase.from('habits').delete().eq('user_id', userId),
    supabase.from('coding_profiles').delete().eq('user_id', userId),
    supabase.from('resume_drafts').delete().eq('user_id', userId),
    supabase.from('academic_events').delete().eq('user_id', userId)
  ]);
}
