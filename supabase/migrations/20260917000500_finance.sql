-- =========================================================
-- 20260917000500_finance
-- Invoices, invoice items, payments, revenue ledger.
-- =========================================================

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique, -- e.g. SW-2026-0001
  client_id uuid not null references public.clients(id) on delete restrict,
  issue_date date not null default current_date,
  due_date date,
  subtotal numeric(12,2) not null default 0,
  adjustments numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  amount_paid numeric(12,2) not null default 0,
  balance numeric(12,2) not null default 0,
  status text not null default 'draft'
    check (status in ('draft','sent','partially_paid','paid','overdue','cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.invoices enable row level security;
create index invoices_client_id_idx on public.invoices(client_id);
create index invoices_status_idx on public.invoices(status);
create trigger invoices_set_updated_at
  before update on public.invoices
  for each row execute function public.set_updated_at();

create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  quantity numeric(10,2) not null default 1,
  rate numeric(12,2) not null,
  amount numeric(12,2) not null,
  created_at timestamptz not null default now()
);
alter table public.invoice_items enable row level security;
create index invoice_items_invoice_id_idx on public.invoice_items(invoice_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete restrict,
  client_id uuid not null references public.clients(id) on delete restrict,
  amount numeric(12,2) not null check (amount > 0),
  payment_date date not null default current_date,
  payment_method text,
  reference_number text,
  notes text,
  created_at timestamptz not null default now()
);
alter table public.payments enable row level security;
create index payments_invoice_id_idx on public.payments(invoice_id);
create index payments_client_id_idx on public.payments(client_id);

-- Revenue: the general income ledger. Either generated from a payment, or
-- logged manually for income that never went through an invoice. The unique
-- index on payment_id guarantees one invoice payment can never be recorded as
-- income twice (Step 1, item 2 of the architecture doc).
create table public.revenue (
  id uuid primary key default gen_random_uuid(),
  date date not null default current_date,
  client_id uuid references public.clients(id),
  category text not null check (category in ('tutoring','consultation','educational_services','other')),
  description text,
  amount numeric(12,2) not null check (amount > 0),
  source text not null default 'manual' check (source in ('manual','invoice_payment','app_integration')),
  payment_id uuid references public.payments(id),
  notes text,
  created_at timestamptz not null default now()
);
alter table public.revenue enable row level security;
create unique index one_revenue_row_per_payment
  on public.revenue(payment_id) where payment_id is not null;
create index revenue_date_idx on public.revenue(date);
create index revenue_category_idx on public.revenue(category);
