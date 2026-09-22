-- Run as the database owner. All test rows are rolled back.
begin;

insert into auth.users (id, aud, role, email)
values ('00000000-0000-4000-8000-00000c0a0001', 'authenticated', 'authenticated', 'rating-flow-test@invalid.example');

insert into public.titles (id, media_type, tmdb_id, title)
values ('00000000-0000-4000-8000-00000c0b0001', 'movie', 2147000011, 'Rating flow test title');

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000c0a0001', true);
set local role authenticated;

insert into public.ratings (user_id, title_id, score)
values ((select auth.uid()), '00000000-0000-4000-8000-00000c0b0001', 0)
on conflict (user_id, title_id) do update set score = excluded.score;
do $test$ begin
  if (select score from public.ratings where user_id = (select auth.uid())) is distinct from 0 then
    raise exception 'Special score 0 was not saved';
  end if;
end $test$;

insert into public.ratings (user_id, title_id, score)
values ((select auth.uid()), '00000000-0000-4000-8000-00000c0b0001', 1)
on conflict (user_id, title_id) do update set score = excluded.score;
do $test$ begin
  if (select score from public.ratings where user_id = (select auth.uid())) is distinct from 1 then
    raise exception 'Special score 1 did not replace the old rating';
  end if;
end $test$;

insert into public.ratings (user_id, title_id, score)
values ((select auth.uid()), '00000000-0000-4000-8000-00000c0b0001', 6.7)
on conflict (user_id, title_id) do update set score = excluded.score;
do $test$ begin
  if (select count(*) from public.ratings where user_id = (select auth.uid())) <> 1
    or (select score from public.ratings where user_id = (select auth.uid())) is distinct from 6.7 then
    raise exception 'Existing rating was not replaced by a decimal rating';
  end if;
end $test$;

reset role;
rollback;
