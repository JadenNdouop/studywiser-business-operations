-- =========================================================
-- 20261001000100_org_settings
-- Single-row business settings for the Admin → Settings screen:
-- business profile + billing defaults. The singleton is enforced with a
-- boolean primary key fixed to true, so there can only ever be one row.
-- Readable by staff; only admins/owners can change it.
-- =========================================================

create table if not exists public.org_settings (
  id boolean primary key default true,
  business_name text not null default 'StudyWiser',
  legal_name text,
  email text,
  phone text,
  website text,
  address text,
  default_hourly_rate numeric(12,2) not null default 35,
  invoice_prefix text not null default 'SW',
  updated_at timestamptz not null default now(),
  constraint org_settings_singleton check (id = true)
);

alter table public.org_settings enable row level security;

create policy org_settings_select on public.org_settings
  for select to authenticated
  using (public.is_staff());

create policy org_settings_manage on public.org_settings
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create trigger org_settings_set_updated_at
  before update on public.org_settings
  for each row execute function public.set_updated_at();

-- Seed the single row so the screen always has something to load/edit.
insert into public.org_settings (id) values (true) on conflict (id) do nothing;
