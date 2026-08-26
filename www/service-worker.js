const CACHE_NAME = 'pulso-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/login.html',
  '/style1.css',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('firebase') ||
      event.request.url.includes('gstatic') ||
      event.request.url.includes('googleapis') ||
      event.request.url.includes('fontawesome') ||
      event.request.url.includes('cdnjs')) {
    return;
  }

  event.respondWith(
    fetch(event.request).then((response) => {
      if (event.request.url.endsWith('.js') || event.request.url.endsWith('.css')) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
      }
      return response;
    }).catch(() => {
      return caches.match(event.request);
    })
  );
});
