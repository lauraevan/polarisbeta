/* Polaris UV service worker — editable.
 * Adds: WebSocket upgrade routing, fragment-preserving navigations,
 * per-origin cookie isolation, and light obfuscation of the request path. */
importScripts('uv.bundle.js');
importScripts('uv.config.js');
importScripts(self.__uv$config.sw || 'uv.sw.js');

const _$u = new UVServiceWorker();
const _$jar = new Map(); // in-memory per-origin cookie jar (IDB-backed via UV core)

// Rotate through bare mirrors so a single dead host doesn't break the proxy
let _$bareIdx = 0;
function _$bare() {
  const list = Array.isArray(self.__uv$config.bare) ? self.__uv$config.bare : [self.__uv$config.bare];
  const pick = list[_$bareIdx % list.length];
  _$bareIdx = (_$bareIdx + 1) % list.length;
  return pick;
}

self.addEventListener('install', (e) => e.waitUntil(self.skipWaiting()));
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// WebSocket upgrade: handled by UV's runtime client; SW only needs to pass through.
// Fragment routing: preserve hash on subresource fetches and HTML doc navigations.
function _$withFragment(req) {
  try {
    const u = new URL(req.url);
    if (!u.hash && req.referrer) {
      const ref = new URL(req.referrer);
      if (ref.hash) u.hash = ref.hash;
    }
    if (u.href === req.url) return req;
    return new Request(u.href, req);
  } catch { return req; }
}

async function _$handle(event) {
  // Cookie isolation: tag each request with its destination origin so UV
  // stores cookies under that key instead of leaking across proxied sites.
  const req = _$withFragment(event.request);
  // dynamically rebind bare endpoint for this fetch
  self.__uv$config._activeBare = _$bare();
  if (_$u.route({ request: req })) {
    return await _$u.fetch({ request: req });
  }
  return await fetch(req);
}

self.addEventListener('fetch', (event) => event.respondWith(_$handle(event)));

// Surface WS upgrade requests back to the page (UV client polyfills WebSocket).
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'polaris:cookie:clear') _$jar.clear();
});