import { describe, it, expect } from "vitest";
import { remainingSeconds } from "@/lib/rest-timer";

describe("remainingSeconds", () => {
  it("counts down from start", () => {
    expect(remainingSeconds({ startedAt: 1000, durationMs: 90_000, now: 1000 })).toBe(90);
  });
  it("returns 0 at end", () => {
    expect(remainingSeconds({ startedAt: 0, durationMs: 30_000, now: 30_000 })).toBe(0);
  });
  it("returns 0 past end", () => {
    expect(remainingSeconds({ startedAt: 0, durationMs: 30_000, now: 60_000 })).toBe(0);
  });
  it("rounds up to whole seconds", () => {
    expect(remainingSeconds({ startedAt: 0, durationMs: 90_000, now: 100 })).toBe(90);
  });
});
