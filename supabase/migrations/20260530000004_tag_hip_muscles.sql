-- 20260530000004_tag_hip_muscles.sql
-- Apply the new adductors/abductors muscle groups to the exercises that
-- target them. Idempotent: scoped to system rows by exact name.

-- Adductor Ball Squeeze Hold now has a real primary muscle.
update exercises
set primary_muscle = 'adductors'
where owner_user_id is null
  and name = 'Adductor Ball Squeeze Hold'
  and primary_muscle is null;

-- Side lunge loads the inner thigh of the working leg.
update exercises
set secondary_muscles = '{glutes,hamstrings,adductors}'::muscle_group[]
where owner_user_id is null
  and name = 'DB Side Lunge';

-- Lateral bounds are driven by hip abduction.
update exercises
set secondary_muscles = '{quads,hamstrings,calves,abductors}'::muscle_group[]
where owner_user_id is null
  and name = 'Lateral Bounds';
