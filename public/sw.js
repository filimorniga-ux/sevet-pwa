const CACHE_NAME = 'sevet-v2.0.0';
const ASSETS = [
  '/',
  '/index.html',
  '/assets/images/hero-dog.png',
  '/assets/images/hero-cat.png',
  '/assets/images/logo.png',
  '/assets/images/product-dog-food.png',
  '/assets/images/product-cat-food.png',
  '/assets/images/product-supplements.png',
  '/assets/images/product-treats.png',
  '/assets/images/before-after.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);
  if (url.hostname.includes('supabase') || url.hostname.includes('openai')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;

      return fetch(e.request).then(response => {
        if (response.ok && url.pathname.match(/\.(js|css|png|jpg|webp|woff2?)$/)) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return response;
      }).catch(() => caches.match('/index.html'));
    })
  );
});
