// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/env", () => ({
  publicEnv: {
    NEXT_PUBLIC_APP_URL: "https://fitness.qworky.tech",
    NEXT_PUBLIC_SUPABASE_URL: "https://synthetic.invalid",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "synthetic-only",
  },
}));
// Only the external auth boundary is replaced; real routing/response code runs.
vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: { getUser: async () => ({ data: { user: null }, error: null }) },
  }),
}));
vi.mock("@/lib/supabase/server", () => ({
  getSupabaseServer: () => {
    throw new Error("No-code callbacks must not exchange auth codes");
  },
}));
import { updateSession } from "@/lib/supabase/middleware";
import { GET } from "@/app/auth/callback/route";

const headers: Record<string, string>[] = [
  {
    host: "fitness.qworky.tech",
    "x-forwarded-host": "fitness.qworky.tech",
    "x-forwarded-proto": "https",
  },
  {
    host: "attacker.invalid",
    "x-forwarded-host": "attacker.invalid",
    "x-forwarded-proto": "http",
    forwarded: "host=attacker.invalid;proto=http",
  },
];
describe("canonical redirects behind a standalone reverse proxy", () => {
  beforeEach(() => vi.clearAllMocks());
  for (const proxy of headers) {
    it(`keeps unauthenticated redirects on the configured origin for ${proxy.host}`, async () => {
      const request = new NextRequest("http://127.0.0.1:32920/?next=https://attacker.invalid", {
        headers: proxy,
      });
      const response = await updateSession(request);
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe("https://fitness.qworky.tech/login");
    });
    it(`keeps no-code callback redirects on the configured origin for ${proxy.host}`, async () => {
      const request = new NextRequest(
        "https://0.0.0.0:3000/auth/callback?next=//attacker.invalid",
        { headers: proxy },
      );
      const response = await GET(request);
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe("https://fitness.qworky.tech/");
    });
  }
});
