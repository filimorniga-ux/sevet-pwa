const CACHE_NAME = 'sevet-v1.0.0';
const ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/assets/images/hero-dog.png',
  '/assets/images/hero-cat.png',
  '/assets/images/premium-food.png',
  '/assets/images/logo.png',
  '/assets/images/before-after.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).catch(() => caches.match('/index.html')))
  );
});
