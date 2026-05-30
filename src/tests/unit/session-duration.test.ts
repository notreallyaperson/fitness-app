import { describe, it, expect } from "vitest";
import {
  activeElapsedSeconds,
  isPaused,
  applyPause,
  applyResume,
  type PauseInterval,
} from "@/lib/session-duration";

// Fixed reference timestamps (ms since epoch) for readable tests.
const T0 = Date.parse("2026-05-30T10:00:00.000Z"); // session start
const iso = (ms: number) => new Date(ms).toISOString();
const MIN = 60_000;

describe("activeElapsedSeconds", () => {
  it("grows with now when there are no pauses", () => {
    expect(
      activeElapsedSeconds({
        startedAt: iso(T0),
        endedAt: null,
        pauseIntervals: [],
        now: T0 + 5 * MIN,
      }),
    ).toBe(300);
  });

  it("excludes a single closed pause", () => {
    const intervals: PauseInterval[] = [
      { paused_at: iso(T0 + 2 * MIN), resumed_at: iso(T0 + 5 * MIN) }, // 3 min paused
    ];
    expect(
      activeElapsedSeconds({
        startedAt: iso(T0),
        endedAt: null,
        pauseIntervals: intervals,
        now: T0 + 10 * MIN,
      }),
    ).toBe(7 * 60); // 10 min span − 3 min paused
  });

  it("excludes the sum of multiple closed pauses", () => {
    const intervals: PauseInterval[] = [
      { paused_at: iso(T0 + 1 * MIN), resumed_at: iso(T0 + 2 * MIN) }, // 1 min
      { paused_at: iso(T0 + 4 * MIN), resumed_at: iso(T0 + 6 * MIN) }, // 2 min
    ];
    expect(
      activeElapsedSeconds({
        startedAt: iso(T0),
        endedAt: null,
        pauseIntervals: intervals,
        now: T0 + 10 * MIN,
      }),
    ).toBe(7 * 60); // 10 − 3 paused
  });

  it("freezes while an open pause is in effect, regardless of now", () => {
    const intervals: PauseInterval[] = [
      { paused_at: iso(T0 + 4 * MIN), resumed_at: null },
    ];
    const at = (now: number) =>
      activeElapsedSeconds({
        startedAt: iso(T0),
        endedAt: null,
        pauseIntervals: intervals,
        now,
      });
    expect(at(T0 + 5 * MIN)).toBe(4 * 60); // frozen at the pause point
    expect(at(T0 + 30 * MIN)).toBe(4 * 60); // still frozen much later
  });

  it("caps at ended_at when the session ended while running", () => {
    expect(
      activeElapsedSeconds({
        startedAt: iso(T0),
        endedAt: iso(T0 + 8 * MIN),
        pauseIntervals: [],
        now: T0 + 20 * MIN, // now is well past the end
      }),
    ).toBe(8 * 60);
  });

  it("excludes the paused tail when ended while paused (open interval closed at ended_at)", () => {
    const endedAt = iso(T0 + 12 * MIN);
    const intervals: PauseInterval[] = [
      { paused_at: iso(T0 + 9 * MIN), resumed_at: endedAt }, // closed at end
    ];
    expect(
      activeElapsedSeconds({
        startedAt: iso(T0),
        endedAt,
        pauseIntervals: intervals,
        now: T0 + 20 * MIN,
      }),
    ).toBe(9 * 60); // active time stopped at the pause
  });

  it("never returns a negative value", () => {
    expect(
      activeElapsedSeconds({
        startedAt: iso(T0),
        endedAt: null,
        pauseIntervals: [],
        now: T0 - 5 * MIN, // clock skew
      }),
    ).toBe(0);
  });
});

describe("isPaused", () => {
  it("is false with no intervals", () => {
    expect(isPaused([])).toBe(false);
  });

  it("is false when the last interval is closed", () => {
    expect(
      isPaused([{ paused_at: iso(T0), resumed_at: iso(T0 + MIN) }]),
    ).toBe(false);
  });

  it("is true when the last interval is open", () => {
    expect(
      isPaused([
        { paused_at: iso(T0), resumed_at: iso(T0 + MIN) },
        { paused_at: iso(T0 + 2 * MIN), resumed_at: null },
      ]),
    ).toBe(true);
  });
});

describe("applyPause", () => {
  it("appends an open interval when running", () => {
    const result = applyPause([], iso(T0 + MIN));
    expect(result).toEqual([{ paused_at: iso(T0 + MIN), resumed_at: null }]);
  });

  it("is idempotent when already paused (no double-open interval)", () => {
    const intervals: PauseInterval[] = [
      { paused_at: iso(T0 + MIN), resumed_at: null },
    ];
    expect(applyPause(intervals, iso(T0 + 2 * MIN))).toEqual(intervals);
  });
});

describe("applyResume", () => {
  it("closes the open interval", () => {
    const intervals: PauseInterval[] = [
      { paused_at: iso(T0 + MIN), resumed_at: null },
    ];
    expect(applyResume(intervals, iso(T0 + 3 * MIN))).toEqual([
      { paused_at: iso(T0 + MIN), resumed_at: iso(T0 + 3 * MIN) },
    ]);
  });

  it("is idempotent when not paused", () => {
    const intervals: PauseInterval[] = [
      { paused_at: iso(T0 + MIN), resumed_at: iso(T0 + 2 * MIN) },
    ];
    expect(applyResume(intervals, iso(T0 + 5 * MIN))).toEqual(intervals);
  });

  it("appends a fresh interval when pausing again after a resume", () => {
    let intervals: PauseInterval[] = applyPause([], iso(T0 + MIN));
    intervals = applyResume(intervals, iso(T0 + 2 * MIN));
    intervals = applyPause(intervals, iso(T0 + 4 * MIN));
    expect(intervals).toEqual([
      { paused_at: iso(T0 + MIN), resumed_at: iso(T0 + 2 * MIN) },
      { paused_at: iso(T0 + 4 * MIN), resumed_at: null },
    ]);
  });
});
