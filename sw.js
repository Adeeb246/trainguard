// scripts/build.js swaps in a hash of the build, so every deploy installs and old caches get cleared.
const CACHE_NAME = 'trainguard-__BUILD__';
const ASSETS = ['./', './index.html', './manifest.json', './data/timetable.json', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', event => {
  // If any file fails, install fails and the previous worker and its cache stay in place.
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

// Cache first, because station networks stall rather than fail. Nothing is stored at runtime, so shared links with a PNR never land in the cache.
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== location.origin) return;
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then(hit => {
      if (hit) return hit;
      return fetch(event.request).catch(() => (event.request.mode === 'navigate' ? caches.match('./index.html') : Response.error()));
    })
  );
});
