-- ═══════════════════════════════════════════════════════════════
-- Step 5 Migration: notes + reflections tables
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ── 1. notes 表（私人笔记，与章节关联）─────────────────────────
CREATE TABLE IF NOT EXISTS public.notes (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id    text        NOT NULL,
  chapter_id text        NOT NULL,
  content    text        NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS notes_user_chapter_idx
  ON public.notes (user_id, book_id, chapter_id);

-- 只有自己能读写
CREATE POLICY "用户只能读自己的笔记" ON public.notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可创建笔记" ON public.notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可更新笔记" ON public.notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户可删除笔记" ON public.notes
  FOR DELETE USING (auth.uid() = user_id);

-- ── 2. reflections 表（读后感，与书关联）────────────────────────
CREATE TABLE IF NOT EXISTS public.reflections (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id    text        NOT NULL,
  title      text        NOT NULL DEFAULT '',
  content    text        NOT NULL,
  is_public  boolean     NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS reflections_book_idx
  ON public.reflections (book_id, is_public, created_at);

-- 公开的所有人可读；私有的只有自己可读
CREATE POLICY "读后感可见规则" ON public.reflections
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "用户可创建读后感" ON public.reflections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可更新读后感" ON public.reflections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户可删除读后感" ON public.reflections
  FOR DELETE USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
