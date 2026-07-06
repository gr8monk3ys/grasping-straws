/*
 * Grasping Straws? — offline support.
 * Astro fingerprints bundled assets (/_astro/*.hash.*), so there is no
 * precache manifest to keep in sync: stable URLs are precached below,
 * everything else is cached as it streams through. Hashed assets never go
 * stale (a new build means new URLs); HTML and cards.json are network-first
 * so deck edits propagate promptly.
 */
const CACHE = "grasping-straws-v1";
const STABLE = ["/", "/about/", "/cards.json", "/favicon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(STABLE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== location.origin) return;

  const networkFirst = request.mode === "navigate" || url.pathname === "/cards.json";

  if (networkFirst) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return res;
        })
        .catch(() =>
          caches
            .match(request, { ignoreSearch: true })
            .then((hit) => hit || caches.match("/"))
            .then((hit) => hit || Response.error())
        )
    );
  } else {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((cache) => cache.put(request, copy));
            }
            return res;
          })
      )
    );
  }
});
