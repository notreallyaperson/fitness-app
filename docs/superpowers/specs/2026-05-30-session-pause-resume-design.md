# Session pause / resume duration — design

**Date:** 2026-05-30
**Status:** Approved

## Problem

A live workout session tracks `started_at` and `ended_at`, and
[session-header.tsx](../../../src/components/session-header.tsx) shows a live
timer that counts continuously from `started_at` until `ended_at` is set. There
is no way to pause the workout (e.g. a break, an interruption) and have that gap
excluded from the recorded duration. The user wants to stop and resume the
workout, keeping a **record of the actual start/stop timestamps** so the full
active session time can be computed accurately.

## Decisions (from brainstorming)

- **Goal:** accurate *active* duration. No pause analytics/history UI needed —
  but the individual start/stop timestamps must still be stored (explicit
  requirement).
- **Pause behavior:** freeze the timer only. Set logging/editing stays available
  while paused.

## Approach: `pause_intervals` JSONB column

Store pause intervals as a JSONB array on `sessions`. Chosen over a separate
table (no analytics need → avoids new table + RLS + plumbing) and over a bare
accumulator (which would discard the per-interval timestamps the user asked to
keep). The JSONB column inherits the existing session RLS.

### Data model

New migration:

```sql
alter table sessions
  add column pause_intervals jsonb not null default '[]'::jsonb;
```

Each element: `{ "paused_at": <iso8601>, "resumed_at": <iso8601 | null> }`.
At most one interval is open (`resumed_at: null`) at a time — the current pause.

The generated `src/lib/types/database.ts` `sessions` Row/Insert/Update types are
updated by hand to include `pause_intervals: Json` so application code typechecks.

### Duration math — `src/lib/session-duration.ts` (pure module)

Mirrors the existing pure-logic pattern of `src/lib/rest-timer.ts`. All times in
milliseconds in, seconds out.

```
PauseInterval = { paused_at: string; resumed_at: string | null }

pausedMs(intervals, now)   = Σ ((resumed_at ?? now) − paused_at)
activeElapsedSeconds(args) = floor(((ended_at ?? now) − started_at − pausedMs) / 1000), min 0
isPaused(intervals)        = intervals.length > 0 && last.resumed_at == null
```

**Key property:** while paused, the open interval grows at the same rate as
`now`, so `activeElapsedSeconds` is naturally frozen — the timer loop needs no
special-casing.

### Server actions — `src/server/actions/sessions.ts`

Dedicated actions (not the generic `updateSession`) so the read-modify-write is
atomic on the server and clients cannot write arbitrary intervals. Each reads the
session's current `pause_intervals`, mutates, and writes back, then
`revalidatePath`.

- `pauseSessionAction(id)` — no-op if already paused or `ended_at` set; else
  append `{ paused_at: now, resumed_at: null }`.
- `resumeSessionAction(id)` — no-op if not paused; else set `resumed_at = now` on
  the open interval.
- **End while paused:** `updateSessionAction` setting `ended_at` also closes any
  open interval with `resumed_at = ended_at`, so the paused tail counts as paused
  (excluded), not active. (Implemented in the existing end-session path / DB
  layer so it holds regardless of entry point.)

DB helpers live in `src/lib/db/sessions.ts` (e.g. `setPauseIntervals`) or are
done inline via the existing `updateSession`.

### UI — `src/components/session-header.tsx`

- New prop `pauseIntervals: PauseInterval[]`, threaded from the SSR page
  [page.tsx](../../../src/app/sessions/[id]/page.tsx).
- Timer uses `activeElapsedSeconds` instead of the inline subtraction.
- Pause/Resume button next to the timer and "End session". Shown only when the
  session is not ended. Label/icon reflects current state.
- When paused: timer displays the frozen value with a subtle "Paused" indicator.
- The 1s tick interval keeps running while paused (cheap) but the displayed value
  is frozen by the math; or it can pause the interval too — either is correct.

## Testing

Pure-logic unit tests in `src/tests/unit/session-duration.test.ts`:

- running (no pauses) — elapsed grows with `now`
- single closed pause — gap excluded
- multiple closed pauses — sum excluded
- open pause — elapsed frozen at the pause point regardless of `now`
- ended while running — caps at `ended_at`
- ended while paused (open interval closed at `ended_at`) — tail excluded
- `isPaused` true/false detection
- never negative

Action-reducer logic (the array transform for pause/resume) is unit-tested as a
pure function so it can be covered without a DB: idempotent pause (no double-open
interval), idempotent resume, pause after resume appends a new interval.

## Out of scope

- Pause history / analytics UI.
- Auto-pause on inactivity.
- Locking set logging while paused.
