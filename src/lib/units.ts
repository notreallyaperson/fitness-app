import type { DistanceUnit, WeightUnit } from "@/lib/types/domain";

const KG_PER_LB = 0.45359237;
const KM_PER_MI = 1.609344;

export const kgToLbs = (kg: number) => kg / KG_PER_LB;
export const lbsToKg = (lbs: number) => lbs * KG_PER_LB;
export const kmToMi  = (km: number) => km / KM_PER_MI;
export const miToKm  = (mi: number) => mi * KM_PER_MI;
export const mToKm   = (m: number)  => m / 1000;

export function toKg(value: number | null, unit: WeightUnit | null): number | null {
  if (value == null || unit == null) return null;
  return unit === "lbs" ? lbsToKg(value) : value;
}

export function toKm(value: number | null, unit: DistanceUnit | null): number | null {
  if (value == null || unit == null) return null;
  if (unit === "km") return value;
  if (unit === "mi") return miToKm(value);
  return mToKm(value);
}

interface FormatWeightOpts { fromUnit?: WeightUnit }
export function formatWeight(
  value: number,
  displayUnit: WeightUnit,
  opts: FormatWeightOpts = {},
): string {
  const fromUnit = opts.fromUnit ?? displayUnit;
  let v = value;
  if (fromUnit !== displayUnit) {
    v = displayUnit === "lbs" ? kgToLbs(value) : lbsToKg(value);
  }
  const rounded = Math.round(v * 10) / 10;
  const display = Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1);
  return `${display} ${displayUnit}`;
}

interface FormatDistanceOpts { fromUnit?: DistanceUnit }
export function formatDistance(
  value: number,
  displayUnit: DistanceUnit,
  opts: FormatDistanceOpts = {},
): string {
  const fromUnit = opts.fromUnit ?? displayUnit;
  let v = value;
  if (fromUnit !== displayUnit) {
    const km = toKm(value, fromUnit) ?? 0;
    v = displayUnit === "mi" ? kmToMi(km) : displayUnit === "m" ? km * 1000 : km;
  }
  return `${v.toFixed(2)} ${displayUnit}`;
}

export function formatDuration(totalSeconds: number): string {
  const s = Math.floor(totalSeconds % 60);
  const m = Math.floor((totalSeconds / 60) % 60);
  const h = Math.floor(totalSeconds / 3600);
  const pad = (n: number) => String(n).padStart(2, "0");
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${m}:${pad(s)}`;
}
