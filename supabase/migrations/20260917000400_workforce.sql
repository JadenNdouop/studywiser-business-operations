-- =========================================================
-- 20260917000400_workforce
-- Workers, tutor details, compensation, worker payments.
-- =========================================================

create table public.workers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  worker_type text not null check (worker_type in ('employee','tutor','contractor')),
  role_title text,
  status text not null default 'active' check (status in ('active','inactive','on_leave')),
  start_date date,
  end_date date,
  compensation_type text check (compensation_type in ('hourly','salary','per_session','flat_rate')),
  compensation_rate numeric(12,2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.workers enable row level security;
create index workers_worker_type_idx on public.workers(worker_type);
create trigger workers_set_updated_at
  before update on public.workers
  for each row execute function public.set_updated_at();

-- Tutor business-relationship fields only (NOT tutoring/session delivery detail
-- — that belongs to the customer-facing App).
create table public.tutor_details (
  worker_id uuid primary key references public.workers(id) on delete cascade,
  contractor_status text,      -- e.g. 'W-9 on file', informational
  documentation_status text,
  current_client_load integer,
  external_app_tutor_id text   -- reserved join key for future App integration
);
alter table public.tutor_details enable row level security;

create table public.compensation_records (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.workers(id) on delete restrict,
  period_start date not null,
  period_end date not null,
  units numeric(10,2),         -- hours or sessions, per compensation_type
  rate numeric(12,2) not null,
  amount_earned numeric(12,2) not null check (amount_earned >= 0),
  notes text,
  created_at timestamptz not null default now(),
  check (period_end >= period_start)
);
alter table public.compensation_records enable row level security;
create index compensation_records_worker_id_idx on public.compensation_records(worker_id);

create table public.worker_payments (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.workers(id) on delete restrict,
  payment_date date not null default current_date,
  amount numeric(12,2) not null check (amount > 0),
  payment_method text,
  reference_number text,
  notes text,
  created_at timestamptz not null default now()
);
alter table public.worker_payments enable row level security;
create index worker_payments_worker_id_idx on public.worker_payments(worker_id);

-- Prevents double-paying the same compensation record (mirrors invoice_items).
create table public.worker_payment_items (
  id uuid primary key default gen_random_uuid(),
  worker_payment_id uuid not null references public.worker_payments(id) on delete cascade,
  compensation_record_id uuid not null references public.compensation_records(id) on delete restrict,
  amount numeric(12,2) not null
);
alter table public.worker_payment_items enable row level security;
create unique index one_payment_item_per_compensation_record
  on public.worker_payment_items(compensation_record_id);
