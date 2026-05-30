// Lightweight liveness probe for the compose healthcheck and the nginx
// upstream — no auth, no DB, just confirms the server is up.
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ ok: true });
}
