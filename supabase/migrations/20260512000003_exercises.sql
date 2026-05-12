-- 20260512000003_exercises.sql
-- Exercise library: system rows (owner_user_id IS NULL) + per-user rows.

create extension if not exists pg_trgm;

create table exercises (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  description text,
  metric_kind metric_kind not null,
  default_rest_seconds int not null default 90,
  primary_muscle muscle_group,
  secondary_muscles muscle_group[] not null default '{}',
  equipment equipment_type[] not null default '{}',
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- a user cannot have two custom exercises with the same name
  unique (owner_user_id, name)
);

create index exercises_name_trgm
  on exercises using gin (lower(name) gin_trgm_ops);

create index exercises_equipment_gin on exercises using gin (equipment);
create index exercises_secondary_muscles_gin on exercises using gin (secondary_muscles);
create index exercises_primary_muscle_idx on exercises (primary_muscle);
create index exercises_owner_idx on exercises (owner_user_id);

create trigger exercises_touch_updated_at
  before update on exercises
  for each row execute function public.touch_updated_at();
