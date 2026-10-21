-- Recognize OLOS members whose participants row isn't linked to this login yet.
--
-- OLOS links participants.auth_user_id in its own auth callback, by email, the
-- first time someone signs in to OLOS. People who were imported, or who have
-- never signed in to this Supabase project (most of the cohort on OLOS-dev),
-- have auth_user_id = NULL, so the first migration's helpers turned them away.
--
-- Now a caller matches a participants row either by auth_user_id, or, when
-- that row isn't linked to anyone, by their sign-in email. The email is read
-- from auth.users and only counts once it is confirmed (Google sign-ins always
-- are), so nobody can claim a member's address with an unconfirmed sign-up.
-- Nothing here writes to OLOS tables; linking stays OLOS's job.

begin;

create function public.sensemaking_current_participant_id() returns integer
language sql stable security definer set search_path = public as $$
  select p.id
  from public.participants p
  where p.archived_at is null
    and (
      p.auth_user_id = auth.uid()
      or (
        p.auth_user_id is null
        and lower(p.email) = (
          select lower(u.email) from auth.users u
          where u.id = auth.uid() and u.email_confirmed_at is not null
        )
      )
    )
  order by (p.auth_user_id is not null) desc
  limit 1;
$$;

create or replace function public.sensemaking_has_olos_account() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.participants p
    where p.id = public.sensemaking_current_participant_id()
      and not public.is_banned_email(p.email)
  );
$$;

-- Same roles as before: is_admin()'s admin/owner/developer, plus Poderators and
-- Lab Leads, now resolved through the matched participant.
create or replace function public.sensemaking_is_facilitator() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.participant_roles pr
    where pr.participant_id = public.sensemaking_current_participant_id()
      and pr.role in ('admin', 'owner', 'developer', 'poderator', 'lab_lead')
      and pr.revoked_at is null
  );
$$;

create or replace function public.sensemaking_author_names(p_cycle text)
returns table (author_id uuid, display_name text)
language sql stable security definer set search_path = public as $$
  select a.author_id,
         btrim(coalesce(nullif(btrim(pa.preferred_name), ''), pa.first_name, u.email) || ' ' || coalesce(pa.last_name, '')) as display_name
  from (select distinct sp.author_id from public.sensemaking_profiles sp where sp.cycle = p_cycle) a
  join auth.users u on u.id = a.author_id
  left join lateral (
    select p.preferred_name, p.first_name, p.last_name
    from public.participants p
    where p.auth_user_id = a.author_id
       or (p.auth_user_id is null and lower(p.email) = lower(u.email))
    order by (p.auth_user_id is not null) desc
    limit 1
  ) pa on true
  where public.sensemaking_is_facilitator();
$$;

revoke execute on function public.sensemaking_current_participant_id() from public, anon;
grant execute on function public.sensemaking_current_participant_id() to authenticated;

commit;
