-- Stakeholder Profiles: connections, the heart of the structured half.
--
-- Each profile lists who this player is connected to, one row per connection,
-- with an optional capital that flows along it and which way it flows. Kept
-- as JSON on the profile for now: one author, one view, no cross-profile
-- identity yet. The field map (docs/field-visualization.md) will lift these
-- into a relationships table once players are shared entities.
--
--   connections: [{ "name": "...", "capital": "social" | null,
--                   "direction": "gives" | "gets" | "both" | null, "note": "..." }]
--
-- Our own table only; nothing in OLOS is touched.

begin;

alter table public.sensemaking_profiles
  add column connections jsonb not null default '[]'::jsonb
    check (jsonb_typeof(connections) = 'array');

comment on column public.sensemaking_profiles.connections is
  'Who this player is connected to; each row may name the capital that flows and its direction. At least one is required to submit (enforced in the app).';

commit;
