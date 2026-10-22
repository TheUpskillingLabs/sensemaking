-- Stakeholder Profiles: two small additions from the reading behind the form
-- (docs: src/lib/essay.ts, "Where the questions come from").
--
--   * customer_role: Drucker's two kinds of customers, as one choice. Required
--     to submit in the app; optional here so existing submitted rows stay valid.
--   * tried_before: Dorst's "archaeology", what this player has already tried.
--     Optional.
--   * org_type gains 'funder', which the two-customers section needs.
--
-- Our own table only; nothing in OLOS is touched.

begin;

alter table public.sensemaking_profiles
  add column customer_role text check (customer_role in ('helped', 'paying', 'both', 'unsure')),
  add column tried_before text;

alter table public.sensemaking_profiles
  drop constraint sensemaking_profiles_org_type_check;
alter table public.sensemaking_profiles
  add constraint sensemaking_profiles_org_type_check
  check (org_type in ('library', 'employer', 'workforce_agency', 'community_group', 'training_provider', 'funder', 'other'));

comment on column public.sensemaking_profiles.customer_role is
  'Helped by the work, paying for it (or otherwise keeping it going), both, or not sure.';
comment on column public.sensemaking_profiles.tried_before is
  'What this player has already tried in this area, and what got in the way.';

commit;
