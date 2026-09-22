-- Run as database owner; all test data is rolled back.
begin;

insert into auth.users (id, aud, role, email) values
  ('00000000-0000-4000-8000-00000c0d0001', 'authenticated', 'authenticated', 'imdb-test-a@invalid.example'),
  ('00000000-0000-4000-8000-00000c0d0002', 'authenticated', 'authenticated', 'imdb-test-b@invalid.example');

insert into public.titles (id, media_type, tmdb_id, title)
values ('00000000-0000-4000-8000-00000c0e0001', 'movie', 2147000012, 'IMDb queue test film');

insert into public.imdb_imports (user_id, imdb_id, source_title, source_media_type, title_id) values
  ('00000000-0000-4000-8000-00000c0d0001', 'tt2147000012', 'IMDb queue test film', 'movie', '00000000-0000-4000-8000-00000c0e0001'),
  ('00000000-0000-4000-8000-00000c0d0002', 'tt2147000013', 'Another queue film', 'movie', null);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000c0d0001', true);
do $test$ begin
  if (select count(*) from public.imdb_library) <> 1
    or (select is_rated from public.imdb_library limit 1) is distinct from false then
    raise exception 'User A queue or isolation is incorrect';
  end if;
end $test$;

insert into public.ratings (user_id, title_id, score)
values ((select auth.uid()), '00000000-0000-4000-8000-00000c0e0001', 7.4);
do $test$ begin
  if (select is_rated from public.imdb_library limit 1) is distinct from true then
    raise exception 'Rated imported film did not leave the queue';
  end if;
end $test$;

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000c0d0002', true);
do $test$ begin
  if (select count(*) from public.imdb_library) <> 1
    or (select imdb_id from public.imdb_library limit 1) <> 'tt2147000013' then
    raise exception 'User B can see another user import';
  end if;
end $test$;

reset role;
rollback;
