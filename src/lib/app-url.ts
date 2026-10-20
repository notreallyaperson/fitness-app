import { z } from "zod";

// NEXT_PUBLIC_APP_URL is trusted deployment configuration, never request input.
export const publicAppOrigin = z
  .string()
  // Validate the raw shape before Zod's URL check normalizes whitespace/paths.
  .refine(
    (value) => /^https?:\/\/[^/?#\\\s]+\/?$/iu.test(value),
    "NEXT_PUBLIC_APP_URL must contain only an origin",
  )
  .url()
  .refine((value) => {
    try {
      const url = new URL(value);
      const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
      const localDevelopment = process.env.NODE_ENV !== "production" && loopback;
      return (
        value === value.trim() &&
        !/[\\\s]/u.test(value) &&
        !url.username &&
        !url.password &&
        url.pathname === "/" &&
        !url.search &&
        !url.hash &&
        !["0.0.0.0", "[::]"].includes(url.hostname) &&
        (url.protocol === "https:" || (url.protocol === "http:" && localDevelopment)) &&
        (!loopback || localDevelopment)
      );
    } catch {
      return false;
    }
  }, "NEXT_PUBLIC_APP_URL must be an HTTPS origin without credentials, path, query or fragment (local HTTP is development-only).")
  .transform((value) => new URL(value).origin);

type AppDestination = "/" | "/login" | "/auth/callback";

export function appUrl(origin: string, destination: AppDestination): URL {
  // Keep this safe if a future untyped caller passes request-controlled input.
  if (!["/", "/login", "/auth/callback"].includes(destination)) {
    throw new Error("Unsupported app redirect destination");
  }
  return new URL(destination, publicAppOrigin.parse(origin));
}
