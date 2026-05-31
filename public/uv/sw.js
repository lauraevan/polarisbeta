/* Polaris UV service worker — minimal & working.
 * UV's stock SW expects a single bare server string and a synchronous
 * respondWith. WebSocket upgrades, fragment routing and cookie isolation
 * are all handled inside UV's bundled client/handler.
 */
importScripts('/uv/uv.bundle.js');
importScripts('/uv/uv.config.js');
importScripts(self.__uv$config.sw || '/uv/uv.sw.js');

const sw = new UVServiceWorker();

self.addEventListener('install', (e) => e.waitUntil(self.skipWaiting()));
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  if (sw.route(event)) event.respondWith(sw.fetch(event));
});

self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'polaris:uv:clear-cache') {
    caches.keys().then((ks) => ks.forEach((k) => caches.delete(k)));
  }
});