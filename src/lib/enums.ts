import type { EquipmentType, MetricKind, MuscleGroup } from "@/lib/types/domain";

export const MUSCLE_GROUPS: readonly MuscleGroup[] = [
  "chest","back","lats","traps","lower_back","shoulders","biceps","triceps",
  "forearms","quads","hamstrings","glutes","adductors","abductors","groin",
  "calves","abs","obliques","neck","full_body","cardio",
] as const;

export const METRIC_KINDS: readonly MetricKind[] = [
  "weight_reps","bodyweight_reps","weighted_bodyweight_reps",
  "time_only","time_weight","distance_only","distance_time","none",
] as const;

export const EQUIPMENT_TYPES: readonly EquipmentType[] = [
  "bodyweight","barbell","dumbbell","kettlebell","ez_bar","trap_bar","plates",
  "bench","incline_bench","decline_bench","squat_rack","power_rack","smith_machine",
  "cable_machine","pulldown_machine","leg_press","leg_extension","leg_curl","hack_squat",
  "pull_up_bar","dip_bar","parallel_bars","rings","suspension_trainer",
  "resistance_band","medicine_ball","ab_wheel","foam_roller","box","bosu_ball",
  "jump_rope","sled","treadmill","stationary_bike","rowing_machine","elliptical",
  "stair_climber","swimming_pool",
] as const;

const TITLE_CASE_OVERRIDES: Record<string, string> = {
  ez_bar: "EZ bar",
  bosu_ball: "BOSU ball",
  rdl: "RDL",
};

export function humaniseEnum(value: string): string {
  if (value in TITLE_CASE_OVERRIDES) return TITLE_CASE_OVERRIDES[value];
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
