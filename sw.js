// Funciona sin conexión con lo último que vio; los datos siempre se piden frescos.
const CACHE = 'torre-flami-v6';
const BASE = ['./', 'index.html', 'oficina.js', 'manifest.webmanifest', 'icono-192.png', 'icono-512.png'].concat(['flami', 'rocco', 'manolo', 'caiman'].flatMap((n) => ['relax', 'trabaja', 'alerta'].map((k) => `spr/${n}_${k}.png`)));
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(BASE))); self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.pathname.includes('/data/')) {
    e.respondWith(fetch(e.request).then((r) => { const copia = r.clone(); caches.open(CACHE).then((c) => c.put(e.request.url.split('?')[0], copia)); return r; }).catch(() => caches.match(e.request.url.split('?')[0])));
    return;
  }
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
