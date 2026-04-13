const CACHE_NAME = "qr-platinum-v5";

// ❗ len EXISTUJÚCE súbory
const urlsToCache = [
  "./",
  "index.html",
  "dashboard.html",
  "companies.html",
  "generator.html",
  "license.html",
  "admin.html",
  "reset-password.html",
  "style.css",
  "app.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // bezpečné cachovanie (nespadne na 404)
      for (const url of urlsToCache) {
        try {
          await cache.add(url);
        } catch (err) {
          console.warn("SW cache skip:", url);
        }
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch(() => response);
    })
  );
});
