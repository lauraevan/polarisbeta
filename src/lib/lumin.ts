/**
 * Tiny client wrapper around LuminSDK (https://docs.luminsdk.com).
 * Loads the script tag once, inits into a hidden container, and exposes
 * typed helpers so we can render Lumin's catalogue inside our own grid.
 */

const SCRIPT_SRC = "https://cdn.jsdelivr.net/gh/luminsdk/script@latest/lumin.min.js";

export type LuminGame = {
  id: string;
  name: string;
  category?: string;
  image_token?: string;
};

type LuminApi = {
  init: (cfg: Record<string, unknown>) => Promise<void>;
  getGames: (opts?: { page?: number; limit?: number; q?: string }) => Promise<{ games: LuminGame[]; total: number; page: number; pages: number }>;
  getRandomGames: (count?: number) => Promise<{ games: LuminGame[] }>;
  getCategories: () => Promise<{ categories: string[] }>;
  getGameUrl: (id: string) => Promise<{ url: string; meta: LuminGame }>;
  getImageUrl: (token: string) => Promise<string>;
};

declare global {
  interface Window {
    Lumin?: LuminApi;
    __luminReady?: Promise<LuminApi>;
  }
}

function loadScript(): Promise<void> {
  if (typeof document === "undefined") return Promise.reject(new Error("SSR"));
  if (window.Lumin) return Promise.resolve();
  const existing = document.querySelector<HTMLScriptElement>(`script[data-lumin]`);
  if (existing) {
    return new Promise((res, rej) => {
      existing.addEventListener("load", () => res());
      existing.addEventListener("error", () => rej(new Error("lumin script failed")));
    });
  }
  return new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.dataset.lumin = "1";
    s.onload = () => res();
    s.onerror = () => rej(new Error("lumin script failed"));
    document.head.appendChild(s);
  });
}

export function lumin(): Promise<LuminApi> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  if (window.__luminReady) return window.__luminReady;
  window.__luminReady = (async () => {
    await loadScript();
    if (!window.Lumin) throw new Error("Lumin not present after load");
    // Hidden container — we just want the data + player APIs, not their UI.
    let host = document.getElementById("__lumin_host") as HTMLDivElement | null;
    if (!host) {
      host = document.createElement("div");
      host.id = "__lumin_host";
      host.style.cssText = "position:fixed;width:0;height:0;overflow:hidden;opacity:0;pointer-events:none;";
      document.body.appendChild(host);
    }
    await window.Lumin.init({ container: "#__lumin_host", theme: "dark", autoStart: false });
    return window.Lumin;
  })();
  return window.__luminReady;
}

/** Resolve a Lumin image_token to a blob URL we can put in <img src>. */
const imgCache = new Map<string, Promise<string>>();
export function luminImage(token: string | undefined): Promise<string | null> {
  if (!token) return Promise.resolve(null);
  let p = imgCache.get(token);
  if (!p) {
    p = lumin()
      .then((api) => api.getImageUrl(token))
      .catch(() => "");
    imgCache.set(token, p);
  }
  return p.then((u) => u || null);
}