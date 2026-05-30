-- 20260530000001_backfill_profiles.sql
-- Backfill profiles for any auth.users created before the on_auth_user_created
-- trigger existed (e.g. accounts made against the project before migrations
-- were applied). Idempotent: only inserts rows that are missing.

insert into public.profiles (id, display_name)
select u.id,
       coalesce(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1))
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;
