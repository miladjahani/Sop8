const CACHE_NAME = 'misub-cf-ultra-v3.5.0';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './data/cloudflare-ips.json',
  './data/operator-presets.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(ASSETS_TO_CACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => k !== CACHE_NAME ? caches.delete(k) : null)
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
