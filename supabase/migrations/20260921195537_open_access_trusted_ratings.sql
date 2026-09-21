-- Keep the old is_active value as historical data; it no longer controls access.
-- Trust is a separate editorial choice and defaults to false for every profile.
alter table public.profiles
  add column if not exists is_trusted_rater boolean not null default false;

drop policy if exists "Members can read approved profiles and their own" on public.profiles;
drop policy if exists "Members can read titles" on public.titles;
drop policy if exists "Members can add titles" on public.titles;
drop policy if exists "Members can read group ratings" on public.ratings;
drop policy if exists "Members can add own ratings" on public.ratings;
drop policy if exists "Members can update own ratings" on public.ratings;
drop policy if exists "Members can delete own ratings" on public.ratings;
drop policy if exists "Members can read references" on public.reference_titles;

create policy "Authenticated users can read profiles" on public.profiles
for select to authenticated using ((select auth.uid()) is not null);
create policy "Users can edit their own public profile fields" on public.profiles
for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

-- RLS is row-based, so restrict UPDATE to these two harmless columns as well.
revoke insert, update, delete on public.profiles from public, anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, avatar_url) on public.profiles to authenticated;

create policy "Authenticated users can read titles" on public.titles
for select to authenticated using ((select auth.uid()) is not null);
create policy "Authenticated users can add titles" on public.titles
for insert to authenticated with check ((select auth.uid()) is not null);

create policy "Authenticated users can read ratings" on public.ratings
for select to authenticated using ((select auth.uid()) is not null);
create policy "Users can add their own ratings" on public.ratings
for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Users can update their own ratings" on public.ratings
for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
create policy "Users can delete their own ratings" on public.ratings
for delete to authenticated using (user_id = (select auth.uid()));

create policy "Authenticated users can read references" on public.reference_titles
for select to authenticated using ((select auth.uid()) is not null);

create or replace function private.is_admin() returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and is_admin
  );
$$;

drop function private.is_active_member();

-- A regular view recalculates from ratings on every read. SECURITY INVOKER
-- makes the underlying ratings and profiles RLS policies apply to callers.
create view public.official_group_ratings
with (security_invoker = true)
as
select
  r.title_id,
  round(avg(r.score), 1) as score,
  count(*)::integer as rating_count
from public.ratings r
join public.profiles p on p.id = r.user_id
where p.is_trusted_rater
group by r.title_id;

revoke all on public.official_group_ratings from public, anon;
grant select on public.official_group_ratings to authenticated;
