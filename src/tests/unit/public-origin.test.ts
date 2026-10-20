// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { appUrl } from "@/lib/app-url";

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://synthetic.invalid");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "synthetic-only");
});
afterEach(() => vi.unstubAllEnvs());

it.each([
  undefined,
  "",
  "not-a-url",
  "//attacker.invalid",
  "ftp://fitness.qworky.tech",
  "http://fitness.qworky.tech",
  "https://user:password@fitness.qworky.tech",
  "https://fitness.qworky.tech/path",
  "https://fitness.qworky.tech?next=//attacker.invalid",
  "https://fitness.qworky.tech#fragment",
  "http://localhost:3000",
  "https://0.0.0.0:3000",
  "https://localhost:3000",
  "https://[::1]:3000",
  " https://fitness.qworky.tech",
  "https://fitness.qworky.tech\\attacker.invalid",
])("fails closed for invalid production origin %s", async (origin) => {
  vi.stubEnv("NEXT_PUBLIC_APP_URL", origin);
  await expect(import("@/lib/env")).rejects.toThrow();
});

it("normalizes a configured root URL to its canonical origin", async () => {
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://fitness.qworky.tech/");
  const { publicEnv } = await import("@/lib/env");
  expect(publicEnv.NEXT_PUBLIC_APP_URL).toBe("https://fitness.qworky.tech");
});

it("retains explicit local HTTP development without allowing it in production", async () => {
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
  const { publicEnv } = await import("@/lib/env");
  expect(publicEnv.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000");
});

it.each([
  "//attacker.invalid",
  "https://attacker.invalid",
  "/\\attacker.invalid",
  "/login?next=//attacker.invalid",
])(
  "rejects request-controlled redirect destinations even through an untyped caller: %s",
  (destination) => {
    expect(() =>
      appUrl("https://fitness.qworky.tech", destination as Parameters<typeof appUrl>[1]),
    ).toThrow();
  },
);
