-- Stakeholder Profiles: stakeholder groups.
--
-- On sensemaking day people cluster printed cards on a table, photograph the
-- cluster, and the app reads the QR code on each card. The cluster is saved
-- as a group: a name, a note, and the profiles in it. The averaged view
-- (capitals, roles, connections) is computed in the app from the member
-- profiles, so it always reflects their current answers. The photo itself is
-- read on the device and never uploaded.
--
-- Who can see and make groups: anyone the gallery is open to (unlocked
-- participants and facilitators). The creator or a facilitator can edit or
-- delete one. Groups are shared with the room, like the gallery.
--
-- Our own objects only; nothing in OLOS is touched.

begin;

create table public.sensemaking_groups (
  id uuid primary key default gen_random_uuid(),
  cycle text not null references public.sensemaking_config(cycle),
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  note text check (note is null or char_length(note) <= 2000),
  profile_ids uuid[] not null default '{}' check (cardinality(profile_ids) <= 200)
);
comment on table public.sensemaking_groups is
  'Stakeholder Profiles app: clusters of profiles made on sensemaking day, usually by photographing printed cards.';
create index sensemaking_groups_cycle_idx on public.sensemaking_groups (cycle, created_at);

create function public.sensemaking_groups_touch() returns trigger
language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  if tg_op = 'UPDATE' then
    new.created_by := old.created_by;
    new.cycle := old.cycle;
    new.created_at := old.created_at;
  else
    new.created_at := now();
  end if;
  return new;
end;
$$;
create trigger sensemaking_groups_touch before insert or update on public.sensemaking_groups
  for each row execute function public.sensemaking_groups_touch();

alter table public.sensemaking_groups enable row level security;

revoke all on public.sensemaking_groups from anon, public;
grant select, insert, update, delete on public.sensemaking_groups to authenticated;

create policy sensemaking_groups_select on public.sensemaking_groups for select to authenticated
  using (public.sensemaking_has_olos_account() and (public.sensemaking_is_facilitator() or public.sensemaking_has_unlocked(cycle)));

create policy sensemaking_groups_insert on public.sensemaking_groups for insert to authenticated
  with check (created_by = auth.uid() and public.sensemaking_has_olos_account()
    and (public.sensemaking_is_facilitator() or public.sensemaking_has_unlocked(cycle)));

create policy sensemaking_groups_update on public.sensemaking_groups for update to authenticated
  using (created_by = auth.uid() or public.sensemaking_is_facilitator())
  with check (public.sensemaking_is_facilitator() or public.sensemaking_has_unlocked(cycle));

create policy sensemaking_groups_delete on public.sensemaking_groups for delete to authenticated
  using (created_by = auth.uid() or public.sensemaking_is_facilitator());

commit;
