const APP_VERSION = '20260414pro6';
const APP_CACHE = 'parqour-cache-' + APP_VERSION;
const CORE_ASSETS = [
  './',
  './index.html',
  './index.html?v=20260414pro6',
  './counter.html',
  './counter.html?v=20260414pro6',
  './report.html',
  './report.html?v=20260414pro6',
  './support2.html',
  './support2.html?v=20260414pro6',
  './autofetch.html',
  './autofetch.html?v=20260414pro6',
  './style.css',
  './style.css?v=20260414pro6',
  './i18n.js',
  './numeric.js',
  './pwa-update.js?v=20260414pro6',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
  './manifest.webmanifest',
  './parqour.png',
  './splash-2048x2732.png',
  './ring_home_v3.png',
  './document_home_v6.png'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(APP_CACHE).then(cache => cache.addAll(CORE_ASSETS)).catch(() => null));
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => k !== APP_CACHE ? caches.delete(k) : Promise.resolve()));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  e.respondWith((async () => {
    const cache = await caches.open(APP_CACHE);
    try {
      const response = await fetch(e.request, { cache: 'no-store' });
      if (response && response.ok) cache.put(e.request, response.clone());
      return response;
    } catch (_) {
      const cached = await cache.match(e.request, { ignoreSearch: false }) || await cache.match(url.pathname, { ignoreSearch: true });
      if (cached) return cached;
      if (e.request.mode === 'navigate') return (await cache.match('./index.html?v=20260414pro6')) || (await cache.match('./index.html')) || Response.error();
      return Response.error();
    }
  })());
});
