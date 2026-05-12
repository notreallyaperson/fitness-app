-- 20260512000005_sessions.sql
-- Workout sessions, their ordered exercises, and individual logged sets.

create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  template_id uuid references workout_templates(id) on delete set null,
  name text not null,
  performed_on date not null default current_date,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  bodyweight numeric,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sessions_user_perf_idx on sessions (user_id, performed_on desc);

create trigger sessions_touch_updated_at
  before update on sessions
  for each row execute function public.touch_updated_at();

create table session_exercises (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete restrict,
  position int not null,
  notes text,
  unique (session_id, position)
);

create index se_session_idx on session_exercises (session_id, position);
create index se_exercise_idx on session_exercises (exercise_id);

create table sets (
  id uuid primary key default gen_random_uuid(),
  session_exercise_id uuid not null references session_exercises(id) on delete cascade,
  position int not null,
  is_warmup boolean not null default false,
  reps int,
  weight numeric,
  weight_unit weight_unit,
  time_seconds numeric,
  distance numeric,
  distance_unit distance_unit,
  rpe numeric check (rpe is null or (rpe >= 1 and rpe <= 10)),
  notes text,
  completed_at timestamptz not null default now(),
  unique (session_exercise_id, position)
);

create index sets_se_idx on sets (session_exercise_id, position);
