/* NARCO EMPIRE — Service Worker v1.3.3 */
const CACHE = 'narco-empire-v1.3.3';
const PRECACHE = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE.map(u => new Request(u, {cache: 'reload'})))).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  /* Jangan cache Firebase / Google APIs */
  if(url.includes('googleapis.com') || url.includes('firebase') || url.includes('raw.githubusercontent.com')){
    e.respondWith(fetch(e.request).catch(() => new Response('',{status:503})));
    return;
  }
  /* Cache-first untuk asset game */
  e.respondWith(
    caches.match(e.request).then(cached => {
      if(cached) return cached;
      return fetch(e.request).then(res => {
        if(e.request.method === 'GET' && res.status === 200){
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
