-- =========================================================
-- 20260917000100_init_extensions
-- Extensions + shared helper trigger functions.
-- =========================================================

-- gen_random_uuid(), crypt(), gen_salt() for UUID PKs and local dev seeding.
create extension if not exists pgcrypto with schema extensions;

-- Generic "touch updated_at" trigger used by every table that has an
-- updated_at column. Keeps updated_at authoritative in the database rather
-- than trusting the application to set it on every write.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
