import type { MetricKind } from "@/lib/types/domain";

export type MetricFields = {
  reps?: boolean;
  weight?: boolean;
  time?: boolean;
  distance?: boolean;
};

/** Which input fields each metric kind exposes when logging or editing a set. */
export const METRIC_FIELDS: Record<MetricKind, MetricFields> = {
  weight_reps: { reps: true, weight: true },
  bodyweight_reps: { reps: true },
  weighted_bodyweight_reps: { reps: true, weight: true },
  time_only: { time: true },
  time_weight: { time: true, weight: true },
  distance_only: { distance: true },
  distance_time: { distance: true, time: true },
  none: {},
};
