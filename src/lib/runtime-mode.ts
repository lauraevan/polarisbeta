// "Runtime mode" — controls whether features like Shop are visible.
// `web` (default): everything visible.
// `desktop`: hides Shop (it lives only on the web build).
//
// Detection priority:
//  1. URL query ?mode=desktop persists into localStorage
//  2. window.__POLARIS_MODE__ injected by the desktop bundle entry
//  3. localStorage value
//  4. default "web"

export type RuntimeMode = "web" | "desktop";
const KEY = "polaris-runtime-mode";

export function getRuntimeMode(): RuntimeMode {
  if (typeof window === "undefined") return "web";
  try {
    const q = new URLSearchParams(window.location.search).get("mode");
    if (q === "desktop" || q === "web") {
      localStorage.setItem(KEY, q);
      return q;
    }
    const injected = (window as unknown as { __POLARIS_MODE__?: RuntimeMode }).__POLARIS_MODE__;
    if (injected === "desktop" || injected === "web") return injected;
    const stored = localStorage.getItem(KEY);
    if (stored === "desktop" || stored === "web") return stored;
  } catch {
    /* noop */
  }
  return "web";
}

export function isDesktopMode(): boolean {
  return getRuntimeMode() === "desktop";
}