-- =========================================================
-- seed.sql — LOCAL DEVELOPMENT ONLY
-- Runs automatically on `supabase db reset` / `supabase start`.
-- Never runs against a hosted (production) project.
--
-- Creates a ready-to-use owner account so a fresh local checkout can log in
-- immediately:
--     email:    owner@studywiser.local
--     password: DevPassword123!
--
-- The on_auth_user_created trigger creates the user_profiles row and, because
-- this is the first user, grants the 'owner' role automatically. The explicit
-- user_roles insert below is a belt-and-suspenders safeguard.
-- =========================================================

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated', 'authenticated',
  'owner@studywiser.local',
  extensions.crypt('DevPassword123!', extensions.gen_salt('bf')),
  now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"StudyWiser Owner"}',
  now(), now(),
  '', '', '', ''
)
on conflict (id) do nothing;

insert into auth.identities (
  id, user_id, provider_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
) values (
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  '{"sub":"11111111-1111-1111-1111-111111111111","email":"owner@studywiser.local"}'::jsonb,
  'email',
  now(), now(), now()
)
on conflict (id) do nothing;

-- Explicit owner grant (idempotent; trigger normally handles this).
insert into public.user_roles (user_id, role_id)
select '11111111-1111-1111-1111-111111111111', id
from public.roles
where name = 'owner'
on conflict do nothing;
