const APP_CACHE = 'parqour-cache-v20260408-3';
const CORE_ASSETS = [
  './',
  './index.html',
  './counter.html',
  './report.html',
  './support2.html',
  './autofetch.html',
  './style.css?v=12',
  './style.css',
  './i18n.js',
  './numeric.js',
  './pwa-update.js',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
  './manifest.webmanifest',
  './parqour.png',
  './splash-2048x2732.png'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(APP_CACHE).then(cache => cache.addAll(CORE_ASSETS.filter(Boolean)))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => k !== APP_CACHE && caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  e.respondWith((async () => {
    const cache = await caches.open(APP_CACHE);
    try {
      const response = await fetch(e.request);
      if (response && response.ok) {
        cache.put(e.request, response.clone());
      }
      return response;
    } catch (_) {
      const cached = await cache.match(e.request);
      if (cached) return cached;
      if (e.request.mode === 'navigate') {
        return (await cache.match('./index.html')) || Response.error();
      }
      return Response.error();
    }
  })());
});
