-- 用户资料表（扩展 auth.users）
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text,
  avatar_url text,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "用户可读所有资料" on public.profiles for select using (true);
create policy "用户只能修改自己的资料" on public.profiles for update using (auth.uid() = id);

-- 批注表
create table public.annotations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  book_id text not null,
  chapter_id text not null,
  block_id text not null,
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.annotations enable row level security;
create policy "所有人可读批注" on public.annotations for select using (true);
create policy "用户可创建自己的批注" on public.annotations for insert with check (auth.uid() = user_id);
create policy "用户可修改自己的批注" on public.annotations for update using (auth.uid() = user_id);
create policy "用户可删除自己的批注" on public.annotations for delete using (auth.uid() = user_id);

-- 自动创建 profile
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
