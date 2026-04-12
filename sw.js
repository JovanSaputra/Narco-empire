/* ═══════════════════════════════════════════════════
   NARCO EMPIRE — Service Worker v1.2.0
   Caches game assets for full offline play
═══════════════════════════════════════════════════ */

const CACHE_NAME  = 'narco-empire-v1.2.0';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

/* ── INSTALL: cache semua asset ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

/* ── ACTIVATE: hapus cache lama ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

/* ── FETCH: cache-first untuk asset game, network-first untuk Firebase ── */
self.addEventListener('fetch', event => {
  const url = event.request.url;

  /* Firebase Firestore — selalu network, jangan di-cache */
  if (url.includes('firestore.googleapis.com') ||
      url.includes('firebase') ||
      url.includes('googleapis.com')) {
    event.respondWith(fetch(event.request).catch(() => new Response('', { status: 503 })));
    return;
  }

  /* Semua asset lain — cache first, fallback ke network */
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request)
        .then(response => {
          /* Cache response baru untuk GET request valid */
          if (event.request.method === 'GET' && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          /* Offline fallback: kembalikan index.html */
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }
          return new Response('', { status: 503 });
        });
    })
  );
});

/* ── MESSAGE: force update dari halaman ── */
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});
