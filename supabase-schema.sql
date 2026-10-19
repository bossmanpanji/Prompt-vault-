-- ============================================================================
-- PROMPTVAULT - SUPABASE DATABASE SCHEMA
-- ============================================================================
-- Petunjuk:
-- Salin dan jalankan script SQL ini di Supabase SQL Editor (Dashboard Supabase > SQL Editor > New query).
-- Script ini membuat tabel `projects` dan `prompts` lengkap dengan RLS (Row Level Security)
-- sehingga data setiap pengguna terisolasi secara aman menggunakan `auth.uid()`.
-- ============================================================================

-- 1. Buat Tabel Proyek (projects)
create table if not exists public.projects (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text default '',
  custom_instructions text default '',
  color text default '#cc785c',
  icon text default 'Folder',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 2. Buat Tabel Prompts (prompts)
create table if not exists public.prompts (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id text references public.projects(id) on delete set null,
  title text not null,
  content text not null,
  description text default '',
  tags text[] default array[]::text[],
  variables text[] default array[]::text[],
  category text default 'Coding & Tech',
  target_model text default 'Claude 3.7 Sonnet',
  is_favorite boolean default false not null,
  copy_count integer default 0 not null,
  last_used_at timestamptz,
  versions jsonb default '[]'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 3. Indeks untuk Optimasi Performa Query
create index if not exists idx_projects_user_id on public.projects(user_id);
create index if not exists idx_projects_created_at on public.projects(created_at desc);

create index if not exists idx_prompts_user_id on public.prompts(user_id);
create index if not exists idx_prompts_project_id on public.prompts(project_id);
create index if not exists idx_prompts_category on public.prompts(category);
create index if not exists idx_prompts_updated_at on public.prompts(updated_at desc);
create index if not exists idx_prompts_is_favorite on public.prompts(is_favorite);

-- ============================================================================
-- 4. AKTIFKAN ROW LEVEL SECURITY (RLS)
-- ============================================================================
alter table public.projects enable row level security;
alter table public.prompts enable row level security;

-- ============================================================================
-- 5. KEBIJAKAN KEAMANAN (POLICIES) UNTUK TABEL PROJECTS
-- ============================================================================

-- Pengguna hanya dapat membaca proyek miliknya sendiri
create policy "Users can view their own projects"
  on public.projects
  for select
  using (auth.uid() = user_id);

-- Pengguna hanya dapat membuat proyek dengan user_id miliknya
create policy "Users can insert their own projects"
  on public.projects
  for insert
  with check (auth.uid() = user_id);

-- Pengguna hanya dapat memperbarui proyek miliknya sendiri
create policy "Users can update their own projects"
  on public.projects
  for update
  using (auth.uid() = user_id);

-- Pengguna hanya dapat menghapus proyek miliknya sendiri
create policy "Users can delete their own projects"
  on public.projects
  for delete
  using (auth.uid() = user_id);

-- ============================================================================
-- 6. KEBIJAKAN KEAMANAN (POLICIES) UNTUK TABEL PROMPTS
-- ============================================================================

-- Pengguna hanya dapat membaca prompt miliknya sendiri
create policy "Users can view their own prompts"
  on public.prompts
  for select
  using (auth.uid() = user_id);

-- Pengguna hanya dapat membuat prompt dengan user_id miliknya
create policy "Users can insert their own prompts"
  on public.prompts
  for insert
  with check (auth.uid() = user_id);

-- Pengguna hanya dapat memperbarui prompt miliknya sendiri
create policy "Users can update their own prompts"
  on public.prompts
  for update
  using (auth.uid() = user_id);

-- Pengguna hanya dapat menghapus prompt miliknya sendiri
create policy "Users can delete their own prompts"
  on public.prompts
  for delete
  using (auth.uid() = user_id);
