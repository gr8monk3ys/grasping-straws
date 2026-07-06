/* Grasping Straws? — offline support. Bump VERSION when assets change. */
const VERSION = "gs-v1";
const ASSETS = [
  "./",
  "index.html",
  "about.html",
  "styles.css",
  "app.js",
  "config.js",
  "cards.json",
  "favicon.svg",
  "fonts/EBGaramond-latin.woff2",
  "fonts/EBGaramond-Italic-latin.woff2"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || new URL(request.url).origin !== location.origin) return;

  // Deck edits and page changes should show up promptly: network first for
  // HTML and cards.json, cache first for everything else (fonts, css, js).
  const networkFirst =
    request.mode === "navigate" || new URL(request.url).pathname.endsWith("cards.json");

  if (networkFirst) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((cache) => cache.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request, { ignoreSearch: true }).then((hit) => hit || caches.match("index.html")))
    );
  } else {
    event.respondWith(
      caches.match(request).then((hit) => hit || fetch(request))
    );
  }
});
