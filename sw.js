const CACHE_NAME = 'roca-norte-v5';
const urlsToCache = [
  './',
  './index.html',
  './admin.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://firebasestorage.googleapis.com/v0/b/wiki-honorio.firebasestorage.app/o/LogoCabecera.png?alt=media&token=fcfd1dbc-953d-4812-b2f9-42b464d51b53'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
  // Fuerza al Service Worker a activarse inmediatamente
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName); // Borra la versión v1 antigua
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Solo interceptamos peticiones normales (GET)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 1. Si ya lo tenemos en la mochila, lo devolvemos offline
        if (response) {
          return response;
        }

        // 2. Si no lo tenemos, vamos a buscarlo a internet
        return fetch(event.request).then(networkResponse => {
          // Si algo falla en la red, devolvemos lo que haya
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
            return networkResponse;
          }

          // 3. ¡El truco! Guardamos una copia exacta "al vuelo" para la próxima vez
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return networkResponse;
        });
      })
  );
});
