// Service worker.
// Strategy:
//   - navigation HTML  -> network-first (deploys/data land on next nav; cache
//                         fallback only for offline)
//   - static assets    -> cache-first (hashed /_next/static, images, fonts,
//                         manifest — all immutable or safe to cache)
//   - everything else  -> NOT intercepted (let the network handle it)
// Critically we never touch API, /_next/data, or RSC requests (the App Router's
// post-mutation data refetch + route prefetches), so a cached payload can never
// shadow fresh data after adding/saving something. Bump CACHE when editing this.
const CACHE = "exercise-tracker-v2";
const APP_SHELL = ["/", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      ),
  );
  self.clients.claim();
});

function isStaticAsset(pathname) {
  return (
    pathname.startsWith("/_next/static/") ||
    pathname === "/manifest.webmanifest" ||
    /\.(?:png|jpe?g|gif|svg|webp|ico|woff2?|css)$/.test(pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Leave dynamic / app-server traffic entirely to the network: cross-origin,
  // API routes, Next data, and RSC requests (router refetch after a server
  // action, and route prefetches). Serving these from cache shows stale data.
  if (
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/data/") ||
    url.searchParams.has("_rsc") ||
    req.headers.get("RSC") === "1"
  ) {
    return;
  }

  // Navigation requests (HTML): network-first, cache fallback for offline.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((m) => m ?? caches.match("/"))),
    );
    return;
  }

  // Immutable static assets: cache-first with network fill.
  if (isStaticAsset(url.pathname)) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ??
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
            return res;
          }),
      ),
    );
    return;
  }

  // Anything else: do not intercept.
});
