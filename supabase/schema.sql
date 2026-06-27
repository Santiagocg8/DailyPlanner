-- ===========================================================================
-- Daily Planner — esquema de base de datos (Supabase / Postgres)
-- Ejecuta este script en el SQL Editor de tu proyecto Supabase.
-- ===========================================================================

create extension if not exists "pgcrypto";

-- Personas del hogar -------------------------------------------------------
create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text not null default '#6d5efc',
  avatar_emoji text,
  is_admin boolean not null default false
);

-- Si la tabla ya existía sin la columna, la agregamos.
alter table public.people add column if not exists is_admin boolean not null default false;

-- Grupos / categorías de tareas --------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text not null default '#8b5cf6'
);

-- Tareas --------------------------------------------------------------------
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  notes text,
  scheduled_at timestamptz not null,
  duration_min int not null default 30,
  person_id uuid references public.people(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','done','postponed')),
  created_at timestamptz not null default now()
);

create index if not exists tasks_scheduled_at_idx on public.tasks (scheduled_at);

-- Realtime: notificar cambios en tasks/people/categories --------------------
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.people;
alter publication supabase_realtime add table public.categories;

-- RLS: acceso abierto (app doméstica detrás de un link privado) -------------
alter table public.people enable row level security;
alter table public.categories enable row level security;
alter table public.tasks enable row level security;

create policy "open people"     on public.people     for all using (true) with check (true);
create policy "open categories" on public.categories for all using (true) with check (true);
create policy "open tasks"      on public.tasks      for all using (true) with check (true);

-- Despensa (ingredientes compartidos) -------------------------------------
create table if not exists public.pantry_items (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_baby_safe boolean not null default false,
  is_fruit boolean not null default false,
  created_at timestamptz not null default now()
);

alter publication supabase_realtime add table public.pantry_items;

alter table public.pantry_items enable row level security;
create policy "open pantry" on public.pantry_items for all using (true) with check (true);

-- Datos iniciales -----------------------------------------------------------
insert into public.people (name, color, avatar_emoji, is_admin) values
  ('Mamá',     '#ec4899', '👩', false),
  ('Papá',     '#3b82f6', '👨', true),
  ('Hijo',     '#22c55e', '🧒', false),
  ('Empleada', '#f59e0b', '🧹', false)
on conflict do nothing;

insert into public.categories (name, color) values
  ('Casa',    '#8b5cf6'),
  ('Colegio', '#06b6d4'),
  ('Jardín',  '#10b981')
on conflict do nothing;
