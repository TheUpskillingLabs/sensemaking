-- RLS tests for the Stakeholder Profiles tables.
--
-- Run against a project that has the migration applied (OLOS-dev first), as
-- the postgres role, e.g. in the Supabase SQL editor or with psql:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rls.sql
-- Everything runs in one transaction and is rolled back, so it leaves no rows
-- behind. Any failed check raises an exception and aborts the run; reaching the
-- final SELECT means all nine checks passed.
--
-- Simulated people:
--   A  member, submits three profiles (unlocked)
--   B  member, submits two and keeps one draft (still locked)
--   F  facilitator (active Poderator role), writes nothing
--   N  signed in with Google but has no OLOS participants row

begin;

-- ── Fixtures (as postgres) ─────────────────────────────────────────────────
insert into auth.users (id, email, aud, role, email_confirmed_at) values
  ('00000000-0000-4000-a000-00000000000a', 'rls-a@test.invalid', 'authenticated', 'authenticated', now()),
  ('00000000-0000-4000-a000-00000000000b', 'rls-b@test.invalid', 'authenticated', 'authenticated', now()),
  ('00000000-0000-4000-a000-00000000000f', 'rls-f@test.invalid', 'authenticated', 'authenticated', now()),
  ('00000000-0000-4000-a000-0000000000ee', 'rls-n@test.invalid', 'authenticated', 'authenticated', now()),
  -- U: member whose OLOS row isn't linked to this login yet (confirmed email).
  ('00000000-0000-4000-a000-0000000000cc', 'RLS-U@test.invalid', 'authenticated', 'authenticated', now()),
  -- X: claims a member's address but never confirmed it.
  ('00000000-0000-4000-a000-0000000000dd', 'rls-x@test.invalid', 'authenticated', 'authenticated', null);

insert into public.participants (auth_user_id, google_id, email, first_name, last_name, is_test) values
  ('00000000-0000-4000-a000-00000000000a', 'rls-google-a', 'rls-a@test.invalid', 'Ada',  'Test', true),
  ('00000000-0000-4000-a000-00000000000b', 'rls-google-b', 'rls-b@test.invalid', 'Bo',   'Test', true),
  ('00000000-0000-4000-a000-00000000000f', 'rls-google-f', 'rls-f@test.invalid', 'Fran', 'Test', true),
  (null, 'rls-google-u', 'rls-u@test.invalid', 'Uma', 'Test', true),
  (null, 'rls-google-x', 'rls-x@test.invalid', 'Xan', 'Test', true);
insert into public.participant_roles (participant_id, role, note)
select id, 'lab_lead', 'rls test fixture' from public.participants where email = 'rls-u@test.invalid';

insert into public.participant_roles (participant_id, role, note)
select id, 'poderator', 'rls test fixture' from public.participants where email = 'rls-f@test.invalid';

-- A complete profile body, reused below.
create temp table rls_full as select
  'Test player'::text as name, 'library'::text as org_type, 'Who they are.'::text as description,
  'inner_circle'::text as ring, 'low'::text as r, 'Their needs.'::text as needs, 'high'::text as influence_level,
  'Their stake.'::text as stake, 'A connection.'::text as connection_to_labs;
grant select on rls_full to authenticated;

-- ── A writes and submits three ─────────────────────────────────────────────
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-00000000000a","role":"authenticated"}', true);
do $$
declare i int;
begin
  for i in 1..3 loop
    insert into public.sensemaking_profiles (cycle, name, org_type, description, ring,
      capital_natural_rating, capital_cultural_rating, capital_human_rating, capital_social_rating,
      capital_political_rating, capital_financial_rating, capital_built_rating,
      needs, influence_level, stake, connection_to_labs)
    select 'C04', name || ' A' || i, org_type, description, ring, r, r, r, r, r, r, r, needs, influence_level, stake, connection_to_labs
    from rls_full;
  end loop;
  update public.sensemaking_profiles set status = 'submitted' where author_id = auth.uid();
  if not public.sensemaking_has_unlocked('C04') then raise exception 'setup: A should be unlocked'; end if;
end $$;

-- ── B writes two submitted and one draft ───────────────────────────────────
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-00000000000b","role":"authenticated"}', true);
do $$
declare i int; n int;
begin
  for i in 1..2 loop
    insert into public.sensemaking_profiles (cycle, name, org_type, description, ring,
      capital_natural_rating, capital_cultural_rating, capital_human_rating, capital_social_rating,
      capital_political_rating, capital_financial_rating, capital_built_rating,
      needs, influence_level, stake, connection_to_labs)
    select 'C04', name || ' B' || i, org_type, description, ring, r, r, r, r, r, r, r, needs, influence_level, stake, connection_to_labs
    from rls_full;
  end loop;
  update public.sensemaking_profiles set status = 'submitted' where author_id = auth.uid();
  insert into public.sensemaking_profiles (cycle, name) values ('C04', 'B draft');

  -- 1. With 0–2 submitted, B sees only their own rows (not A's three submitted).
  select count(*) into n from public.sensemaking_profiles;
  if n <> 3 then raise exception 'test 1 failed: B sees % rows, expected own 3', n; end if;
  select count(*) into n from public.sensemaking_profiles where author_id <> auth.uid();
  if n <> 0 then raise exception 'test 1 failed: B sees % rows by others', n; end if;

  -- 4. Submitting with a required field missing fails.
  begin
    update public.sensemaking_profiles set status = 'submitted' where name = 'B draft';
    raise exception 'test 4 failed: incomplete profile was submitted';
  exception when check_violation then null;
  end;
  -- Whitespace-only counts as missing.
  begin
    update public.sensemaking_profiles set status = 'submitted', description = '   ',
      org_type = 'library', ring = 'wider_field', needs = 'x', stake = 'x', connection_to_labs = 'x', influence_level = 'low',
      capital_natural_rating = 'low', capital_cultural_rating = 'low', capital_human_rating = 'low', capital_social_rating = 'low',
      capital_political_rating = 'low', capital_financial_rating = 'low', capital_built_rating = 'low'
    where name = 'B draft';
    raise exception 'test 4 failed: whitespace description was accepted';
  exception when check_violation then null;
  end;
end $$;

-- ── A, now unlocked ────────────────────────────────────────────────────────
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-00000000000a","role":"authenticated"}', true);
do $$
declare n int;
begin
  -- 2. After three submissions, A sees all submitted rows but nobody else's drafts.
  select count(*) into n from public.sensemaking_profiles;
  if n <> 5 then raise exception 'test 2 failed: A sees % rows, expected 5 submitted', n; end if;
  select count(*) into n from public.sensemaking_profiles where status = 'draft';
  if n <> 0 then raise exception 'test 2 failed: A sees % drafts', n; end if;

  -- 3. An author can edit a submitted profile, but it stays submitted and complete
  --    (no un-submitting, no emptying required fields), edited_at is stamped, and it can't be deleted.
  update public.sensemaking_profiles set name = 'changed', status = 'draft' where author_id = auth.uid() and name = 'Test player A1';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'test 3 failed: author could not edit their submitted profile (% rows)', n; end if;
  select count(*) into n from public.sensemaking_profiles
   where author_id = auth.uid() and name = 'changed' and status = 'submitted' and edited_at is not null and submitted_at is not null;
  if n <> 1 then raise exception 'test 3 failed: edited profile did not stay submitted with edited_at set'; end if;
  if not public.sensemaking_has_unlocked('C04') then raise exception 'test 3 failed: editing un-submitted the profile'; end if;
  begin
    update public.sensemaking_profiles set stake = '  ' where author_id = auth.uid() and name = 'changed';
    raise exception 'test 3 failed: required field emptied on a submitted profile';
  exception when check_violation then null;
  end;
  delete from public.sensemaking_profiles where author_id = auth.uid();
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'test 3 failed: author deleted % submitted rows', n; end if;

  -- Participants never get author names.
  select count(*) into n from public.sensemaking_author_names('C04');
  if n <> 0 then raise exception 'test 2 failed: participant got % author names', n; end if;
end $$;

-- ── F, the facilitator ─────────────────────────────────────────────────────
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-00000000000f","role":"authenticated"}', true);
do $$
declare n int;
begin
  -- 5. A facilitator sees every row, drafts included, and can't edit others' rows.
  if not public.sensemaking_is_facilitator() then raise exception 'test 5 failed: F is not a facilitator'; end if;
  select count(*) into n from public.sensemaking_profiles;
  if n <> 6 then raise exception 'test 5 failed: F sees % rows, expected 6', n; end if;
  update public.sensemaking_profiles set name = 'facilitator edit';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'test 5 failed: F updated % rows', n; end if;
  delete from public.sensemaking_profiles;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'test 5 failed: F deleted % rows', n; end if;
  select count(*) into n from public.sensemaking_author_names('C04');
  if n <> 2 then raise exception 'test 5 failed: F got % author names, expected 2', n; end if;
end $$;

-- ── N, signed in without an OLOS account ───────────────────────────────────
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-0000000000ee","role":"authenticated"}', true);
do $$
begin
  -- 6. No OLOS account, no insert.
  if public.sensemaking_has_olos_account() then raise exception 'test 6 failed: N counted as a member'; end if;
  begin
    insert into public.sensemaking_profiles (cycle, name) values ('C04', 'N attempt');
    raise exception 'test 6 failed: N inserted a profile';
  exception when insufficient_privilege then null;
  end;
end $$;

-- ── Unlinked OLOS rows, matched by confirmed email ─────────────────────────
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-0000000000cc","role":"authenticated"}', true);
do $$
begin
  -- 9. A member whose row isn't linked yet gets in by confirmed email (case-insensitive),
  --    keeps their roles, and can write; an unconfirmed claim of a member's email can't.
  if not public.sensemaking_has_olos_account() then raise exception 'test 9 failed: unlinked member not recognized'; end if;
  if not public.sensemaking_is_facilitator() then raise exception 'test 9 failed: unlinked Lab Lead not a facilitator'; end if;
  insert into public.sensemaking_profiles (cycle, name) values ('C04', 'U draft');
end $$;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-0000000000dd","role":"authenticated"}', true);
do $$
begin
  if public.sensemaking_has_olos_account() then raise exception 'test 9 failed: unconfirmed email counted as a member'; end if;
  begin
    insert into public.sensemaking_profiles (cycle, name) values ('C04', 'X attempt');
    raise exception 'test 9 failed: unconfirmed email inserted';
  exception when insufficient_privilege then null;
  end;
end $$;

-- ── Submissions closed ─────────────────────────────────────────────────────
reset role;
update public.sensemaking_config set submissions_open = false where cycle = 'C04';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-a000-00000000000b","role":"authenticated"}', true);
do $$
declare n int;
begin
  -- 7. With submissions_open = false, nobody can insert or update.
  begin
    insert into public.sensemaking_profiles (cycle, name) values ('C04', 'late');
    raise exception 'test 7 failed: insert allowed while closed';
  exception when insufficient_privilege then null;
  end;
  update public.sensemaking_profiles set name = 'late edit' where name = 'B draft';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'test 7 failed: draft updated while closed'; end if;
  update public.sensemaking_profiles set needs = 'late edit' where author_id = auth.uid() and status = 'submitted';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'test 7 failed: submitted profile edited while closed'; end if;
end $$;

-- ── anon ───────────────────────────────────────────────────────────────────
reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
do $$
declare n int;
begin
  -- 8. anon can read nothing.
  begin
    select count(*) into n from public.sensemaking_profiles;
    if n <> 0 then raise exception 'test 8 failed: anon read % profiles', n; end if;
  exception when insufficient_privilege then null;
  end;
  begin
    select count(*) into n from public.sensemaking_config;
    if n <> 0 then raise exception 'test 8 failed: anon read config'; end if;
  exception when insufficient_privilege then null;
  end;
end $$;

reset role;
select 'All 9 RLS checks passed' as result;

rollback;
