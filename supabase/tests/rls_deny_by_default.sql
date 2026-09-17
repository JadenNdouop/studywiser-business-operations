-- =========================================================
-- RLS deny-by-default verification (Phase 1 acceptance criterion #2)
--
-- Proves that the `anon` role (the role PostgREST assumes for an
-- unauthenticated anon-key request) can read ZERO rows from every table,
-- even when those tables contain data, and cannot insert.
--
-- Run against a local Supabase instance:
--     supabase start
--     psql "$(supabase status -o env | grep DB_URL | cut -d= -f2- | tr -d '\"')" \
--          -f supabase/tests/rls_deny_by_default.sql
--
-- Exits with an error (non-zero) if any table leaks a row to anon.
-- =========================================================

\set ON_ERROR_STOP on

do $$
declare
  tbl text;
  n bigint;
  all_tables text[] := array[
    'user_profiles','roles','user_roles',
    'leads','lead_activities','clients',
    'workers','tutor_details','compensation_records','worker_payments','worker_payment_items',
    'invoices','invoice_items','payments','revenue',
    'vendors','expenses','subscriptions',
    'projects','tasks',
    'business_events','documents','sops','audit_logs'
  ];
begin
  -- Every table must have RLS enabled.
  for tbl in select unnest(all_tables) loop
    if not (select relrowsecurity from pg_class where oid = ('public.'||tbl)::regclass) then
      raise exception 'RLS NOT ENABLED on public.%', tbl;
    end if;
  end loop;
  raise notice 'RLS enabled on all % tables: PASS', array_length(all_tables, 1);

  -- As anon, no table may return any rows.
  set local role anon;
  set local request.jwt.claims = '';
  foreach tbl in array all_tables loop
    execute format('select count(*) from public.%I', tbl) into n;
    if n <> 0 then
      raise exception 'RLS LEAK: anon read % row(s) from public.%', n, tbl;
    end if;
  end loop;
  reset role;
  raise notice 'anon sees 0 rows on every table: PASS';
end $$;

-- As anon, an insert must be rejected by RLS.
do $$
declare inserted boolean := false;
begin
  set local role anon;
  set local request.jwt.claims = '';
  begin
    insert into public.leads (guardian_name) values ('rls-probe');
    inserted := true;
  exception when others then
    inserted := false;
  end;
  reset role;
  if inserted then
    raise exception 'RLS LEAK: anon was able to INSERT into public.leads';
  end if;
  raise notice 'anon INSERT blocked by RLS: PASS';
end $$;

select 'RLS deny-by-default verification: ALL CHECKS PASSED' as result;
