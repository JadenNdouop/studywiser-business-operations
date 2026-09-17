-- =========================================================
-- 20260917001000_auth_provisioning
-- Automatic profile creation on signup + owner bootstrap.
--
-- Owner provisioning strategy (works for a fresh, empty production project):
--   * Every new auth user automatically gets a public.user_profiles row.
--   * The VERY FIRST user to sign up is automatically granted the 'owner'
--     role. For StudyWiser Ops that first signup is the account owner
--     (info@studywiser.org), so no manual step is needed after deploy.
--   * grant_owner_by_email() is provided to (re)grant owner explicitly if
--     the first-signup bootstrap ever needs to be overridden.
-- =========================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_role_id uuid;
begin
  insert into public.user_profiles (id, full_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;

  -- Bootstrap: the first-ever user becomes the owner.
  if not exists (select 1 from public.user_roles) then
    select id into owner_role_id from public.roles where name = 'owner';
    if owner_role_id is not null then
      insert into public.user_roles (user_id, role_id)
      values (new.id, owner_role_id)
      on conflict do nothing;
    end if;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Explicitly (re)provision a given email as owner. Intended to be called by a
-- privileged operator (service role / SQL editor), not from the app.
create or replace function public.grant_owner_by_email(target_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  owner_role_id uuid;
begin
  select id into uid from auth.users where email = target_email;
  if uid is null then
    raise exception 'No auth user found with email %', target_email;
  end if;

  select id into owner_role_id from public.roles where name = 'owner';

  insert into public.user_profiles (id, full_name)
  values (uid, split_part(target_email, '@', 1))
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role_id)
  values (uid, owner_role_id)
  on conflict do nothing;
end;
$$;

-- Lock the explicit-provisioning helper down: not callable by anon/authenticated.
revoke all on function public.grant_owner_by_email(text) from public, anon, authenticated;
