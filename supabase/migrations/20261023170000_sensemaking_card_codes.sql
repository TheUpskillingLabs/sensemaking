-- Stakeholder Profiles: a card code for every profile, from the moment it's made.
--
-- Six characters from an alphabet with no look-alikes (no 0/O, 1/I/L), so the
-- code also works typed by hand. The database picks it on insert, checks it
-- against every profile, and never changes it, so a printed card always points
-- to the same profile. The QR code on a printed card carries "SP:" + this code.
--
-- Our own table only; nothing in OLOS is touched.

begin;

create function public.sensemaking_new_card_code() returns text
language plpgsql volatile security definer set search_path = public as $$
declare
  alphabet constant text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  code text;
begin
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    -- Security definer, so the check sees every profile, not just the caller's.
    exit when not exists (select 1 from public.sensemaking_profiles where card_code = code);
  end loop;
  return code;
end;
$$;
revoke execute on function public.sensemaking_new_card_code() from anon;

alter table public.sensemaking_profiles add column card_code text;

-- Backfill without the touch trigger, so existing profiles don't look edited.
alter table public.sensemaking_profiles disable trigger sensemaking_profiles_touch;
update public.sensemaking_profiles set card_code = public.sensemaking_new_card_code() where card_code is null;
alter table public.sensemaking_profiles enable trigger sensemaking_profiles_touch;

alter table public.sensemaking_profiles
  alter column card_code set not null,
  add constraint sensemaking_profiles_card_code_key unique (card_code),
  add constraint sensemaking_profiles_card_code_format check (card_code ~ '^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$');
comment on column public.sensemaking_profiles.card_code is
  'Unique code printed on the card (as a QR code) and read back by the group scanner. Set on insert, never changed.';

create or replace function public.sensemaking_profiles_touch() returns trigger
language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  if tg_op = 'INSERT' then
    new.created_at := now();
    new.submitted_at := case when new.status = 'submitted' then now() end;
    new.edited_at := null;
    new.card_code := public.sensemaking_new_card_code();  -- ignore any value sent
  else
    -- Identity and history can't be rewritten.
    new.author_id := old.author_id;
    new.cycle := old.cycle;
    new.created_at := old.created_at;
    new.card_code := old.card_code;
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

commit;
