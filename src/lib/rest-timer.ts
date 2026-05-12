export function remainingSeconds({
  startedAt,
  durationMs,
  now,
}: {
  startedAt: number;
  durationMs: number;
  now: number;
}): number {
  const left = Math.ceil((startedAt + durationMs - now) / 1000);
  return Math.max(0, left);
}
