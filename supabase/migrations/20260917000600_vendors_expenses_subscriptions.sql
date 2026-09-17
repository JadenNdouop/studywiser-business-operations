-- =========================================================
-- 20260917000600_vendors_expenses_subscriptions
-- Vendors, expenses (doubles as Accounts Payable via payment_status),
-- and software subscriptions. Vendors created first so expenses can
-- reference it directly.
-- =========================================================

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  contact_name text,
  email text,
  website text,
  service_provided text,
  cost numeric(12,2),
  billing_frequency text check (billing_frequency in ('one_time','monthly','quarterly','annual')),
  start_date date,
  renewal_date date,
  status text not null default 'active' check (status in ('active','inactive')),
  notes text,
  created_at timestamptz not null default now()
);
alter table public.vendors enable row level security;

-- Expenses double as Accounts Payable: AP is the filtered view where
-- payment_status != 'paid' (Step 1, item 3), not a separate table.
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  payee text not null, -- vendor, worker, or free text
  vendor_id uuid references public.vendors(id) on delete set null,
  date date not null default current_date,
  due_date date,
  category text not null check (category in
    ('tutor_compensation','contractor_compensation','software','marketing','advertising',
     'insurance','legal','accounting','banking_fees','office_supplies','technology',
     'website','professional_services','other')),
  description text,
  amount numeric(12,2) not null check (amount > 0),
  payment_method text,
  recurring_status text not null default 'one_time' check (recurring_status in ('one_time','recurring')),
  payment_status text not null default 'pending'
    check (payment_status in ('pending','scheduled','paid','overdue')),
  payment_date date,
  receipt_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.expenses enable row level security;
create index expenses_category_idx on public.expenses(category);
-- Partial index powering the Accounts Payable view (unpaid expenses only).
create index expenses_open_payment_status_idx
  on public.expenses(payment_status) where payment_status != 'paid';
create trigger expenses_set_updated_at
  before update on public.expenses
  for each row execute function public.set_updated_at();

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  service_name text not null,
  vendor_id uuid references public.vendors(id) on delete set null,
  category text,
  monthly_cost numeric(12,2),
  annual_cost numeric(12,2),
  billing_frequency text check (billing_frequency in ('monthly','annual')),
  renewal_date date,
  payment_method text,
  owner_id uuid references auth.users(id),
  status text not null default 'active' check (status in ('active','cancelled')),
  created_at timestamptz not null default now()
);
alter table public.subscriptions enable row level security;
create index subscriptions_renewal_date_idx on public.subscriptions(renewal_date);
