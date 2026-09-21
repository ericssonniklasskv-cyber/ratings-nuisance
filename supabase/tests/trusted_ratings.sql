-- Run as the database owner. Everything, including auth users, is rolled back.
begin;

insert into auth.users (id, aud, role, email)
values
  ('00000000-0000-4000-8000-00000000aa01', 'authenticated', 'authenticated', 'ratings-test-a@invalid.example'),
  ('00000000-0000-4000-8000-00000000aa02', 'authenticated', 'authenticated', 'ratings-test-b@invalid.example'),
  ('00000000-0000-4000-8000-00000000aa03', 'authenticated', 'authenticated', 'ratings-test-c@invalid.example');

do $test$
begin
  if (select count(*) from public.profiles where id in (
    '00000000-0000-4000-8000-00000000aa01',
    '00000000-0000-4000-8000-00000000aa02',
    '00000000-0000-4000-8000-00000000aa03'
  ) and not is_active and not is_trusted_rater) <> 3 then
    raise exception 'New auth users did not receive untrusted profiles';
  end if;
end $test$;

-- C is inactive under the old model and untrusted, but can use the app.
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000000aa03', true);
set local role authenticated;
insert into public.titles (id, media_type, tmdb_id, title)
values
  ('00000000-0000-4000-8000-00000000bb01', 'movie', 2147000001, 'Transactional test title 1'),
  ('00000000-0000-4000-8000-00000000bb02', 'movie', 2147000002, 'Transactional test title 2');
insert into public.ratings (user_id, title_id, score)
values
  ('00000000-0000-4000-8000-00000000aa03', '00000000-0000-4000-8000-00000000bb01', 10.0),
  ('00000000-0000-4000-8000-00000000aa03', '00000000-0000-4000-8000-00000000bb02', 10.0);

do $test$
begin
  if (select count(*) from public.ratings where user_id = (select auth.uid())) <> 2 then
    raise exception 'Untrusted user cannot read their own ratings';
  end if;
  if exists (select 1 from public.official_group_ratings) then
    raise exception 'Untrusted ratings affected the official score';
  end if;
end $test$;

update public.ratings set score = 9.0
where user_id = (select auth.uid())
  and title_id = '00000000-0000-4000-8000-00000000bb02';
do $test$
begin
  if (select score from public.ratings where user_id = (select auth.uid())
      and title_id = '00000000-0000-4000-8000-00000000bb02') is distinct from 9.0 then
    raise exception 'User cannot update their own rating';
  end if;
end $test$;
delete from public.ratings where user_id = (select auth.uid())
  and title_id = '00000000-0000-4000-8000-00000000bb02';
insert into public.ratings (user_id, title_id, score)
values ((select auth.uid()), '00000000-0000-4000-8000-00000000bb02', 10.0);

update public.profiles set display_name = 'Test C' where id = (select auth.uid());
do $test$
declare denied boolean := false;
begin
  begin
    update public.profiles set is_trusted_rater = true where id = (select auth.uid());
  exception when insufficient_privilege then denied := true;
  end;
  if not denied then raise exception 'User could make themselves trusted'; end if;
end $test$;
reset role;

-- The owner marks A and B trusted; trust is unrelated to is_active.
update public.profiles set is_trusted_rater = true
where id in ('00000000-0000-4000-8000-00000000aa01', '00000000-0000-4000-8000-00000000aa02');

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000000aa01', true);
set local role authenticated;
insert into public.ratings (user_id, title_id, score)
values ('00000000-0000-4000-8000-00000000aa01', '00000000-0000-4000-8000-00000000bb01', 8.0);
reset role;

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000000aa02', true);
set local role authenticated;
insert into public.ratings (user_id, title_id, score)
values ('00000000-0000-4000-8000-00000000aa02', '00000000-0000-4000-8000-00000000bb01', 6.0);
reset role;

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000000aa03', true);
set local role authenticated;
do $test$
declare group_score numeric;
declare trusted_count integer;
declare changed integer;
begin
  select score, rating_count into group_score, trusted_count
  from public.official_group_ratings
  where title_id = '00000000-0000-4000-8000-00000000bb01';
  if group_score is distinct from 7.0 or trusted_count is distinct from 2 then
    raise exception 'Expected official score 7.0 from two trusted ratings';
  end if;
  if exists (select 1 from public.official_group_ratings
             where title_id = '00000000-0000-4000-8000-00000000bb02') then
    raise exception 'Title with only untrusted ratings received a score';
  end if;
  update public.ratings set score = 2.0
  where user_id = '00000000-0000-4000-8000-00000000aa01'
    and title_id = '00000000-0000-4000-8000-00000000bb01';
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'User changed another user rating'; end if;
end $test$;
reset role;

rollback;
