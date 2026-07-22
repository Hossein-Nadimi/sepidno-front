/**
 * Sepidno Service Worker
 *
 * Handles:
 *  - Precaching of static assets (app shell)
 *  - Runtime caching for images (CacheFirst strategy)
 *  - Runtime caching for API requests (NetworkFirst strategy)
 *  - Offline fallback for navigation requests
 *  - Automatic cleanup of old caches on version bump
 *  - skipWaiting + clientsClaim for immediate activation on new deploy
 */

const CACHE_VERSION = "sepidno-v2";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;
const API_CACHE = `${CACHE_VERSION}-api`;
const OFFLINE_URL = "/offline";

// Assets to precache (app shell)
const PRECACHE_URLS = [
  "/",
  "/dashboard",
  "/login",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
];

// Install: precache app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        // Don't fail install if some precache URLs are unavailable
        console.warn("[SW] Precache partial failure:", err);
      });
    })
  );
  // Activate immediately (don't wait for all tabs to close)
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !name.startsWith(CACHE_VERSION))
          .map((name) => caches.delete(name))
      );
    })
  );
  // Take control of all clients immediately
  self.clients.claim();
});

// Helper: determine cache strategy based on request
function getCacheStrategy(request) {
  const url = new URL(request.url);

  // Same-origin images → CacheFirst
  if (url.origin === self.location.origin && request.destination === "image") {
    return "cache-first";
  }

  // Uploaded images (proxied through /uploads/) → CacheFirst with network fallback
  if (url.pathname.startsWith("/uploads/")) {
    return "cache-first";
  }

  // API requests → NetworkFirst (always try fresh data, fall back to cache)
  if (url.pathname.startsWith("/api/") || url.origin !== self.location.origin) {
    return "network-first";
  }

  // Navigation requests (pages) → NetworkFirst with offline fallback
  if (request.mode === "navigate") {
    return "navigation";
  }

  // Static assets (JS, CSS, fonts) → StaleWhileRevalidate
  return "stale-while-revalidate";
}

// Fetch handler
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip chrome-extension requests
  const url = new URL(request.url);
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  const strategy = getCacheStrategy(request);

  if (strategy === "cache-first") {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
  } else if (strategy === "network-first") {
    event.respondWith(networkFirst(request, API_CACHE));
  } else if (strategy === "navigation") {
    event.respondWith(navigationHandler(request));
  } else {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
  }
});

// CacheFirst: try cache, then network
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return new Response("Offline", { status: 503, statusText: "Offline" });
  }
}

// NetworkFirst: try network, fall back to cache
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response("Offline", { status: 503, statusText: "Offline" });
  }
}

// StaleWhileRevalidate: return cache immediately, fetch fresh in background
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => cached);
  return cached || fetchPromise;
}

// Navigation: NetworkFirst with offline page fallback
async function navigationHandler(request) {
  const cache = await caches.open(STATIC_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    // Try cached homepage as last resort
    const homeCached = await cache.match("/");
    if (homeCached) return homeCached;
    return new Response(
      "<html><body><h1>آفلاین</h1><p>اتصال اینترنت برقرار نیست.</p></body></html>",
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}

// Listen for messages from the page (e.g., SKIP_WAITING)
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
