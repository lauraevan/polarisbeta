importScripts('/scramjet/scramjet.all.js');
const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker();
self.addEventListener('install', (event) => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', async (event) => {
  await scramjet.loadConfig();
  if (scramjet.route(event)) event.respondWith(scramjet.fetch(event));
});
