const CACHE_NAME = "qr-platinum-v10";

const APP_SHELL = [
  "./",
  "index.html",
  "dashboard.html",
  "companies.html",
  "generator.html",
  "license.html",
  "admin.html",
  "reset-password.html",
  "style.css",
  "app.js",
  "manifest.json",
  "icon-192.svg",
  "icon-512.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      for (const url of APP_SHELL) {
        try {
          await cache.add(url);
        } catch (err) {
          console.warn("SW cache skip:", url, err);
        }
      }
    })()
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET") return;

  // API nikdy necacheuj
  if (
    url.pathname.startsWith("/api/") ||
    url.hostname.includes("workers.dev")
  ) {
    event.respondWith(fetch(request));
    return;
  }

  const pathname = url.pathname;

  const isHtml =
    request.mode === "navigate" ||
    pathname.endsWith(".html") ||
    pathname === "/" ||
    pathname.endsWith("/");

  const isCriticalAsset =
    pathname.endsWith("/app.js") ||
    pathname.endsWith("app.js") ||
    pathname.endsWith("/style.css") ||
    pathname.endsWith("style.css") ||
    pathname.endsWith("/manifest.json") ||
    pathname.endsWith("manifest.json");

  if (isHtml || isCriticalAsset) {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(cacheFirst(request));
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok) {
      cache.put(request, fresh.clone());
    }
    return fresh;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;

    if (request.mode === "navigate") {
      const fallback = await caches.match("index.html");
      if (fallback) return fallback;
    }

    throw err;
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const fresh = await fetch(request);
  const cache = await caches.open(CACHE_NAME);

  if (fresh && fresh.ok) {
    cache.put(request, fresh.clone());
  }

  return fresh;
}
