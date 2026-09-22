-- A paginated, user-scoped view of imported titles and their live rating status.
-- Rating status derives from ratings, so it stays correct after rating or deleting.
create view public.imdb_library
with (security_invoker = true)
as
select
  i.id,
  i.user_id,
  i.imdb_id,
  coalesce(t.title, i.source_title) as title,
  coalesce(t.release_year, i.source_year) as release_year,
  coalesce(t.media_type, i.source_media_type, 'movie') as media_type,
  t.tmdb_id,
  t.poster_path,
  i.title_id,
  i.match_attempted_at,
  i.imported_at,
  (r.id is not null) as is_rated
from public.imdb_imports i
left join public.titles t on t.id = i.title_id
left join public.ratings r on r.user_id = i.user_id and r.title_id = i.title_id
where i.user_id = (select auth.uid());

revoke all on public.imdb_library from public, anon;
grant select on public.imdb_library to authenticated;
