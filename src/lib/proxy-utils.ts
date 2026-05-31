export type ProxyEngine = "uv" | "scramjet";

// Wisp endpoint (public Mercury Workshop relay). All proxy transports tunnel through this.
export const POLARIS_WISP_URL = "wss://wisp.mercurywork.shop/";
const BAREMUX_BUNDLE = "https://unpkg.com/@mercuryworkshop/bare-mux@2/dist/index.js";
const BAREMUX_WORKER = "https://unpkg.com/@mercuryworkshop/bare-mux@2/dist/worker.js";
const EPOXY_TRANSPORT = "https://unpkg.com/@mercuryworkshop/epoxy-transport/dist/index.mjs";

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

// Configure bare-mux to use the Epoxy transport over the Polaris wisp.
// Without this, Scramjet (and any other bare-mux consumer) has no wisp and every
// proxied request fails. Idempotent — first call sets it up, later calls await the same promise.
async function ensureWispTransport() {
  if (typeof window === "undefined") return;
  if (window.__polarisWispReady) return window.__polarisWispReady;
  window.__polarisWispReady = (async () => {
    await loadScript(BAREMUX_BUNDLE);
    if (!window.BareMux) throw new Error("bare-mux failed to load");
    const connection = new window.BareMux.BareMuxConnection(BAREMUX_WORKER);
    await connection.setTransport(EPOXY_TRANSPORT, [{ wisp: POLARIS_WISP_URL }]);
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
  await Promise.race([setup(), new Promise((resolve) => setTimeout(resolve, 1800))]);

  // Wire bare-mux → epoxy → wisp before any proxied request is made.
  await Promise.race([ensureWispTransport(), new Promise((resolve) => setTimeout(resolve, 2500))]);

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