const CACHE_NAME = 'toto-offline-v1';
const ASSETS = [
  '/',
  '/index.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request).then(fetchRes => {
      const clone = fetchRes.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      return fetchRes;
    }).catch(() => caches.match('/index.html')))
  );
});
