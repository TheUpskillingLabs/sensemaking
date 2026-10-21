-- Stakeholder Profiles (Sensemaking step, Build Cycle C04).
--
-- Adds two tables, one trigger and five helper functions to the shared OLOS
-- project. Every object is prefixed `sensemaking_`. Nothing here alters, drops
-- or adds policies to an existing OLOS table; the helpers only READ
-- public.participants, public.participant_roles, is_admin() and
-- is_banned_email(), which OLOS already defines.
--
-- Decisions taken in Phase 0 (2026-10-21):
--   * Membership: a non-archived, non-banned public.participants row whose
--     auth_user_id is the caller. OLOS creates these in its sign-up flow; there
--     is no trigger on auth.users, so a Google sign-in alone does not create one.
--   * Facilitators: is_admin() (admin, owner, developer) plus anyone holding an
--     active `poderator` or `lab_lead` role in public.participant_roles.
--     participants.is_staff is deliberately NOT used: it's a roster flag that
--     members can set on their own row.

begin;

-- ── Config ──────────────────────────────────────────────────────────────────
create table public.sensemaking_config (
  cycle text primary key,
  required_profiles int not null default 3 check (required_profiles > 0),
  submissions_open boolean not null default true
);
comment on table public.sensemaking_config is
  'Stakeholder Profiles app: one row per cycle. Edited in the dashboard; no admin UI.';

insert into public.sensemaking_config (cycle) values ('C04');

-- ── Profiles ────────────────────────────────────────────────────────────────
create table public.sensemaking_profiles (
  id uuid primary key default gen_random_uuid(),
  cycle text not null references public.sensemaking_config(cycle),
  author_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft', 'submitted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz,

  -- Part 1: in your own words
  name text,
  org_type text check (org_type in ('library', 'employer', 'workforce_agency', 'community_group', 'training_provider', 'other')),
  org_type_other text,
  description text,

  -- Part 2: structure it
  ring text check (ring in ('inner_circle', 'wider_field')),

  capital_natural_rating   text check (capital_natural_rating   in ('low', 'medium', 'high')),
  capital_natural_note     text,
  capital_cultural_rating  text check (capital_cultural_rating  in ('low', 'medium', 'high')),
  capital_cultural_note    text,
  capital_human_rating     text check (capital_human_rating     in ('low', 'medium', 'high')),
  capital_human_note       text,
  capital_social_rating    text check (capital_social_rating    in ('low', 'medium', 'high')),
  capital_social_note      text,
  capital_political_rating text check (capital_political_rating in ('low', 'medium', 'high')),
  capital_political_note   text,
  capital_financial_rating text check (capital_financial_rating in ('low', 'medium', 'high')),
  capital_financial_note   text,
  capital_built_rating     text check (capital_built_rating     in ('low', 'medium', 'high')),
  capital_built_note       text,

  needs text,
  values_held text,
  fears text,
  influence_level text check (influence_level in ('low', 'medium', 'high')),
  influence_note text,
  stake text,
  connection_to_labs text,

  -- Drafts may be incomplete; a submitted profile must have every required field.
  constraint sensemaking_profiles_complete_when_submitted check (
    status = 'draft' or (
          nullif(btrim(name), '') is not null
      and org_type is not null
      and (org_type <> 'other' or nullif(btrim(org_type_other), '') is not null)
      and nullif(btrim(description), '') is not null
      and ring is not null
      and capital_natural_rating   is not null
      and capital_cultural_rating  is not null
      and capital_human_rating     is not null
      and capital_social_rating    is not null
      and capital_political_rating is not null
      and capital_financial_rating is not null
      and capital_built_rating     is not null
      and nullif(btrim(needs), '') is not null
      and influence_level is not null
      and nullif(btrim(stake), '') is not null
      and nullif(btrim(connection_to_labs), '') is not null
    )
  )
);
comment on table public.sensemaking_profiles is
  'Stakeholder Profiles app: one row per stakeholder profile. Hidden from other participants until they submit their own required number.';

create index sensemaking_profiles_author_idx on public.sensemaking_profiles (author_id, cycle, status);
create index sensemaking_profiles_cycle_status_idx on public.sensemaking_profiles (cycle, status);

-- ── Trigger ─────────────────────────────────────────────────────────────────
create function public.sensemaking_profiles_touch() returns trigger
language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  if tg_op = 'INSERT' then
    new.created_at := now();
    new.submitted_at := case when new.status = 'submitted' then now() end;
  else
    -- Identity and history can't be rewritten.
    new.author_id := old.author_id;
    new.cycle := old.cycle;
    new.created_at := old.created_at;
    if old.status = 'draft' and new.status = 'submitted' then
      new.submitted_at := now();
    else
      new.submitted_at := old.submitted_at;
    end if;
  end if;
  return new;
end;
$$;

create trigger sensemaking_profiles_touch
  before insert or update on public.sensemaking_profiles
  for each row execute function public.sensemaking_profiles_touch();

-- ── Helper functions ────────────────────────────────────────────────────────
-- Security definer so policies can read OLOS tables and count rows in
-- sensemaking_profiles without RLS recursion.

create function public.sensemaking_has_olos_account() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.participants p
    where p.auth_user_id = auth.uid()
      and p.archived_at is null
      and not public.is_banned_email(p.email)
  );
$$;

create function public.sensemaking_is_facilitator() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.is_admin(), false) or exists (
    select 1
    from public.participant_roles pr
    join public.participants p on p.id = pr.participant_id
    where p.auth_user_id = auth.uid()
      and p.archived_at is null
      and pr.role in ('poderator', 'lab_lead')
      and pr.revoked_at is null
  );
$$;

create function public.sensemaking_has_unlocked(p_cycle text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select count(*) from public.sensemaking_profiles p
      where p.author_id = auth.uid() and p.cycle = p_cycle and p.status = 'submitted')
    >= (select c.required_profiles from public.sensemaking_config c where c.cycle = p_cycle),
    false);
$$;

create function public.sensemaking_submissions_open(p_cycle text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select c.submissions_open from public.sensemaking_config c where c.cycle = p_cycle), false);
$$;

-- Author names, for facilitators only. Everyone else gets no rows, so the
-- gallery stays anonymous to participants even through direct API calls.
create function public.sensemaking_author_names(p_cycle text)
returns table (author_id uuid, display_name text)
language sql stable security definer set search_path = public as $$
  select distinct sp.author_id,
         btrim(coalesce(nullif(btrim(pa.preferred_name), ''), pa.first_name) || ' ' || coalesce(pa.last_name, '')) as display_name
  from public.sensemaking_profiles sp
  left join public.participants pa on pa.auth_user_id = sp.author_id
  where sp.cycle = p_cycle and public.sensemaking_is_facilitator();
$$;

-- ── Privileges ──────────────────────────────────────────────────────────────
revoke all on public.sensemaking_config, public.sensemaking_profiles from anon, public;
grant select on public.sensemaking_config to authenticated;
grant select, insert, update, delete on public.sensemaking_profiles to authenticated;

revoke execute on function
  public.sensemaking_has_olos_account(),
  public.sensemaking_is_facilitator(),
  public.sensemaking_has_unlocked(text),
  public.sensemaking_submissions_open(text),
  public.sensemaking_author_names(text),
  public.sensemaking_profiles_touch()
from public, anon;
grant execute on function
  public.sensemaking_has_olos_account(),
  public.sensemaking_is_facilitator(),
  public.sensemaking_has_unlocked(text),
  public.sensemaking_submissions_open(text),
  public.sensemaking_author_names(text)
to authenticated;

-- ── Row-level security ──────────────────────────────────────────────────────
alter table public.sensemaking_config enable row level security;
alter table public.sensemaking_profiles enable row level security;

create policy sensemaking_config_select on public.sensemaking_config
  for select to authenticated using (true);

create policy sensemaking_profiles_select on public.sensemaking_profiles
  for select to authenticated using (
    author_id = auth.uid()
    or public.sensemaking_is_facilitator()
    or (status = 'submitted' and public.sensemaking_has_unlocked(cycle))
  );

create policy sensemaking_profiles_insert on public.sensemaking_profiles
  for insert to authenticated with check (
    author_id = auth.uid()
    and status = 'draft'
    and public.sensemaking_has_olos_account()
    and public.sensemaking_submissions_open(cycle)
  );

-- Drafts are editable (including the draft → submitted change); once
-- submitted, a profile is locked because the USING clause no longer matches.
create policy sensemaking_profiles_update on public.sensemaking_profiles
  for update to authenticated
  using (author_id = auth.uid() and status = 'draft' and public.sensemaking_submissions_open(cycle))
  with check (author_id = auth.uid());

create policy sensemaking_profiles_delete on public.sensemaking_profiles
  for delete to authenticated
  using (author_id = auth.uid() and status = 'draft');

commit;
