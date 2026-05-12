import { toKg, toKm } from "@/lib/units";
import type { MetricKind } from "@/lib/types/domain";

interface SetInput {
  is_warmup: boolean;
  reps: number | null;
  weight: number | null;
  weight_unit: "kg" | "lbs" | null;
  time_seconds: number | null;
  distance: number | null;
  distance_unit: "m" | "km" | "mi" | null;
}

export function computeSetVolumeKg(
  set: SetInput,
  metricKind: MetricKind,
  sessionBodyweightKg: number | null,
): number {
  if (set.is_warmup) return 0;
  const wKg = toKg(set.weight, set.weight_unit) ?? 0;
  const reps = set.reps ?? 0;
  const time = set.time_seconds ?? 0;
  const distKm = toKm(set.distance, set.distance_unit) ?? 0;
  const bw = sessionBodyweightKg ?? 0;

  switch (metricKind) {
    case "weight_reps":
      return wKg * reps;
    case "bodyweight_reps":
      return bw * reps;
    case "weighted_bodyweight_reps":
      return (bw + wKg) * reps;
    case "time_only":
      return 0;
    case "time_weight":
      return wKg * (time / 60);
    case "distance_only":
    case "distance_time":
      return bw * distKm;
    case "none":
      return 0;
  }
}
