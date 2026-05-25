const ='1.1.0';
const CACHE_NAME = `quran-app-v${APP_VERSION}`;
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './changelog.json',
  './quran/surah_metadata.json',
  './icons/favicon.svg',
  './icons/favicon.ico',
  './icons/apple-touch-icon.png',
  './icons/favicon-96x96.png',
  './icons/web-app-manifest-192x192.png',
  './icons/web-app-manifest-512x512.png'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching shell assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Clearing old cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Strategy: Cache First, then network & update cache
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        // Return from cache, but also fetch in background to update cache for next time
        if (url.origin === self.location.origin) {
          fetch(event.request).then((newResponse) => {
            if (newResponse && newResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, newResponse);
              });
            }
          }).catch(() => {
            // Silently fail network update if offline
          });
        }
        return response;
      }

      // If not in cache, fetch from network and cache it
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      });
    })
  );
});
