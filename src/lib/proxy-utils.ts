export type ProxyEngine = "uv" | "scramjet";

// Pool of public wisp relays. We probe them and pick the first one that
// opens cleanly. Order matters — fastest/most-reliable first. If a relay
// 404s or refuses upgrades, drop it from the front of this list.
const WISP_POOL = [
  "wss://wisp.mercurywork.shop/",
  "wss://anura.pro/wisp/",
  "wss://nebulaproxy.io/wisp/",
  "wss://wisp.terbiumon.top/wisp/",
  "wss://wisp.shadowproxy.workers.dev/",
  "wss://wisp.lunaproxy.org/",
] as const;
export let POLARIS_WISP_URL: string = WISP_POOL[0];
// Serve bare-mux + epoxy from our own origin so the SW and page agree on the
// same SharedWorker channel and we don't depend on third-party CDN uptime.
const BAREMUX_BUNDLE = "/baremux/index.js";
const BAREMUX_WORKER = "/baremux/worker.js";
const EPOXY_TRANSPORT = "/epoxy/index.mjs";

declare global {
  interface Window {
    $scramjetLoadController?: () => {
      ScramjetController: new (config?: Record<string, unknown>) => {
        init: () => Promise<void>;
        encodeUrl?: (url: URL | string) => string;
        modifyConfig?: (config: Record<string, unknown>) => Promise<void>;
      };
    };
    __polarisScramjetReady?: Promise<void>;
    __polarisWispReady?: Promise<void>;
    BareMux?: {
      BareMuxConnection: new (workerPath?: string) => {
        setTransport: (path: string, options: unknown[]) => Promise<void>;
      };
    };
  }
}

export function normalizeUrl(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return "https://www.google.com";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.includes(".") && !trimmed.includes(" ")) return `https://${trimmed}`;
  return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
}

export function getProxyUrl(engine: ProxyEngine, input: string) {
  const url = normalizeUrl(input);
  if (engine === "scramjet") return `/scramjet/go/${encodeURIComponent(url)}`;
  return `/uv/service/${encodeURIComponent(url)}`;
}

export function getPolarisBrowserUrl(engine: ProxyEngine, input: string) {
  return `/browser?engine=${engine}&url=${encodeURIComponent(normalizeUrl(input))}`;
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Could not load ${src}`));
    document.head.appendChild(script);
  });
}

function probeWisp(url: string, timeoutMs = 2500) {
  return new Promise<boolean>((resolve) => {
    let done = false;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      try { ws.close(); } catch {}
      resolve(ok);
    };
    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch {
      return resolve(false);
    }
    const t = setTimeout(() => finish(false), timeoutMs);
    ws.addEventListener("open", () => { clearTimeout(t); finish(true); });
    ws.addEventListener("error", () => { clearTimeout(t); finish(false); });
  });
}

async function pickWisp(): Promise<string> {
  // Probe all relays in parallel; first to resolve `true` wins.
  // Falling back to a dead relay (the old behavior) silently broke every
  // proxied request with no surfaced error.
  const results = await Promise.all(
    WISP_POOL.map(async (url) => ({ url, ok: await probeWisp(url, 3500) })),
  );
  const winner = results.find((r) => r.ok);
  if (winner) return winner.url;
  console.warn("[polaris] no wisp relay reachable; defaulting to first entry — proxy will likely fail");
  return WISP_POOL[0];
}

// Configure bare-mux to use the Epoxy transport over the Polaris wisp.
// Without this, Scramjet (and any other bare-mux consumer) has no wisp and every
// proxied request fails. Idempotent — first call sets it up, later calls await the same promise.
async function ensureWispTransport() {
  if (typeof window === "undefined") return;
  if (window.__polarisWispReady) return window.__polarisWispReady;
  window.__polarisWispReady = (async () => {
    await loadScript(BAREMUX_BUNDLE);
    if (!window.BareMux) throw new Error("bare-mux failed to load");
    POLARIS_WISP_URL = await pickWisp();
    const connection = new window.BareMux.BareMuxConnection(BAREMUX_WORKER);
    await connection.setTransport(EPOXY_TRANSPORT, [{ wisp: POLARIS_WISP_URL }]);
    console.info("[polaris] wisp transport ready via", POLARIS_WISP_URL);
  })().catch((err) => {
    console.warn("[polaris] wisp transport setup failed", err);
    // allow retry on next call
    window.__polarisWispReady = undefined;
  });
  return window.__polarisWispReady;
}

export async function registerStaticProxies(engine: ProxyEngine = "uv") {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  const waitForActive = async (registration: ServiceWorkerRegistration) => {
    if (registration.active) return;
    const worker = registration.installing || registration.waiting;
    if (!worker) return;
    await new Promise<void>((resolve) => {
      worker.addEventListener("statechange", () => {
        if (worker.state === "activated") resolve();
      });
    });
  };

  const setup = async () => {
    const registrations = await Promise.all(
      engine === "scramjet"
        ? [navigator.serviceWorker.register("/scramjet/sw.js", { scope: "/scramjet/" })]
        : [navigator.serviceWorker.register("/uv/sw.js", { scope: "/uv/" })],
    );
    await Promise.all(registrations.map(waitForActive));
  };
  // Service worker registration can take 3–6s on cold loads; the previous
  // 1.8s race silently dropped activation and every proxied request 404'd.
  await Promise.race([setup(), new Promise((resolve) => setTimeout(resolve, 8000))]);

  // Wire bare-mux → epoxy → wisp before any proxied request is made.
  // Probing the wisp pool can take a few seconds on first load.
  await Promise.race([ensureWispTransport(), new Promise((resolve) => setTimeout(resolve, 12000))]);

  if (engine === "scramjet" && !window.__polarisScramjetReady) {
    window.__polarisScramjetReady = loadScript("/scramjet/scramjet.all.js").then(async () => {
      const Controller = window.$scramjetLoadController?.().ScramjetController;
      if (!Controller) return;
      const controller = new Controller({
        prefix: "/scramjet/go/",
        files: {
          wasm: "/scramjet/scramjet.wasm.wasm",
          all: "/scramjet/scramjet.all.js",
          sync: "/scramjet/scramjet.sync.js",
        },
        flags: {
          serviceworkers: true,
          syncxhr: true,
          strictRewrites: true,
          captureErrors: true,
          allowFailedIntercepts: true,
        },
      });
      await controller.init();
      await controller.modifyConfig?.({ prefix: "/scramjet/go/" });
    });
  }

  if (engine === "scramjet" && window.__polarisScramjetReady) {
    await Promise.race([window.__polarisScramjetReady, new Promise((resolve) => setTimeout(resolve, 1800))]);
  }
}