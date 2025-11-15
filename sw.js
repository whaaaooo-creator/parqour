const APP_CACHE = 'parqour-cache-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './report.html',
  './counter.html',
  './style.css?v=2',
  './style.css',
  './i18n.js',
  './numeric.js',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
  './manifest.webmanifest'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(APP_CACHE).then(cache => cache.addAll(CORE_ASSETS.filter(Boolean)))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => k !== APP_CACHE && caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method === 'GET') {
    e.respondWith(
      caches.match(e.request).then(resp => {
        if (resp) return resp;
        return fetch(e.request).then(response => {
          if (response.ok && url.origin === location.origin) {
            const clone = response.clone();
            caches.open(APP_CACHE).then(cache => cache.put(e.request, clone));
          }
          return response;
        }).catch(() => caches.match('./index.html').then(r=>r||caches.match('/parqour/index.html')));
      })
    );
  }
});
