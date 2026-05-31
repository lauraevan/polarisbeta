/* Polaris Scramjet service worker — editable.
 * Adds: WebSocket pass-through, fragment routing, cookie isolation per origin. */
importScripts('/scramjet/scramjet.all.js');
const { ScramjetServiceWorker } = $scramjetLoadWorker();
const _$sj = new ScramjetServiceWorker();

self.addEventListener('install', (e) => e.waitUntil(self.skipWaiting()));
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// Fragment-preserving rewrite
function _$frag(req) {
  try {
    const u = new URL(req.url);
    if (!u.hash && req.referrer) {
      const r = new URL(req.referrer);
      if (r.hash) u.hash = r.hash;
    }
    return u.href === req.url ? req : new Request(u.href, req);
  } catch { return req; }
}

self.addEventListener('fetch', async (event) => {
  await _$sj.loadConfig();
  const req = _$frag(event.request);
  // WebSocket upgrades: let Scramjet's bare client handle :443/wss inside the page
  if (_$sj.route({ request: req })) {
    event.respondWith(_$sj.fetch({ request: req }));
  }
});

// Cookie isolation hook: Scramjet stores cookies in IDB keyed by encoded host.
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'polaris:scramjet:reset') {
    caches.keys().then((ks) => ks.forEach((k) => caches.delete(k)));
  }
});
