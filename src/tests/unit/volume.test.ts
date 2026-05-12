import { describe, it, expect } from "vitest";
import { computeSetVolumeKg } from "@/lib/volume";

const base = {
  is_warmup: false,
  reps: null as number | null,
  weight: null as number | null,
  weight_unit: null as "kg" | "lbs" | null,
  time_seconds: null as number | null,
  distance: null as number | null,
  distance_unit: null as "m" | "km" | "mi" | null,
};

describe("computeSetVolumeKg", () => {
  it("returns 0 for warmup sets", () => {
    expect(computeSetVolumeKg({ ...base, is_warmup: true, reps: 10, weight: 100, weight_unit: "kg" }, "weight_reps", null)).toBe(0);
  });

  it("weight_reps in kg", () => {
    expect(computeSetVolumeKg({ ...base, reps: 8, weight: 60, weight_unit: "kg" }, "weight_reps", null)).toBe(480);
  });

  it("weight_reps in lbs is converted", () => {
    expect(computeSetVolumeKg({ ...base, reps: 5, weight: 220, weight_unit: "lbs" }, "weight_reps", null))
      .toBeCloseTo(220 * 0.45359237 * 5, 4);
  });

  it("bodyweight_reps multiplies by session bodyweight", () => {
    expect(computeSetVolumeKg({ ...base, reps: 12 }, "bodyweight_reps", 75)).toBe(900);
  });

  it("weighted_bodyweight_reps adds weight to bodyweight", () => {
    expect(computeSetVolumeKg({ ...base, reps: 5, weight: 20, weight_unit: "kg" }, "weighted_bodyweight_reps", 80)).toBe((80+20)*5);
  });

  it("time_only is always 0", () => {
    expect(computeSetVolumeKg({ ...base, time_seconds: 60 }, "time_only", 75)).toBe(0);
  });

  it("time_weight uses minutes", () => {
    expect(computeSetVolumeKg({ ...base, weight: 30, weight_unit: "kg", time_seconds: 120 }, "time_weight", null)).toBe(60);
  });

  it("distance_only multiplies bodyweight by km", () => {
    expect(computeSetVolumeKg({ ...base, distance: 5, distance_unit: "km" }, "distance_only", 70)).toBe(350);
  });

  it("distance_only converts mi", () => {
    expect(computeSetVolumeKg({ ...base, distance: 1, distance_unit: "mi" }, "distance_only", 70))
      .toBeCloseTo(70 * 1.609344, 4);
  });

  it("distance_only converts metres to km", () => {
    expect(computeSetVolumeKg({ ...base, distance: 750, distance_unit: "m" }, "distance_only", 80)).toBe(60);
  });

  it("none returns 0", () => {
    expect(computeSetVolumeKg(base, "none", 70)).toBe(0);
  });

  it("missing fields return 0 instead of NaN", () => {
    expect(computeSetVolumeKg(base, "weight_reps", null)).toBe(0);
    expect(computeSetVolumeKg(base, "bodyweight_reps", null)).toBe(0);
  });
});
