-- =========================================================
-- 20260917000800_calendar_docs_sops_audit
-- Business calendar, document metadata, SOPs, audit log.
-- =========================================================

create table public.business_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_type text check (event_type in
    ('payroll','invoice_cycle','tax_deadline','marketing_launch','team_meeting',
     'vendor_renewal','contract_expiration','project_milestone','filing','other')),
  event_date date not null,
  notes text,
  related_entity_type text, -- optional polymorphic link, e.g. 'vendor', 'project'
  related_entity_id uuid,
  created_at timestamptz not null default now()
);
alter table public.business_events enable row level security;
create index business_events_event_date_idx on public.business_events(event_date);

-- Documents store metadata + an external link only for MVP (PRD §31).
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text check (category in
    ('legal','finance','hr','tutors','clients','marketing','operations','policies','templates','contracts')),
  external_url text not null,
  notes text,
  created_at timestamptz not null default now()
);
alter table public.documents enable row level security;

create table public.sops (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text,
  description text,
  content text not null,
  owner_id uuid references auth.users(id),
  version integer not null default 1,
  status text not null default 'active' check (status in ('draft','active','archived')),
  updated_at timestamptz not null default now()
);
alter table public.sops enable row level security;
create trigger sops_set_updated_at
  before update on public.sops
  for each row execute function public.set_updated_at();

-- Append-only audit trail. No UPDATE/DELETE policies are ever granted (see the
-- policies migration) so history cannot be rewritten from the app.
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id),
  action text not null,        -- e.g. 'invoice.status_changed', 'expense.deleted'
  entity_type text not null,
  entity_id uuid not null,
  previous_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);
alter table public.audit_logs enable row level security;
create index audit_logs_entity_idx on public.audit_logs(entity_type, entity_id);
