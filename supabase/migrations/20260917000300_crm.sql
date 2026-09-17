-- =========================================================
-- 20260917000300_crm
-- CRM & Sales: leads, lead_activities, clients.
-- =========================================================

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  guardian_name text not null,
  student_name text,
  grade text,
  subject_needed text,
  phone text,
  email text,
  location text,
  lead_source text check (lead_source in
    ('referral','google','instagram','facebook','website','school','community_event','word_of_mouth','other')),
  date_received date not null default current_date,
  assigned_staff_id uuid references auth.users(id),
  estimated_value numeric(12,2),
  pipeline_stage text not null default 'new_lead' check (pipeline_stage in
    ('new_lead','contacted','consultation','interested','enrollment_pending','converted','lost')),
  last_contact_date date,
  next_follow_up_date date,
  notes text,
  converted_client_id uuid, -- FK added below once clients exists
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.leads enable row level security;
create index leads_pipeline_stage_idx on public.leads(pipeline_stage);
create index leads_next_follow_up_date_idx on public.leads(next_follow_up_date);
create trigger leads_set_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

create table public.lead_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  activity_type text not null check (activity_type in ('call','email','text','meeting','note','stage_change')),
  contact_method text,
  notes text,
  occurred_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);
alter table public.lead_activities enable row level security;
create index lead_activities_lead_id_idx on public.lead_activities(lead_id);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  family_name text not null,
  primary_contact_name text,
  email text,
  phone text,
  status text not null default 'active' check (status in ('active','paused','inactive','lost')),
  acquisition_source text,
  customer_since date,
  external_app_client_id text, -- reserved join key for future App integration; unused for now
  billing_notes text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.clients enable row level security;
create unique index clients_external_app_client_id_key
  on public.clients(external_app_client_id) where external_app_client_id is not null;
create trigger clients_set_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

-- Now that clients exists, wire up the lead -> converted client link.
alter table public.leads
  add constraint leads_converted_client_fk foreign key (converted_client_id)
  references public.clients(id) on delete set null;
