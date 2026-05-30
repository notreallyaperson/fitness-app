-- 20260530000002_seed_football_exercises.sql
-- System exercises (owner_user_id IS NULL) for a football athlete program:
-- lower/upper strength, calves, core/stability, plyometrics, sprints,
-- football skill work, and recovery.
--
-- Idempotent: each row is only inserted when no system exercise of the same
-- name already exists, so re-running the migration is safe and it will not
-- duplicate rows already present in the original seed.
--
-- Schema limitations worth noting (callers should be aware):
--   * one metric_kind per exercise — per-side (L/R) and multi-stat tracking
--     (goals/assists/rating, step counts) are not modelled.
--   * muscle_group has no adductor/groin value; adductor-focused work uses a
--     NULL primary_muscle.

insert into exercises (name, metric_kind, primary_muscle, secondary_muscles, equipment, default_rest_seconds)
select v.name,
       v.metric_kind::metric_kind,
       v.primary_muscle::muscle_group,
       v.secondary_muscles::muscle_group[],
       v.equipment::equipment_type[],
       v.rest
from (values
  -- LOWER BODY / CALF STRENGTH (weight_reps) ------------------------------
  ('Smith Machine Split Squat',      'weight_reps', 'quads',      '{glutes,hamstrings}',   '{smith_machine}',        120),
  ('Single Leg RDL',                 'weight_reps', 'hamstrings', '{glutes,lower_back,forearms}', '{dumbbell}',       90),
  ('Box Step-Up + Knee Drive',       'weight_reps', 'quads',      '{glutes,hamstrings}',   '{dumbbell,box}',          90),
  ('DB Side Lunge',                  'weight_reps', 'quads',      '{glutes,hamstrings}',   '{dumbbell}',              75),
  ('Standing Single Leg Calf Raise', 'weight_reps', 'calves',     '{}',                    '{dumbbell}',              60),
  ('Bent Knee Soleus Raise',         'weight_reps', 'calves',     '{}',                    '{plates,bench}',          60),
  -- UPPER BODY (weight_reps) ----------------------------------------------
  ('Half Kneeling Single Arm Press', 'weight_reps', 'shoulders',  '{triceps,abs}',         '{dumbbell}',              75),
  ('Single Arm Cable Row',           'weight_reps', 'back',       '{lats,biceps}',         '{cable_machine}',         75),
  ('DB Skullcrusher',                'weight_reps', 'triceps',    '{}',                    '{dumbbell,bench}',         60),
  -- CORE / STABILITY (weight_reps) ----------------------------------------
  ('Glute Bridge',                   'weight_reps', 'glutes',     '{hamstrings}',          '{plates}',                60),
  -- UPPER BODY (weighted_bodyweight_reps) ---------------------------------
  ('Weighted Chin-up',               'weighted_bodyweight_reps', 'biceps', '{lats,back}',  '{pull_up_bar,plates}',   120),
  -- CORE / PLYO (bodyweight_reps) -----------------------------------------
  ('Bear Plank Shoulder Taps',       'bodyweight_reps', 'abs',        '{obliques,shoulders}', '{bodyweight}',         45),
  ('Single Leg Glute Bridge',        'bodyweight_reps', 'glutes',     '{hamstrings}',         '{bodyweight}',         45),
  ('Pogo Jumps',                     'bodyweight_reps', 'calves',     '{quads,glutes}',       '{bodyweight}',         60),
  ('Lateral Bounds',                 'bodyweight_reps', 'glutes',     '{quads,hamstrings,calves}', '{bodyweight}',    60),
  ('Single Leg Hop + Stick',         'bodyweight_reps', 'quads',      '{glutes,calves}',      '{bodyweight}',         60),
  ('Single Leg RDL Reach to Hop',    'bodyweight_reps', 'hamstrings', '{glutes,calves}',      '{bodyweight}',         60),
  -- CORE / STABILITY (time_only) ------------------------------------------
  ('Bear Plank',                     'time_only', 'abs',  '{obliques,shoulders}', '{bodyweight}',     45),
  ('Adductor Ball Squeeze Hold',     'time_only', null,   '{}',                   '{medicine_ball}',  45),
  -- FOOTBALL SKILL WORK (time_only, minutes) ------------------------------
  ('Ball Mastery',                   'time_only', 'cardio',    '{}',       '{bodyweight}', 0),
  ('Wall Passing',                   'time_only', 'cardio',    '{}',       '{bodyweight}', 0),
  ('Dribbling',                      'time_only', 'cardio',    '{}',       '{bodyweight}', 0),
  ('Crossing',                       'time_only', 'cardio',    '{}',       '{bodyweight}', 0),
  ('Shooting',                       'time_only', 'cardio',    '{}',       '{bodyweight}', 0),
  ('Match',                          'time_only', 'full_body', '{cardio}', '{bodyweight}', 0),
  -- RECOVERY (time_only, minutes) -----------------------------------------
  ('Sauna',                          'time_only', null,     '{}',             '{bodyweight}', 0),
  ('Walking',                        'time_only', 'cardio', '{quads,glutes}', '{bodyweight}', 0),
  ('Mobility',                       'time_only', null,     '{}',             '{bodyweight}', 0),
  -- CORE / CARRY (time_weight) --------------------------------------------
  ('Single Arm Farmer Carry + Ball Dribble', 'time_weight', 'full_body', '{forearms,traps,obliques}', '{dumbbell}', 60),
  -- SPRINT DEVELOPMENT (distance_time) ------------------------------------
  ('10m Accelerations',              'distance_time', 'quads',  '{hamstrings,glutes,calves}', '{bodyweight}', 120),
  ('20m Accelerations',              'distance_time', 'quads',  '{hamstrings,glutes,calves}', '{bodyweight}', 120),
  ('Tempo Runs',                     'distance_time', 'cardio', '{quads,hamstrings,glutes}',  '{bodyweight}', 60),
  ('Repeat Sprint Session',          'distance_time', 'cardio', '{quads,hamstrings,glutes}',  '{bodyweight}', 90)
) as v(name, metric_kind, primary_muscle, secondary_muscles, equipment, rest)
where not exists (
  select 1 from exercises e
  where e.owner_user_id is null and e.name = v.name
);
