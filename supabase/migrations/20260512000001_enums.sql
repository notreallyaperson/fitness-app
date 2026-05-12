-- 20260512000001_enums.sql
-- Postgres enums backing the exercise tracker schema.

create type muscle_group as enum (
  'chest','back','lats','traps','lower_back','shoulders','biceps','triceps',
  'forearms','quads','hamstrings','glutes','calves','abs','obliques','neck',
  'full_body','cardio'
);

create type metric_kind as enum (
  'weight_reps','bodyweight_reps','weighted_bodyweight_reps',
  'time_only','time_weight','distance_only','distance_time','none'
);

create type equipment_type as enum (
  'bodyweight','barbell','dumbbell','kettlebell','ez_bar','trap_bar','plates',
  'bench','incline_bench','decline_bench','squat_rack','power_rack','smith_machine',
  'cable_machine','pulldown_machine','leg_press','leg_extension','leg_curl','hack_squat',
  'pull_up_bar','dip_bar','parallel_bars','rings','suspension_trainer',
  'resistance_band','medicine_ball','ab_wheel','foam_roller','box','bosu_ball',
  'jump_rope','sled','treadmill','stationary_bike','rowing_machine','elliptical',
  'stair_climber','swimming_pool'
);

create type weight_unit as enum ('kg','lbs');
create type distance_unit as enum ('m','km','mi');
