-- 20260530000007_seed_imported_exercises.sql
-- System exercises (owner_user_id IS NULL) for names that appear in the
-- imported workout history (sessions.json) but had no catalog equivalent.
-- Each row's metric_kind matches how the movement is actually logged.
--
-- Idempotent: each row is only inserted when no system exercise of the same
-- name already exists, so re-running is safe.
--
-- Tagging notes:
--   * muscle_group has no hip-flexor value; acceleration/sprint drills use
--     'quads' primary with the posterior chain as secondary.
--   * adductor-focused secondary loading uses the 'adductors' value added in
--     20260530000003.

insert into exercises (name, metric_kind, primary_muscle, secondary_muscles, equipment, default_rest_seconds)
select v.name,
       v.metric_kind::metric_kind,
       v.primary_muscle::muscle_group,
       v.secondary_muscles::muscle_group[],
       v.equipment::equipment_type[],
       v.rest
from (values
  -- FOOTBALL (time_only, generic practice -- total time only) ----------------
  ('Football Practice',            'time_only',      'cardio',     '{}',                          '{bodyweight}',     0),
  -- RECOVERY / POOL (time_only) ---------------------------------------------
  ('Pool Walking',                 'time_only',      'cardio',     '{quads,glutes}',              '{swimming_pool}',  0),
  -- UPPER BODY (weight_reps) ------------------------------------------------
  ('Dumbbell Preacher Curl',       'weight_reps',    'biceps',     '{forearms}',                  '{dumbbell,bench}', 60),
  -- CHEST (bodyweight_reps) -------------------------------------------------
  ('Deficit Push-Ups',             'bodyweight_reps','chest',      '{triceps,shoulders}',         '{bodyweight}',     60),
  -- GLUTE / CORE VARIANTS ---------------------------------------------------
  ('Glute Bridge with Ball Squeeze','bodyweight_reps','glutes',    '{hamstrings,adductors}',      '{medicine_ball}',  45),
  ('Glute Bridge Hold',            'time_only',      'glutes',     '{hamstrings}',                '{bodyweight}',     30),
  -- CARRY (time_weight) -----------------------------------------------------
  ('Single Arm Farmer Carry',      'time_weight',    'full_body',  '{forearms,traps,obliques}',   '{dumbbell}',       60),
  -- CORE (bodyweight_reps / weight_reps) ------------------------------------
  ('V-Sits',                       'bodyweight_reps','abs',        '{obliques}',                  '{bodyweight}',     45),
  ('Dead Bug',                     'bodyweight_reps','abs',        '{obliques,lower_back}',       '{bodyweight}',     30),
  ('Plank DB Pull Through',        'weight_reps',    'abs',        '{obliques,shoulders,back}',   '{dumbbell}',       45),
  -- SPRINT / PLYO DRILLS (distance_only / bodyweight_reps) ------------------
  ('A-Skips',                      'distance_only',  'quads',      '{hamstrings,glutes,calves}',  '{bodyweight}',     60),
  ('Straight-Leg Bounds',          'distance_only',  'glutes',     '{hamstrings,calves,quads}',   '{bodyweight}',     60),
  ('Acceleration Run',             'distance_only',  'quads',      '{hamstrings,glutes,calves}',  '{bodyweight}',    120),
  ('Wall Drives',                  'bodyweight_reps','quads',      '{glutes,calves}',             '{bodyweight}',     45)
) as v(name, metric_kind, primary_muscle, secondary_muscles, equipment, rest)
where not exists (
  select 1 from exercises e
  where e.owner_user_id is null and e.name = v.name
);
