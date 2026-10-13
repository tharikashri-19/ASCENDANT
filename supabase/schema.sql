-- ====================================================================
-- ASCENDANT (Gradence) - Supabase Database Schema
-- Run this script in the Supabase SQL Editor (Dashboard -> SQL Editor)
-- ====================================================================

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Student',
    university TEXT NOT NULL DEFAULT 'General University',
    current_semester INT NOT NULL DEFAULT 1,
    theme TEXT NOT NULL DEFAULT 'se-light',
    gpa_scale INT NOT NULL DEFAULT 10,
    groq_api_key TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Semesters Table
CREATE TABLE IF NOT EXISTS public.semesters (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    id TEXT NOT NULL,
    number INT NOT NULL,
    name TEXT NOT NULL,
    sgpa NUMERIC(4,2) NOT NULL DEFAULT 0.00,
    total_credits INT NOT NULL DEFAULT 0,
    subjects JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, number)
);

-- 3. Attendance Subjects Table
CREATE TABLE IF NOT EXISTS public.attendance_subjects (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    id TEXT NOT NULL,
    name TEXT NOT NULL,
    present INT NOT NULL DEFAULT 0,
    total INT NOT NULL DEFAULT 0,
    required_percentage INT NOT NULL DEFAULT 75,
    history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, id)
);

-- 4. Exams Table
CREATE TABLE IF NOT EXISTS public.exams (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    id TEXT NOT NULL,
    subject TEXT NOT NULL,
    date TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, id)
);

-- 5. Timetable Table
CREATE TABLE IF NOT EXISTS public.timetable (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    id TEXT NOT NULL,
    subject TEXT NOT NULL,
    time TEXT NOT NULL,
    room TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, id)
);

-- 6. Countdowns Table
CREATE TABLE IF NOT EXISTS public.countdowns (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    id TEXT NOT NULL,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, id)
);

-- 7. Habits Table
CREATE TABLE IF NOT EXISTS public.habits (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    id TEXT NOT NULL,
    name TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, id)
);

-- 8. Activities (Audit Log) Table
CREATE TABLE IF NOT EXISTS public.activities (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    detail TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, id)
);

-- 9. Career Roadmaps Table
CREATE TABLE IF NOT EXISTS public.career_roadmaps (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    id TEXT NOT NULL,
    title TEXT NOT NULL,
    target_role TEXT NOT NULL,
    stages JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, id)
);

-- 10. Academic Events Table
CREATE TABLE IF NOT EXISTS public.academic_events (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    id TEXT NOT NULL,
    date TEXT NOT NULL,
    title TEXT NOT NULL,
    target_year INT,
    is_holiday BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, id)
);

-- 11. Coding Profiles Table
CREATE TABLE IF NOT EXISTS public.coding_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Resume Drafts Table
CREATE TABLE IF NOT EXISTS public.resume_drafts (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    draft JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- Enable Row Level Security (RLS) on all tables
-- ====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.countdowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coding_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_drafts ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- RLS Policies (Users can only read & write their own records)
-- ====================================================================

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can delete own profile" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- Semesters
CREATE POLICY "Users can view own semesters" ON public.semesters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own semesters" ON public.semesters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own semesters" ON public.semesters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own semesters" ON public.semesters FOR DELETE USING (auth.uid() = user_id);

-- Attendance Subjects
CREATE POLICY "Users can view own attendance" ON public.attendance_subjects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own attendance" ON public.attendance_subjects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own attendance" ON public.attendance_subjects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own attendance" ON public.attendance_subjects FOR DELETE USING (auth.uid() = user_id);

-- Exams
CREATE POLICY "Users can view own exams" ON public.exams FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own exams" ON public.exams FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own exams" ON public.exams FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own exams" ON public.exams FOR DELETE USING (auth.uid() = user_id);

-- Timetable
CREATE POLICY "Users can view own timetable" ON public.timetable FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own timetable" ON public.timetable FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own timetable" ON public.timetable FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own timetable" ON public.timetable FOR DELETE USING (auth.uid() = user_id);

-- Countdowns
CREATE POLICY "Users can view own countdowns" ON public.countdowns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own countdowns" ON public.countdowns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own countdowns" ON public.countdowns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own countdowns" ON public.countdowns FOR DELETE USING (auth.uid() = user_id);

-- Habits
CREATE POLICY "Users can view own habits" ON public.habits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own habits" ON public.habits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own habits" ON public.habits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own habits" ON public.habits FOR DELETE USING (auth.uid() = user_id);

-- Activities
CREATE POLICY "Users can view own activities" ON public.activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activities" ON public.activities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own activities" ON public.activities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own activities" ON public.activities FOR DELETE USING (auth.uid() = user_id);

-- Career Roadmaps
CREATE POLICY "Users can view own roadmaps" ON public.career_roadmaps FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own roadmaps" ON public.career_roadmaps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own roadmaps" ON public.career_roadmaps FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own roadmaps" ON public.career_roadmaps FOR DELETE USING (auth.uid() = user_id);

-- Academic Events
CREATE POLICY "Users can view own academic events" ON public.academic_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own academic events" ON public.academic_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own academic events" ON public.academic_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own academic events" ON public.academic_events FOR DELETE USING (auth.uid() = user_id);

-- Coding Profiles
CREATE POLICY "Users can view own coding profiles" ON public.coding_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own coding profiles" ON public.coding_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own coding profiles" ON public.coding_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own coding profiles" ON public.coding_profiles FOR DELETE USING (auth.uid() = user_id);

-- Resume Drafts
CREATE POLICY "Users can view own resume drafts" ON public.resume_drafts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own resume drafts" ON public.resume_drafts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own resume drafts" ON public.resume_drafts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own resume drafts" ON public.resume_drafts FOR DELETE USING (auth.uid() = user_id);

-- ====================================================================
-- Automatic Profile Creation Trigger on Auth Signup
-- ====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, university, current_semester, theme, gpa_scale, groq_api_key)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', 'Student'),
        COALESCE(NEW.raw_user_meta_data->>'university', 'General University'),
        1,
        'se-light',
        10,
        ''
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
