-- IMDb exports are a personal watch history, never Nuisance ratings.
create table public.imdb_imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  imdb_id text not null check (imdb_id ~ '^tt[0-9]{7,12}$'),
  source_title text not null check (char_length(source_title) between 1 and 300),
  source_year integer check (source_year between 1870 and 2200),
  source_media_type text check (source_media_type in ('movie', 'tv')),
  title_id uuid references public.titles (id) on delete set null,
  match_attempted_at timestamptz,
  imported_at timestamptz not null default now(),
  unique (user_id, imdb_id)
);

create index imdb_imports_user_recent_idx on public.imdb_imports (user_id, imported_at desc);
create index imdb_imports_user_title_idx on public.imdb_imports (user_id, title_id);

alter table public.imdb_imports enable row level security;
create policy "Users can read their own IMDb imports" on public.imdb_imports
for select to authenticated using (user_id = (select auth.uid()));
create policy "Users can add their own IMDb imports" on public.imdb_imports
for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Users can update their own IMDb imports" on public.imdb_imports
for update to authenticated using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
create policy "Users can delete their own IMDb imports" on public.imdb_imports
for delete to authenticated using (user_id = (select auth.uid()));
grant select, insert, update, delete on public.imdb_imports to authenticated;
