import "server-only";

/**
 * Current request time in milliseconds. A thin wrapper so dynamically-rendered
 * server components can stamp their render time without tripping the
 * "impure function during render" lint rule — request-scoped time is the
 * intended behaviour here (used to seed the live session clock).
 */
export function serverNowMs(): number {
  return Date.now();
}
