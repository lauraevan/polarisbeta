export type ProxyEngine = "uv" | "scramjet";

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

export async function registerStaticProxies() {
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
    const registrations = await Promise.all([
      navigator.serviceWorker.register("/uv/sw.js", { scope: "/uv/" }),
      navigator.serviceWorker.register("/scramjet/sw.js", { scope: "/scramjet/" }),
    ]);
    await Promise.all(registrations.map(waitForActive));
  };
  await Promise.race([setup(), new Promise((resolve) => setTimeout(resolve, 1800))]);

  if (!window.__polarisScramjetReady) {
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

  await Promise.race([window.__polarisScramjetReady, new Promise((resolve) => setTimeout(resolve, 1800))]);
}