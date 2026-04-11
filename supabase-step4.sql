-- ═══════════════════════════════════════════════════════════════
-- Step 4 Migration: comments table
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.comments (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id    text        NOT NULL,   -- text, not uuid FK — supports both static and cloud books
  chapter_id text        NOT NULL,
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content    text        NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Fast lookup by chapter
CREATE INDEX IF NOT EXISTS comments_chapter_idx
  ON public.comments (book_id, chapter_id, created_at);

-- RLS
DROP POLICY IF EXISTS "所有人可读评论" ON public.comments;
CREATE POLICY "所有人可读评论" ON public.comments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "用户可发评论" ON public.comments;
CREATE POLICY "用户可发评论" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "用户可编辑自己的评论" ON public.comments;
CREATE POLICY "用户可编辑自己的评论" ON public.comments
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "用户可删自己的评论" ON public.comments;
CREATE POLICY "用户可删自己的评论" ON public.comments
  FOR DELETE USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
