-- ============================================
-- Team Task Tracker — Complete Setup Script
-- ============================================
-- Run this ENTIRE script in your Supabase SQL Editor
-- Dashboard: https://supabase.com/dashboard → SQL Editor
-- ============================================

-- =====================
-- STEP 1: Create Tables
-- =====================

-- Profiles (linked to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  avatar_color TEXT DEFAULT '#8ab4f8',
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  github_token TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  kickoff_date DATE,
  target_date DATE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Project Members (who belongs to which project)
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role_title TEXT NOT NULL DEFAULT 'Member',
  display_order INT DEFAULT 0,
  UNIQUE(project_id, user_id)
);
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Weeks
CREATE TABLE IF NOT EXISTS weeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  week_number INT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  date_range TEXT DEFAULT '',
  theme TEXT DEFAULT '',
  UNIQUE(project_id, week_number)
);
ALTER TABLE weeks ENABLE ROW LEVEL SECURITY;

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id UUID REFERENCES weeks(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  is_deliverable BOOLEAN DEFAULT false,
  deliverable_text TEXT DEFAULT '',
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Email Log
CREATE TABLE IF NOT EXISTS email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  sent_by UUID REFERENCES profiles(id),
  sent_to TEXT NOT NULL,
  subject TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;

-- ================================
-- STEP 2: Helper Functions (RLS)
-- ================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_project_member(p_id UUID)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = p_id AND user_id = (SELECT auth.uid())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================
-- STEP 3: RLS Policies
-- ========================

-- Profiles
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE TO authenticated USING (id = (SELECT auth.uid()));
CREATE POLICY "profiles_insert" ON profiles FOR INSERT TO authenticated WITH CHECK (id = (SELECT auth.uid()));

-- Projects
CREATE POLICY "projects_select" ON projects FOR SELECT TO authenticated
  USING (is_admin() OR is_project_member(id));
CREATE POLICY "projects_insert" ON projects FOR INSERT TO authenticated
  WITH CHECK (is_admin());
CREATE POLICY "projects_update" ON projects FOR UPDATE TO authenticated
  USING (is_admin());
CREATE POLICY "projects_delete" ON projects FOR DELETE TO authenticated
  USING (is_admin());

-- Project Members
CREATE POLICY "pm_select" ON project_members FOR SELECT TO authenticated
  USING (is_admin() OR is_project_member(project_id));
CREATE POLICY "pm_insert" ON project_members FOR INSERT TO authenticated
  WITH CHECK (is_admin());
CREATE POLICY "pm_update" ON project_members FOR UPDATE TO authenticated
  USING (is_admin());
CREATE POLICY "pm_delete" ON project_members FOR DELETE TO authenticated
  USING (is_admin());

-- Weeks
CREATE POLICY "weeks_select" ON weeks FOR SELECT TO authenticated
  USING (is_admin() OR is_project_member(project_id));
CREATE POLICY "weeks_insert" ON weeks FOR INSERT TO authenticated
  WITH CHECK (is_admin());
CREATE POLICY "weeks_update" ON weeks FOR UPDATE TO authenticated
  USING (is_admin());
CREATE POLICY "weeks_delete" ON weeks FOR DELETE TO authenticated
  USING (is_admin());

-- Tasks
CREATE POLICY "tasks_select" ON tasks FOR SELECT TO authenticated
  USING (
    is_admin() OR EXISTS (
      SELECT 1 FROM weeks w
      JOIN project_members pm ON pm.project_id = w.project_id
      WHERE w.id = tasks.week_id AND pm.user_id = (SELECT auth.uid())
    )
  );
CREATE POLICY "tasks_insert" ON tasks FOR INSERT TO authenticated
  WITH CHECK (is_admin());
CREATE POLICY "tasks_update" ON tasks FOR UPDATE TO authenticated
  USING (is_admin() OR assigned_to = (SELECT auth.uid()));
CREATE POLICY "tasks_delete" ON tasks FOR DELETE TO authenticated
  USING (is_admin());

-- Email Log
CREATE POLICY "email_log_select" ON email_log FOR SELECT TO authenticated
  USING (is_admin());
CREATE POLICY "email_log_insert" ON email_log FOR INSERT TO authenticated
  WITH CHECK (is_admin());

-- ================================
-- STEP 4: Auto-create profile trigger
-- ================================
-- When someone signs up, their profile is automatically created.
-- The FIRST user to sign up becomes admin.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    CASE 
      WHEN NOT EXISTS (SELECT 1 FROM public.profiles) THEN 'admin'
      ELSE 'member'
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================
-- STEP 5: Indexes for performance
-- ================================

CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_weeks_project ON weeks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_week ON tasks(week_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- ================================
-- STEP 6: Create profile for EXISTING users
-- ================================
-- If you already signed up BEFORE running this script,
-- this creates your profile and makes you admin.

INSERT INTO public.profiles (id, full_name, email, role)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
  email,
  'admin'  -- First user = admin
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ORDER BY created_at ASC
LIMIT 1;

-- Any remaining users without profiles become members
INSERT INTO public.profiles (id, full_name, email, role)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
  email,
  'member'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);
