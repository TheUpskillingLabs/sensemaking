-- Stakeholder Profiles: touchpoints.
--
-- Where people actually come into contact with this player: a front desk, a
-- class, a website, a caseworker, a job board, a hotline, word of mouth.
-- Required to submit in the app; optional here so existing rows stay valid.
--
-- Our own table only; nothing in OLOS is touched.

begin;

alter table public.sensemaking_profiles add column touchpoints text;
comment on column public.sensemaking_profiles.touchpoints is
  'Where people come into contact with this player: places, moments, channels.';

commit;
