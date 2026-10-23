-- Stakeholder Profiles: facilitators can edit or delete any profile.
--
-- On sensemaking day a facilitator needs to fix a typo, merge a duplicate or
-- take down something that shouldn't be there, whoever wrote it and whether or
-- not submissions are still open. These policies sit beside the authors' own
-- (Postgres ORs permissive policies), so nothing changes for anyone else. The
-- touch trigger still keeps the author, cycle and card code, and still marks a
-- submitted profile "Edited" when it changes.
--
-- Our own table only; nothing in OLOS is touched.

begin;

create policy sensemaking_profiles_facilitator_update on public.sensemaking_profiles
  for update to authenticated
  using (public.sensemaking_is_facilitator())
  with check (public.sensemaking_is_facilitator());

create policy sensemaking_profiles_facilitator_delete on public.sensemaking_profiles
  for delete to authenticated
  using (public.sensemaking_is_facilitator());

commit;
