-- ═══════════════════════════════════════════════════════════════
-- Step 1 Migration: role + books RLS + chapters RLS
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- Safe to re-run: uses IF NOT EXISTS / DROP IF EXISTS
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Add role column to profiles ──────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user'
  CHECK (role IN ('admin', 'user'));

-- To make yourself admin, run:
--   UPDATE public.profiles SET role = 'admin' WHERE id = '<your-user-uuid>';

-- ── 2. Ensure local_books has created_at ─────────────────────────
ALTER TABLE public.local_books
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- ── 3. Enable RLS on local_books ────────────────────────────────
ALTER TABLE public.local_books ENABLE ROW LEVEL SECURITY;

-- Drop old policies so we can recreate cleanly
DROP POLICY IF EXISTS "所有人可读书籍"   ON public.local_books;
DROP POLICY IF EXISTS "用户可创建书籍"   ON public.local_books;
DROP POLICY IF EXISTS "用户可更新书籍"   ON public.local_books;
DROP POLICY IF EXISTS "用户可删除书籍"   ON public.local_books;
-- Also drop any old-style policies that might exist
DROP POLICY IF EXISTS "Enable read access for all users"  ON public.local_books;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.local_books;

-- Anyone can read books
CREATE POLICY "所有人可读书籍" ON public.local_books
  FOR SELECT USING (true);

-- Users can only create books under their own user_id
CREATE POLICY "用户可创建书籍" ON public.local_books
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users update their own books; admins update any
CREATE POLICY "用户可更新书籍" ON public.local_books
  FOR UPDATE USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Users delete their own books; admins delete any
CREATE POLICY "用户可删除书籍" ON public.local_books
  FOR DELETE USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── 4. Enable RLS on chapters ────────────────────────────────────
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "所有人可读章节" ON public.chapters;
DROP POLICY IF EXISTS "用户可新增章节" ON public.chapters;
DROP POLICY IF EXISTS "用户可更新章节" ON public.chapters;
DROP POLICY IF EXISTS "用户可删除章节" ON public.chapters;

-- Anyone can read chapters
CREATE POLICY "所有人可读章节" ON public.chapters
  FOR SELECT USING (true);

-- Only the book owner (or admin) can insert chapters
CREATE POLICY "用户可新增章节" ON public.chapters
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.local_books
      WHERE id = book_id AND user_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Only the book owner (or admin) can update chapters
CREATE POLICY "用户可更新章节" ON public.chapters
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.local_books
      WHERE id = book_id AND user_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Only the book owner (or admin) can delete chapters
CREATE POLICY "用户可删除章节" ON public.chapters
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.local_books
      WHERE id = book_id AND user_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── 5. Verify ───────────────────────────────────────────────────
-- After running, check:
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'profiles' AND column_name = 'role';
--
--   SELECT policyname FROM pg_policies WHERE tablename = 'local_books';
--   SELECT policyname FROM pg_policies WHERE tablename = 'chapters';
