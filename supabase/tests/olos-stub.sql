-- Minimal stand-ins for Supabase + the OLOS objects the migration reads, so the
-- RLS tests can run on a plain local Postgres (see run-local.sh). is_admin() and
-- is_banned_email() are copied verbatim from OLOS-prod (2026-10-21).
do $$ begin create role anon nologin; create role authenticated nologin; exception when duplicate_object then null; end $$;
grant usage on schema public to anon, authenticated;
-- Supabase grants table privileges to these roles by default.
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on functions to anon, authenticated;
create schema auth; grant usage on schema auth to anon, authenticated;
create table auth.users (id uuid primary key, email text, aud text, role text, email_confirmed_at timestamptz);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::uuid $$;
grant execute on function auth.uid() to anon, authenticated;

create table public.participants (
  id serial primary key, auth_user_id uuid, google_id varchar not null, email varchar not null,
  first_name varchar not null, last_name varchar not null, preferred_name varchar,
  is_test boolean not null default false, is_staff boolean not null default false, archived_at timestamptz);
create table public.participant_roles (
  id serial primary key, participant_id int not null, role varchar not null, cycle_id int, pod_id int, lab_id int,
  project_id int, granted_at timestamptz not null default now(), revoked_at timestamptz, note text);
create table public.participant_bans (id bigserial primary key, email varchar not null, revoked_at timestamptz);
alter table public.participants enable row level security;
alter table public.participant_roles enable row level security;
alter table public.participant_bans enable row level security;

-- Copied verbatim from OLOS-prod.
create function public.is_admin() returns boolean language sql stable security definer set search_path to 'public' as $$
  SELECT EXISTS (
    SELECT 1 FROM participant_roles pr
    JOIN participants p ON p.id = pr.participant_id
    WHERE p.auth_user_id = auth.uid()
      AND pr.role IN ('admin','owner','developer') AND pr.revoked_at IS NULL);
$$;
create function public.is_banned_email(check_email character varying) returns boolean language sql stable security definer set search_path to 'public' as $$
  SELECT EXISTS (SELECT 1 FROM participant_bans WHERE lower(email) = lower(check_email) AND revoked_at IS NULL);
$$;
