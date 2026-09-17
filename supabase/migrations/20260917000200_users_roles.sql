-- =========================================================
-- 20260917000200_users_roles
-- Users, roles, and the user<->role join. RLS enabled immediately.
-- =========================================================

create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  created_at timestamptz not null default now()
);
alter table public.user_profiles enable row level security;

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (name in
    ('owner','admin','operations_manager','finance','tutor','contractor','employee'))
);
alter table public.roles enable row level security;

create table public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete restrict,
  primary key (user_id, role_id)
);
alter table public.user_roles enable row level security;

-- Reference data: the seven roles the system understands. Inserted in a
-- migration (not seed.sql) so every environment — including production — has
-- them. Only 'owner'/'admin' are used in Phase 1; the rest are reserved for
-- later phases per PRD §6.
insert into public.roles (name) values
  ('owner'),
  ('admin'),
  ('operations_manager'),
  ('finance'),
  ('tutor'),
  ('contractor'),
  ('employee')
on conflict (name) do nothing;
