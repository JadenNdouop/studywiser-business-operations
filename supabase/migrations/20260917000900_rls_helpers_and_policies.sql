-- =========================================================
-- 20260917000900_rls_helpers_and_policies
-- Authorization helpers + Row Level Security policies for every table.
--
-- Model (Phase 1, "admin-only" per PRD §6, but future-role-ready):
--   * RLS is already enabled on every table (deny-by-default). This migration
--     adds the policies that grant access.
--   * The anon role is NEVER granted a policy, so an unauthenticated (anon-key)
--     query returns zero rows everywhere — the Phase 1 acceptance test.
--   * "Staff" = any authenticated user who has at least one role row. In
--     Phase 1 everyone provisioned is owner/admin; later phases can tighten
--     these policies per-domain without schema changes.
--   * Helper functions are SECURITY DEFINER and owned by the migration role
--     (a table owner), so they bypass RLS internally and cannot recurse when
--     used inside a policy on user_roles itself.
-- =========================================================

-- Roles held by the current user.
create or replace function public.current_user_role_names()
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(array_agg(r.name), array[]::text[])
  from public.user_roles ur
  join public.roles r on r.id = ur.role_id
  where ur.user_id = auth.uid();
$$;

-- True if the current user holds any of the named roles.
create or replace function public.has_any_role(variadic role_names text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and r.name = any(role_names)
  );
$$;

-- True if the current user is provisioned staff (has at least one role).
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles ur where ur.user_id = auth.uid()
  );
$$;

-- True if the current user is an owner or admin.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_any_role('owner', 'admin');
$$;

-- ---------------------------------------------------------
-- Uniform "staff can do everything" policy for operational tables.
-- ---------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'leads','lead_activities','clients','workers','tutor_details',
    'compensation_records','worker_payments','worker_payment_items',
    'invoices','invoice_items','payments','revenue','vendors','expenses',
    'subscriptions','projects','tasks','business_events','documents','sops'
  ]
  loop
    execute format(
      'create policy %I on public.%I for all to authenticated '
      || 'using (public.is_staff()) with check (public.is_staff());',
      t || '_staff_all', t
    );
  end loop;
end $$;

-- ---------------------------------------------------------
-- user_profiles: a user sees their own profile; staff see all; a user edits
-- their own; admins manage all.
-- ---------------------------------------------------------
create policy user_profiles_select on public.user_profiles
  for select to authenticated
  using (public.is_staff() or id = auth.uid());

create policy user_profiles_insert on public.user_profiles
  for insert to authenticated
  with check (id = auth.uid() or public.is_admin());

create policy user_profiles_update on public.user_profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

create policy user_profiles_delete on public.user_profiles
  for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------
-- roles: readable by staff, managed by admins.
-- ---------------------------------------------------------
create policy roles_select on public.roles
  for select to authenticated
  using (public.is_staff());

create policy roles_manage on public.roles
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------
-- user_roles: a user sees their own assignments; admins see and manage all.
-- ---------------------------------------------------------
create policy user_roles_select on public.user_roles
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy user_roles_manage on public.user_roles
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------
-- audit_logs: staff can append; only admins can read; nobody can update or
-- delete (no such policies exist), keeping the trail immutable from the app.
-- ---------------------------------------------------------
create policy audit_logs_insert on public.audit_logs
  for insert to authenticated
  with check (public.is_staff());

create policy audit_logs_select on public.audit_logs
  for select to authenticated
  using (public.is_admin());
