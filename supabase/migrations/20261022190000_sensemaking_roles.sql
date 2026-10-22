-- Stakeholder Profiles: served, contributing, sustaining.
--
-- Drucker's two kinds of customers, with the supporting kind split in two:
--   served       the work changes things for them
--   contributing they host it, hire from it, refer people, give their time
--   sustaining   they pay for it or otherwise keep it going
-- A player can be any mix, so this is a set, not one choice. 'unsure' stands
-- alone. Empty means no tie today. Replaces customer_role.
--
-- Our own table only; nothing in OLOS is touched.

begin;

alter table public.sensemaking_profiles
  add column roles text[] not null default '{}'
    check (roles <@ array['served', 'contributing', 'sustaining', 'unsure']::text[]);

update public.sensemaking_profiles set roles = case customer_role
  when 'helped'  then array['served']
  when 'paying'  then array['sustaining']
  when 'both'    then array['served', 'sustaining']
  when 'unsure'  then array['unsure']
  else '{}' end::text[];

alter table public.sensemaking_profiles drop column customer_role;

comment on column public.sensemaking_profiles.roles is
  'Any of served, contributing, sustaining; or unsure alone. Empty: no tie to The Labs today.';

commit;
