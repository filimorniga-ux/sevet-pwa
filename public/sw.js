/**
 * SEVET Service Worker
 * Offline caching + push notification support
 */
const CACHE_NAME = 'sevet-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/manifest.json',
  '/assets/images/logo.png',
  '/pages/agendar.html',
  '/pages/auth.html',
  '/pages/quienes-somos.html',
  '/pages/mi-mascota.html',
];

// Install
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first, fallback to cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Only cache successful, same-origin GET responses with http/https scheme
        if (
          event.request.method === 'GET' &&
          response.status === 200 &&
          event.request.url.startsWith(self.location.origin) &&
          event.request.url.startsWith('http')
        ) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone).catch(e => {
              // Ignore errors for unsupported schemes or other caching issues
              // console.debug('Cache put ignored:', e.message);
            });
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Push notifications
self.addEventListener('push', (event) => {
  let data = { title: 'SEVET', body: 'Tienes una nueva notificación' };
  
  if (event.data) {
    try { data = event.data.json(); } catch (e) { data.body = event.data.text(); }
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'SEVET', {
      body: data.body,
      icon: '/assets/images/logo.png',
      badge: '/assets/images/logo.png',
      tag: data.tag || 'sevet-notification',
      data: { url: data.url || '/' },
      actions: data.actions || [
        { action: 'open', title: 'Ver' },
        { action: 'dismiss', title: 'Cerrar' }
      ]
    })
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && 'focus' in client) return client.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
