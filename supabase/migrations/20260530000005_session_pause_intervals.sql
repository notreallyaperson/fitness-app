-- 20260530000005_session_pause_intervals.sql
-- Track pause/resume intervals so a session's *active* duration excludes breaks.
-- Each element: { "paused_at": <iso8601>, "resumed_at": <iso8601 | null> }.
-- At most one interval is open (resumed_at null) at a time — the current pause.

alter table sessions
  add column pause_intervals jsonb not null default '[]'::jsonb;
