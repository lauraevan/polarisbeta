/* Polaris UV config — editable. Keep keys, change values freely.
 * Static deployment: no Polaris-hosted bare server. We point at a rotating
 * pool of public TompHTTP bare mirrors so WebSocket upgrades, fragment
 * routing and per-origin cookie isolation keep working without us running
 * any infrastructure. */
(function (g) {
  var _p = ["/uv/svc/", "/uv/service/"]; // primary + legacy alias
  var _b = [
    "https://tomp.app/bare/",
    "https://bare.titaniumnetwork.org/",
    "https://uv.holyubofficial.net/bare/",
  ];
  // Obfuscated XOR helper kept editable: change KEY to rotate.
  var KEY = 0x5a;
  function _x(s){var o="";for(var i=0;i<s.length;i++)o+=String.fromCharCode(s.charCodeAt(i)^KEY);return o;}
  g.__uv$config = {
    prefix: _p[0],
    bare: _b,
    encodeUrl: function (str) {
      // fragment-safe + XOR-light obfuscation so URLs aren't trivially readable
      try { return encodeURIComponent(_x(String(str))); } catch (e) { return encodeURIComponent(str); }
    },
    decodeUrl: function (str) {
      try { return _x(decodeURIComponent(String(str))); } catch (e) { return decodeURIComponent(str); }
    },
    handler: "/uv/uv.handler.js",
    bundle: "/uv/uv.bundle.js",
    client: "/uv/uv.client.js",
    config: "/uv/uv.config.js",
    sw: "/uv/uv.sw.js",
    // Cookie isolation: scope per encoded origin so sites can't read each other's jar
    cookie: { isolate: true, scope: "polaris-uv" },
    // Fragment routing: persist #hash across navigations
    fragment: true,
    // WebSocket upgrades through bare
    ws: true,
    inject: [],
  };
})(self);