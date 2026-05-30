/**
 * Pure logic for computing a workout session's active duration, excluding any
 * paused intervals, plus the reducers that pause/resume the interval list.
 *
 * A session records pause intervals as `{ paused_at, resumed_at }` pairs. At
 * most one is "open" (`resumed_at: null`) at a time — the current pause.
 */

// A type alias (not an interface) so it stays assignable to the generated `Json`
// column type when persisted.
export type PauseInterval = {
  paused_at: string;
  resumed_at: string | null;
};

/** Sum of all paused time (ms). An open pause is measured up to `now`. */
function pausedMs(intervals: PauseInterval[], now: number): number {
  return intervals.reduce((total, { paused_at, resumed_at }) => {
    const end = resumed_at ? Date.parse(resumed_at) : now;
    return total + Math.max(0, end - Date.parse(paused_at));
  }, 0);
}

export interface ElapsedArgs {
  startedAt: string;
  endedAt: string | null;
  pauseIntervals: PauseInterval[];
  now: number;
}

/**
 * Active elapsed time in whole seconds: total span (start → ended/now) minus
 * paused time. While an interval is open, the open-pause term grows at the same
 * rate as `now`, so the result naturally freezes.
 */
export function activeElapsedSeconds({
  startedAt,
  endedAt,
  pauseIntervals,
  now,
}: ElapsedArgs): number {
  const end = endedAt ? Date.parse(endedAt) : now;
  const span = end - Date.parse(startedAt) - pausedMs(pauseIntervals, end);
  return Math.max(0, Math.floor(span / 1000));
}

/** True when the most recent interval is still open. */
export function isPaused(intervals: PauseInterval[]): boolean {
  const last = intervals[intervals.length - 1];
  return last != null && last.resumed_at == null;
}

/** Begin a pause. No-op if already paused. */
export function applyPause(intervals: PauseInterval[], nowIso: string): PauseInterval[] {
  if (isPaused(intervals)) return intervals;
  return [...intervals, { paused_at: nowIso, resumed_at: null }];
}

/** End the current pause. No-op if not paused. */
export function applyResume(intervals: PauseInterval[], nowIso: string): PauseInterval[] {
  if (!isPaused(intervals)) return intervals;
  return intervals.map((interval, i) =>
    i === intervals.length - 1 ? { ...interval, resumed_at: nowIso } : interval,
  );
}
