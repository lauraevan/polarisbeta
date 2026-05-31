/* Polaris UV config — editable. Keep keys, change values freely.
 * Static deployment: no Polaris-hosted bare server. We point at a rotating
 * pool of public TompHTTP bare mirrors so WebSocket upgrades, fragment
 * routing and per-origin cookie isolation keep working without us running
 * any infrastructure. */
/* Polaris UV config — editable. Stock UV expects `bare` to be a single
 * string. Pick the host you want; we default to TompHTTP's public mirror. */
self.__uv$config = {
  prefix: "/uv/service/",
  bare: "https://tomp.app/bare/",
  encodeUrl: encodeURIComponent,
  decodeUrl: decodeURIComponent,
  handler: "/uv/uv.handler.js",
  bundle: "/uv/uv.bundle.js",
  config: "/uv/uv.config.js",
  sw: "/uv/uv.sw.js",
};