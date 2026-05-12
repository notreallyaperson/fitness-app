-- 20260512000006_volume_view.sql
-- Per-set volume in kg, normalised so lbs and miles convert before summing.
-- Warmup sets are zero. Mirrors src/lib/volume.ts — keep them in sync.

create or replace view set_volumes as
select
  s.id            as set_id,
  s.session_exercise_id,
  se.session_id,
  se.exercise_id,
  s.is_warmup,
  case
    when s.is_warmup then 0
    else
      case e.metric_kind
        when 'weight_reps' then
          coalesce(case s.weight_unit when 'lbs' then s.weight * 0.45359237 else s.weight end, 0)
          * coalesce(s.reps, 0)
        when 'bodyweight_reps' then
          coalesce(sess.bodyweight, 0) * coalesce(s.reps, 0)
        when 'weighted_bodyweight_reps' then
          (coalesce(sess.bodyweight, 0)
           + coalesce(case s.weight_unit when 'lbs' then s.weight * 0.45359237 else s.weight end, 0))
          * coalesce(s.reps, 0)
        when 'time_only' then 0
        when 'time_weight' then
          coalesce(case s.weight_unit when 'lbs' then s.weight * 0.45359237 else s.weight end, 0)
          * coalesce(s.time_seconds, 0) / 60.0
        when 'distance_only' then
          coalesce(sess.bodyweight, 0)
          * coalesce(case s.distance_unit
                       when 'mi' then s.distance * 1.609344
                       when 'm'  then s.distance / 1000.0
                       else s.distance
                     end, 0)
        when 'distance_time' then
          coalesce(sess.bodyweight, 0)
          * coalesce(case s.distance_unit
                       when 'mi' then s.distance * 1.609344
                       when 'm'  then s.distance / 1000.0
                       else s.distance
                     end, 0)
        else 0
      end
  end as volume_kg
from sets s
join session_exercises se on se.id = s.session_exercise_id
join sessions sess on sess.id = se.session_id
join exercises e on e.id = se.exercise_id;
