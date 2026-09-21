-- Group membership is approved explicitly. New accounts cannot read group data.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  avatar_url text,
  is_active boolean not null default false,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.titles (
  id uuid primary key default gen_random_uuid(),
  media_type text not null check (media_type in ('movie', 'tv')),
  tmdb_id integer not null check (tmdb_id > 0),
  title text not null check (char_length(title) between 1 and 300),
  poster_path text check (poster_path is null or poster_path ~ '^/[A-Za-z0-9._/-]+$'),
  release_year integer check (release_year between 1870 and 2200),
  created_at timestamptz not null default now(),
  unique (media_type, tmdb_id)
);

create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title_id uuid not null references public.titles (id) on delete cascade,
  score numeric not null check (score between 0 and 10 and score * 10 = trunc(score * 10)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, title_id)
);

create table public.reference_titles (
  score smallint primary key check (score between 2 and 10),
  title_id uuid not null unique references public.titles (id) on delete cascade,
  updated_by uuid not null references public.profiles (id),
  updated_at timestamptz not null default now()
);

create index ratings_user_recent_idx on public.ratings (user_id, updated_at desc);
create index ratings_title_idx on public.ratings (title_id);

create function private.is_active_member() returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and is_active
  );
$$;

create function private.is_admin() returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and is_active and is_admin
  );
$$;

revoke all on function private.is_active_member() from public, anon;
revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_active_member() to authenticated;
grant execute on function private.is_admin() to authenticated;

create function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1), 'Member'), 80),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;
revoke all on function private.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users
for each row execute function private.handle_new_user();

alter table public.profiles enable row level security;
alter table public.titles enable row level security;
alter table public.ratings enable row level security;
alter table public.reference_titles enable row level security;

create policy "Members can read approved profiles and their own" on public.profiles
for select to authenticated
using (id = (select auth.uid()) or (is_active and (select private.is_active_member())));

create policy "Members can read titles" on public.titles
for select to authenticated using ((select private.is_active_member()));
create policy "Members can add titles" on public.titles
for insert to authenticated with check ((select private.is_active_member()));

create policy "Members can read group ratings" on public.ratings
for select to authenticated using ((select private.is_active_member()));
create policy "Members can add own ratings" on public.ratings
for insert to authenticated
with check ((select private.is_active_member()) and user_id = (select auth.uid()));
create policy "Members can update own ratings" on public.ratings
for update to authenticated
using ((select private.is_active_member()) and user_id = (select auth.uid()))
with check ((select private.is_active_member()) and user_id = (select auth.uid()));
create policy "Members can delete own ratings" on public.ratings
for delete to authenticated
using ((select private.is_active_member()) and user_id = (select auth.uid()));

create policy "Members can read references" on public.reference_titles
for select to authenticated using ((select private.is_active_member()));
create policy "Admins can add references" on public.reference_titles
for insert to authenticated
with check ((select private.is_admin()) and updated_by = (select auth.uid()));
create policy "Admins can update references" on public.reference_titles
for update to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()) and updated_by = (select auth.uid()));
create policy "Admins can delete references" on public.reference_titles
for delete to authenticated using ((select private.is_admin()));

grant select on public.profiles to authenticated;
grant select, insert on public.titles to authenticated;
grant select, insert, update, delete on public.ratings to authenticated;
grant select, insert, update, delete on public.reference_titles to authenticated;
