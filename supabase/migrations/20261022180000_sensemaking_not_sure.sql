-- Stakeholder Profiles: room to say "not sure".
--
-- A forced choice between low, medium and high makes people guess, and a
-- guess looks the same as knowledge once it's aggregated. Each capital rating
-- and the influence rating gain 'unsure'. A profile still needs an answer for
-- every one of them to submit; "not sure" is an answer. The served/contributing
-- choice gains 'neither', since not every player is one of the two.
--
-- Our own table only; nothing in OLOS is touched.

begin;

alter table public.sensemaking_profiles
  drop constraint sensemaking_profiles_capital_natural_rating_check,
  drop constraint sensemaking_profiles_capital_cultural_rating_check,
  drop constraint sensemaking_profiles_capital_human_rating_check,
  drop constraint sensemaking_profiles_capital_social_rating_check,
  drop constraint sensemaking_profiles_capital_political_rating_check,
  drop constraint sensemaking_profiles_capital_financial_rating_check,
  drop constraint sensemaking_profiles_capital_built_rating_check,
  drop constraint sensemaking_profiles_influence_level_check,
  drop constraint sensemaking_profiles_customer_role_check;

alter table public.sensemaking_profiles
  add constraint sensemaking_profiles_capital_natural_rating_check   check (capital_natural_rating   in ('low', 'medium', 'high', 'unsure')),
  add constraint sensemaking_profiles_capital_cultural_rating_check  check (capital_cultural_rating  in ('low', 'medium', 'high', 'unsure')),
  add constraint sensemaking_profiles_capital_human_rating_check     check (capital_human_rating     in ('low', 'medium', 'high', 'unsure')),
  add constraint sensemaking_profiles_capital_social_rating_check    check (capital_social_rating    in ('low', 'medium', 'high', 'unsure')),
  add constraint sensemaking_profiles_capital_political_rating_check check (capital_political_rating in ('low', 'medium', 'high', 'unsure')),
  add constraint sensemaking_profiles_capital_financial_rating_check check (capital_financial_rating in ('low', 'medium', 'high', 'unsure')),
  add constraint sensemaking_profiles_capital_built_rating_check     check (capital_built_rating     in ('low', 'medium', 'high', 'unsure')),
  add constraint sensemaking_profiles_influence_level_check          check (influence_level          in ('low', 'medium', 'high', 'unsure')),
  add constraint sensemaking_profiles_customer_role_check            check (customer_role in ('helped', 'paying', 'both', 'neither', 'unsure'));

commit;
