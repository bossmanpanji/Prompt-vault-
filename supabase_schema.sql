-- ==============================================================================
-- PromptVault - Supabase Database Schema & RLS Policies
-- ==============================================================================
-- Jalankan skrip SQL ini langsung di Supabase SQL Editor (Dashboard > SQL Editor)
-- Semua data dilindungi dengan Row Level Security (RLS) berbasis auth.uid().
-- ==============================================================================

-- 1. EXTENSIONS (Opsional: UUID generation)
create extension if not exists "uuid-ossp";

-- ==============================================================================
-- 2. TABEL: PROJECTS (Proyek Prompt)
-- ==============================================================================
create table if not exists public.projects (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text default '',
  custom_instructions text default '',
  color text default '#cc785c',
  icon text default 'Folder',
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- Index untuk mempercepat query berdasarkan user_id
create index if not exists idx_projects_user_id on public.projects(user_id);
create index if not exists idx_projects_updated_at on public.projects(updated_at desc);

-- Aktifkan Row Level Security (RLS) pada tabel projects
alter table public.projects enable row level security;

-- Kebijakan RLS Projects (Hanya user pemilik data yang dapat mengakses & memodifikasi)
drop policy if exists "Users can view own projects" on public.projects;
create policy "Users can view own projects"
  on public.projects for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own projects" on public.projects;
create policy "Users can insert own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own projects" on public.projects;
create policy "Users can update own projects"
  on public.projects for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own projects" on public.projects;
create policy "Users can delete own projects"
  on public.projects for delete
  using (auth.uid() = user_id);


-- ==============================================================================
-- 3. TABEL: PROMPTS (Koleksi Prompt & Template Variabel)
-- ==============================================================================
create table if not exists public.prompts (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id text references public.projects(id) on delete set null,
  title text not null,
  content text not null,
  description text default '',
  tags text[] default array[]::text[],
  variables text[] default array[]::text[],
  category text not null default 'Coding & Tech',
  target_model text default 'Claude 3.7 Sonnet',
  is_favorite boolean not null default false,
  copy_count integer not null default 0,
  last_used_at timestamptz,
  versions jsonb default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- Index untuk performa pencarian, filtering proyek, dan kategori
create index if not exists idx_prompts_user_id on public.prompts(user_id);
create index if not exists idx_prompts_project_id on public.prompts(project_id);
create index if not exists idx_prompts_category on public.prompts(category);
create index if not exists idx_prompts_is_favorite on public.prompts(is_favorite);
create index if not exists idx_prompts_updated_at on public.prompts(updated_at desc);

-- Aktifkan Row Level Security (RLS) pada tabel prompts
alter table public.prompts enable row level security;

-- Kebijakan RLS Prompts (Hanya user pemilik data yang dapat mengakses & memodifikasi)
drop policy if exists "Users can view own prompts" on public.prompts;
create policy "Users can view own prompts"
  on public.prompts for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own prompts" on public.prompts;
create policy "Users can insert own prompts"
  on public.prompts for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own prompts" on public.prompts;
create policy "Users can update own prompts"
  on public.prompts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own prompts" on public.prompts;
create policy "Users can delete own prompts"
  on public.prompts for delete
  using (auth.uid() = user_id);


-- ==============================================================================
-- 4. TRIGGER OTOMATIS: Update updated_at saat data berubah
-- ==============================================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
  before update on public.projects
  for each row execute function public.handle_updated_at();

drop trigger if exists set_prompts_updated_at on public.prompts;
create trigger set_prompts_updated_at
  before update on public.prompts
  for each row execute function public.handle_updated_at();
