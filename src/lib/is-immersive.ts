/**
 * Immersive routes hide global chrome (top header + bottom nav). The live
 * session detail (`/sessions/<id>`) is immersive; `/sessions/start` and
 * `/sessions/import` are not.
 */
export function isImmersiveRoute(pathname: string): boolean {
  return /^\/sessions\/(?!start$|import$)[^/]+$/.test(pathname);
}
