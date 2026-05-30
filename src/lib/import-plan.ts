import type { MetricKind } from "@/lib/types/domain";
import type { SetInput, WorkoutImport } from "@/lib/validation";

/**
 * Best-effort metric_kind for an exercise we have to auto-create, derived from
 * what its sets actually carry. A catalog match overrides this downstream.
 */
export function inferMetricKind(sets: SetInput[]): MetricKind {
  const hasTime = sets.some((s) => s.time_seconds != null);
  const hasDistance = sets.some((s) => s.distance != null);
  if (hasDistance && hasTime) return "distance_time";
  if (hasDistance) return "distance_only";
  if (hasTime) return "time_only";
  return "weight_reps";
}

/**
 * A set normalised to a fixed shape: every field is present (absent ones become
 * null, is_warmup false). This uniform key set is required so importWorkout can
 * bulk-insert all sets in one request — PostgREST rejects an array whose objects
 * have differing keys (error PGRST102 "All object keys must match").
 */
export interface ImportPlanSet {
  position: number;
  reps: number | null;
  weight: number | null;
  weight_unit: SetInput["weight_unit"];
  time_seconds: number | null;
  distance: number | null;
  distance_unit: SetInput["distance_unit"];
  rpe: number | null;
  is_warmup: boolean;
  notes: string | null;
}

function normaliseSet(set: SetInput, position: number): ImportPlanSet {
  return {
    position,
    reps: set.reps ?? null,
    weight: set.weight ?? null,
    weight_unit: set.weight_unit ?? null,
    time_seconds: set.time_seconds ?? null,
    distance: set.distance ?? null,
    distance_unit: set.distance_unit ?? null,
    rpe: set.rpe ?? null,
    is_warmup: set.is_warmup ?? false,
    notes: set.notes ?? null,
  };
}

export interface ImportPlanExercise {
  name: string;
  /** metric_kind to use if the exercise must be created (catalog match wins). */
  metricKind: MetricKind;
  notes: string | null;
  sets: ImportPlanSet[];
}

export interface ImportPlan {
  name: string;
  notes: string | null;
  exercises: ImportPlanExercise[];
}

/**
 * Turn validated import JSON into an insert-ready plan: resolved metric_kind
 * per exercise and explicit 0..n positions per set. Pure — no DB access.
 */
export function buildImportPlan(input: WorkoutImport): ImportPlan {
  return {
    name: input.name,
    notes: input.notes ?? null,
    exercises: input.exercises.map((ex) => ({
      name: ex.name,
      metricKind: ex.metric_kind ?? inferMetricKind(ex.sets),
      notes: ex.notes ?? null,
      sets: ex.sets.map((s, i) => normaliseSet(s, i)),
    })),
  };
}
