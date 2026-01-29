const APP_CACHE = 'parqour-cache-v2';

const CORE_ASSETS = [
  './',
  './index.html',
  './report.html',
  './counter.html',
  './style.css?v=2',
  './style.css',
  './i18n.js',
  './numeric.js',
  './parqour.png',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
  './splash-2048x2732.png',
  './manifest.webmanifest'
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
    await Promise.all(keys.map(k => (k !== APP_CACHE) ? caches.delete(k) : null));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);
  const isSameOrigin = url.origin === self.location.origin;

  // For navigations, prefer cached shell if offline
  if (e.request.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        return await fetch(e.request);
      } catch (err) {
        const cached = await caches.match('./index.html');
        return cached || Response.error();
      }
    })());
    return;
  }

  if (!isSameOrigin) return;

  e.respondWith((async () => {
    const cached = await caches.match(e.request);
    if (cached) return cached;

    try {
      const response = await fetch(e.request);
      if (response && response.ok) {
        const clone = response.clone();
        caches.open(APP_CACHE).then(cache => cache.put(e.request, clone));
      }
      return response;
    } catch (err) {
      const fallback = await caches.match('./index.html');
      return fallback || Response.error();
    }
  })());
});
