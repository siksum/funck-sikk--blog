const CACHE_NAME = 'funcsikk-v1';
const STATIC_CACHE = 'funcsikk-static-v1';
const DYNAMIC_CACHE = 'funcsikk-dynamic-v1';

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/blog',
  '/offline',
  '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, then cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip API requests and analytics
  if (url.pathname.startsWith('/api/')) return;

  // Skip admin pages
  if (url.pathname.startsWith('/admin')) return;

  // For navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache the response
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, clone);
          });
          return response;
        })
        .catch(() => {
          // Try cache first, then offline page
          return caches.match(request).then((cached) => {
            return cached || caches.match('/offline');
          });
        })
    );
    return;
  }

  // For other requests (assets) - cache first, then network
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        // Return cached and update in background
        fetch(request).then((response) => {
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, response);
          });
        });
        return cached;
      }

      // Not in cache, fetch from network
      return fetch(request).then((response) => {
        // Cache successful responses
        if (response.ok) {
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, clone);
          });
        }
        return response;
      });
    })
  );
});

// Push notification handling
self.addEventListener('push', function(event) {
  const data = event.data?.json() || {};

  const options = {
    body: data.body || '',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: { url: data.url },
    actions: [
      { action: 'open', title: '읽기' },
      { action: 'close', title: '닫기' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || '새 알림', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    const url = event.notification.data?.url || '/';
    event.waitUntil(clients.openWindow(url));
  }
});
