-- =========================================================
-- 20260930000100_operations_owner_text
-- The app collects project/subscription/SOP "owner" and task "assignee" as
-- free-text names (there is no user-picker yet), but the base tables only had
-- user-id link columns (owner_id / assigned_user_id). Add nullable text columns
-- to hold those names. The uuid link columns stay for a future real-user picker.
-- =========================================================

alter table public.projects       add column if not exists owner_name    text;
alter table public.tasks          add column if not exists assignee_name text;
alter table public.subscriptions  add column if not exists owner_name    text;
alter table public.sops           add column if not exists owner_name    text;
