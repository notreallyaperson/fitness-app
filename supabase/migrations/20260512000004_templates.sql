-- 20260512000004_templates.sql
-- Reusable workout templates plus their ordered exercises.

create table workout_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workout_templates_user_idx on workout_templates (user_id);

create trigger workout_templates_touch_updated_at
  before update on workout_templates
  for each row execute function public.touch_updated_at();

create table workout_template_exercises (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references workout_templates(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete restrict,
  position int not null,
  target_sets int,
  target_reps int,
  target_weight numeric,
  target_time_seconds int,
  target_distance numeric,
  target_distance_unit distance_unit,
  rest_seconds int,
  notes text,
  unique (template_id, position)
);

create index wte_template_idx on workout_template_exercises (template_id, position);
