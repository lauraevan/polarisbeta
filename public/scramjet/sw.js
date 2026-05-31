/* Polaris Scramjet service worker.
 * `respondWith` MUST be called synchronously in the fetch handler — awaiting
 * `loadConfig()` first throws "event has already been dispatched" and breaks
 * every navigation. Wrap the async work inside an IIFE passed to respondWith. */
importScripts('/scramjet/scramjet.all.js');
const { ScramjetServiceWorker } = $scramjetLoadWorker();
const sw = new ScramjetServiceWorker();

self.addEventListener('install', (e) => e.waitUntil(self.skipWaiting()));
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  event.respondWith((async () => {
    await sw.loadConfig();
    if (sw.route({ request: event.request })) {
      return sw.fetch({ request: event.request });
    }
    return fetch(event.request);
  })());
});

self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'polaris:scramjet:reset') {
    caches.keys().then((ks) => ks.forEach((k) => caches.delete(k)));
  }
});
