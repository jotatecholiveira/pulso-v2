const CACHE_NAME = 'pulso-v8';
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
  const url = event.request.url;
  // Nunca cachear respostas do Firebase / RTDB / CDNs (dados sensíveis e dinâmicos)
  if (url.includes('firebase') ||
      url.includes('gstatic') ||
      url.includes('googleapis') ||
      url.includes('fontawesome') ||
      url.includes('cdnjs')) {
    return;
  }

  // Navegações (HTML): network-first para sempre entregar a versão mais recente
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    fetch(event.request).then((response) => {
      if (url.endsWith('.js') || url.endsWith('.css')) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
      }
      return response;
    }).catch(() => {
      return caches.match(event.request);
    })
  );
});
