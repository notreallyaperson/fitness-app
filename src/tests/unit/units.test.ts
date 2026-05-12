import { describe, it, expect } from "vitest";
import {
  kgToLbs, lbsToKg, kmToMi, miToKm, mToKm,
  toKg, toKm, formatWeight, formatDistance, formatDuration,
} from "@/lib/units";

describe("kg <-> lbs", () => {
  it("converts kg to lbs", () => {
    expect(kgToLbs(100)).toBeCloseTo(220.462, 3);
  });
  it("converts lbs to kg", () => {
    expect(lbsToKg(220.462)).toBeCloseTo(100, 3);
  });
  it("round-trips", () => {
    expect(lbsToKg(kgToLbs(75))).toBeCloseTo(75, 6);
  });
});

describe("distance conversions", () => {
  it("km to mi", () => expect(kmToMi(5)).toBeCloseTo(3.10686, 4));
  it("mi to km", () => expect(miToKm(1)).toBeCloseTo(1.609344, 6));
  it("m to km", () => expect(mToKm(2500)).toBe(2.5));
});

describe("toKg", () => {
  it("returns null for nullish", () => expect(toKg(null, "kg")).toBeNull());
  it("passes through kg", () => expect(toKg(60, "kg")).toBe(60));
  it("converts lbs", () => expect(toKg(220, "lbs")).toBeCloseTo(99.79, 2));
});

describe("toKm", () => {
  it("returns null for nullish", () => expect(toKm(null, "km")).toBeNull());
  it("passes through km", () => expect(toKm(5, "km")).toBe(5));
  it("converts mi", () => expect(toKm(1, "mi")).toBeCloseTo(1.609, 3));
  it("converts m", () => expect(toKm(750, "m")).toBe(0.75));
});

describe("formatWeight", () => {
  it("renders kg with one decimal when fractional", () => {
    expect(formatWeight(62.5, "kg")).toBe("62.5 kg");
  });
  it("renders integer kg without decimal", () => {
    expect(formatWeight(60, "kg")).toBe("60 kg");
  });
  it("converts to lbs", () => {
    expect(formatWeight(60, "lbs", { fromUnit: "kg" })).toBe("132.3 lbs");
  });
});

describe("formatDistance", () => {
  it("renders km with two decimals", () => {
    expect(formatDistance(5, "km")).toBe("5.00 km");
  });
  it("converts to mi", () => {
    expect(formatDistance(5, "mi", { fromUnit: "km" })).toBe("3.11 mi");
  });
});

describe("formatDuration", () => {
  it("renders seconds under a minute", () => {
    expect(formatDuration(45)).toBe("0:45");
  });
  it("renders minutes:seconds", () => {
    expect(formatDuration(125)).toBe("2:05");
  });
  it("renders hours:minutes:seconds for >= 1h", () => {
    expect(formatDuration(3725)).toBe("1:02:05");
  });
});
