const APP_VERSION = '20260327b';
const APP_CACHE = `parqour-cache-${APP_VERSION}`;
const CORE_ASSETS = [
  './',
  `./index.html?v=${APP_VERSION}`,
  './index.html',
  `./report.html?v=${APP_VERSION}`,
  './report.html',
  `./counter.html?v=${APP_VERSION}`,
  './counter.html',
  `./support2.html?v=${APP_VERSION}`,
  './support2.html',
  `./autofetch.html?v=${APP_VERSION}`,
  './autofetch.html',
  `./style.css?v=${APP_VERSION}`,
  './style.css',
  `./i18n.js?v=${APP_VERSION}`,
  './i18n.js',
  `./numeric.js?v=${APP_VERSION}`,
  './numeric.js',
  `./manifest.webmanifest?v=${APP_VERSION}`,
  './manifest.webmanifest',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
  './parqour.png',
  './splash-2048x2732.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(APP_CACHE).then(cache => cache.addAll(CORE_ASSETS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== APP_CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

async function networkFirst(request) {
  const cache = await caches.open(APP_CACHE);
  try {
    const fresh = await fetch(request, { cache: 'no-store' });
    if (fresh && fresh.ok) cache.put(request, fresh.clone());
    return fresh;
  } catch (error) {
    const cached = await cache.match(request, { ignoreSearch: false });
    if (cached) return cached;
    const fallback = await cache.match('./index.html') || await cache.match(`./index.html?v=${APP_VERSION}`);
    if (request.mode === 'navigate' && fallback) return fallback;
    throw error;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(APP_CACHE);
  const cached = await cache.match(request, { ignoreSearch: false });
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) cache.put(request, response.clone());
  return response;
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  const destination = event.request.destination;
  const isDocument = event.request.mode === 'navigate' || destination === 'document';
  const isDynamic = isDocument || ['script', 'style', 'manifest'].includes(destination);

  event.respondWith(isDynamic ? networkFirst(event.request) : cacheFirst(event.request));
});
