-- 20260530000006_match_exercises_fn.sql
-- Name-similarity lookup used as the no-API fallback for import matching.
-- SECURITY INVOKER (default) so the caller's RLS on exercises still applies:
-- a user only ever matches against system rows + their own exercises.

create or replace function match_exercises_by_name(query text, match_limit int default 1)
returns table (id uuid, name text, similarity real)
language sql
stable
as $$
  select e.id, e.name, similarity(lower(e.name), lower(query)) as similarity
  from exercises e
  where e.is_archived = false
  order by similarity desc
  limit greatest(match_limit, 1)
$$;
