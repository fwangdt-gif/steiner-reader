-- ═══════════════════════════════════════════════════════════════
-- Step 2 Migration: announcements table
-- Run in Supabase SQL Editor after supabase-step1.sql
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Create announcements table ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.announcements (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  title      text        NOT NULL,
  content    text        NOT NULL,
  event_time timestamptz,
  location   text,
  is_pinned  boolean     NOT NULL DEFAULT false,
  created_by uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- ── 2. RLS policies ───────────────────────────────────────────────
DROP POLICY IF EXISTS "所有人可读通知" ON public.announcements;
CREATE POLICY "所有人可读通知" ON public.announcements
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "管理员可发布通知" ON public.announcements;
CREATE POLICY "管理员可发布通知" ON public.announcements
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "管理员可编辑通知" ON public.announcements;
CREATE POLICY "管理员可编辑通知" ON public.announcements
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "管理员可删除通知" ON public.announcements;
CREATE POLICY "管理员可删除通知" ON public.announcements
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── 3. Insert a sample pinned announcement to test ───────────────
-- (optional — uncomment and set your user id to test)
-- INSERT INTO public.announcements (title, content, is_pinned, created_by)
-- VALUES ('欢迎加入 Steiner 共读平台', '本读书会每月举行一次线上共读，欢迎大家参与。', true, '<your-user-uuid>');
