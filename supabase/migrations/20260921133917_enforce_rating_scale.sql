alter table public.ratings
  add constraint ratings_score_meaning_check
  check (score in (0, 1) or score between 2 and 10);
