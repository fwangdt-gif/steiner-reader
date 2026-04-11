-- 管理员对静态 Steiner 书籍的隐藏控制
-- 在 Supabase SQL Editor 运行此文件

CREATE TABLE IF NOT EXISTS public.book_overrides (
  book_id  text PRIMARY KEY,       -- 对应 lib/books.json 里的 id
  hidden   boolean NOT NULL DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.book_overrides ENABLE ROW LEVEL SECURITY;

-- 所有人可读（用于渲染时过滤隐藏书籍）
CREATE POLICY "所有人可读书籍状态" ON public.book_overrides
  FOR SELECT USING (true);

-- 仅管理员可写
CREATE POLICY "管理员可管理书籍状态" ON public.book_overrides
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
