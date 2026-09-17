-- =========================================================
-- 20260917000700_projects_tasks
-- Projects and their tasks.
-- =========================================================

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  owner_id uuid references auth.users(id),
  start_date date,
  due_date date,
  priority text check (priority in ('low','medium','high','urgent')),
  status text not null default 'planned' check (status in ('planned','in_progress','blocked','completed','cancelled')),
  progress_percent integer check (progress_percent between 0 and 100),
  budget numeric(12,2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.projects enable row level security;
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  project_id uuid references public.projects(id) on delete set null,
  assigned_user_id uuid references auth.users(id),
  priority text check (priority in ('low','medium','high','urgent')),
  due_date date,
  status text not null default 'to_do' check (status in ('to_do','in_progress','blocked','completed')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
alter table public.tasks enable row level security;
create index tasks_status_idx on public.tasks(status);
create index tasks_due_date_idx on public.tasks(due_date);
