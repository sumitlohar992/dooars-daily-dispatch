const CACHE_PREFIX = "dooars-khabar";
const APP_CACHE = `${CACHE_PREFIX}-app-v1`;
const DATA_CACHE = `${CACHE_PREFIX}-data-v1`;
const ASSET_CACHE = `${CACHE_PREFIX}-assets-v1`;

const APP_SHELL = ["/", "/offline.html", "/manifest.webmanifest", "/favicon.png", "/logo.png", "/icon-192.png", "/icon-512.png", "/apple-touch-icon.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_CACHE).then(async (cache) => {
      await Promise.all(
        APP_SHELL.map((url) => cache.add(url).catch(() => undefined)),
      );
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && ![APP_CACHE, DATA_CACHE, ASSET_CACHE].includes(key))
            .map((key) => caches.delete(key)),
        ),
      ),
      self.clients.claim(),
    ]),
  );
});

function cacheRequest(cacheName, request, response) {
  if (response && (response.ok || response.type === "opaque")) {
    const copy = response.clone();
    caches.open(cacheName).then((cache) => cache.put(request, copy));
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => cacheRequest(APP_CACHE, request, response))
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;

          const home = await caches.match("/");
          if (home) return home;

          return (await caches.match("/offline.html")) || new Response("Offline", {
            status: 503,
            headers: { "Content-Type": "text/plain" },
          });
        }),
    );
    return;
  }

  const isSupabaseRest =
    url.pathname.startsWith("/rest/v1/") ||
    url.pathname.startsWith("/storage/v1/") ||
    url.pathname.startsWith("/auth/v1/");

  if (isSupabaseRest) {
    if (url.pathname.startsWith("/auth/v1/")) return;
    event.respondWith(
      fetch(request)
        .then((response) => cacheRequest(DATA_CACHE, request, response))
        .catch(async () => (await caches.match(request)) || Response.error()),
    );
    return;
  }

  if (
    url.origin === self.location.origin &&
    (request.destination === "style" ||
      request.destination === "script" ||
      request.destination === "image" ||
      request.destination === "font")
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => cacheRequest(ASSET_CACHE, request, response)),
      ),
    );
    return;
  }

  if (request.destination === "image") {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => cacheRequest(ASSET_CACHE, request, response)),
      ),
    );
  }
});
