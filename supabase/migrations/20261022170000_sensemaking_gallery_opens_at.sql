-- Stakeholder Profiles: the gallery opens at a set time.
--
-- Until gallery_opens_at, nobody but facilitators can read anyone else's
-- profiles, however many they've submitted. Null means it opens as soon as
-- someone has submitted their required number (the old behaviour). Enforced
-- in sensemaking_has_unlocked(), which the select policy already uses, so
-- the rule holds for direct API calls too.
--
-- C04: Saturday 2026-10-24, 8:00 in Washington, DC.
-- Our own objects only; nothing in OLOS is touched.

begin;

alter table public.sensemaking_config
  add column gallery_opens_at timestamptz;
comment on column public.sensemaking_config.gallery_opens_at is
  'Participants can read others'' profiles from this time (and after submitting their own). Null: as soon as they have submitted.';

create or replace function public.sensemaking_has_unlocked(p_cycle text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    now() >= coalesce((select c.gallery_opens_at from public.sensemaking_config c where c.cycle = p_cycle), '-infinity'::timestamptz)
    and (select count(*) from public.sensemaking_profiles p
      where p.author_id = auth.uid() and p.cycle = p_cycle and p.status = 'submitted')
    >= (select c.required_profiles from public.sensemaking_config c where c.cycle = p_cycle),
    false);
$$;

update public.sensemaking_config
  set gallery_opens_at = '2026-10-24 08:00 America/New_York'
  where cycle = 'C04';

commit;
