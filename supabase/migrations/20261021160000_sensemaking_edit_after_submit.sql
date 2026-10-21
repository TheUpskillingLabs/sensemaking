-- Let authors edit their profiles after submitting.
--
-- A submitted profile stays submitted: it can't go back to a draft (so it keeps
-- counting toward unlocking), can't be deleted, and the completeness check
-- still applies, so required fields can't be emptied. Edits stop when
-- submissions close, as before.
--
-- edited_at records the last change to a profile after it was submitted, so
-- facilitators can see which views were revised (possibly after reading
-- everyone else's).

begin;

alter table public.sensemaking_profiles add column edited_at timestamptz;
comment on column public.sensemaking_profiles.edited_at is
  'Last time the author changed this profile after submitting it. NULL if never edited after submission.';

create or replace function public.sensemaking_profiles_touch() returns trigger
language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  if tg_op = 'INSERT' then
    new.created_at := now();
    new.submitted_at := case when new.status = 'submitted' then now() end;
    new.edited_at := null;
  else
    -- Identity and history can't be rewritten.
    new.author_id := old.author_id;
    new.cycle := old.cycle;
    new.created_at := old.created_at;
    if old.status = 'submitted' then
      new.status := 'submitted';                -- no un-submitting
      new.submitted_at := old.submitted_at;
      new.edited_at := now();
    else
      new.edited_at := null;
      new.submitted_at := case when new.status = 'submitted' then now() end;
    end if;
  end if;
  return new;
end;
$$;

alter policy sensemaking_profiles_update on public.sensemaking_profiles
  using (author_id = auth.uid() and public.sensemaking_submissions_open(cycle))
  with check (author_id = auth.uid());

commit;
