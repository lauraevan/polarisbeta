/**
 * Hydra Network — open HTML5 game catalogue hosted on GitHub.
 * Source: https://github.com/Hydra-Network/hydra-assets
 */
// githack serves the game HTML with `Content-Type: text/html`, which is
// required — jsdelivr sends text/plain + nosniff so the browser shows source
// code instead of running the game. jsdelivr is fine for the thumbs and for
// the JSON manifest (we use it for those).
export const HYDRA_BASES = [
  "https://rawcdn.githack.com/Hydra-Network/hydra-assets/main/",
  "https://raw.githack.com/Hydra-Network/hydra-assets/main/",
  "https://cdn.jsdelivr.net/gh/Hydra-Network/hydra-assets@main/",
];

// Thumbs are images — any mirror is fine. jsdelivr is the fastest.
export const HYDRA_THUMB_BASE =
  "https://cdn.jsdelivr.net/gh/Hydra-Network/hydra-assets@main/";

export const HYDRA_DATA_URLS = [
  "https://cdn.jsdelivr.net/gh/Hydra-Network/hydra-assets@main/gmes.json",
  "https://rawcdn.githack.com/Hydra-Network/hydra-assets/main/gmes.json",
  "https://raw.githubusercontent.com/Hydra-Network/hydra-assets/main/gmes.json",
];

export type HydraNetGame = {
  file_name: string;
  title: string;
  thumb: string;
  frame?: string; // "true" if the game needs to load inside an extra iframe
};

export async function fetchHydraNetwork(signal?: AbortSignal): Promise<HydraNetGame[]> {
  let lastErr: unknown = null;
  for (const url of HYDRA_DATA_URLS) {
    try {
      const r = await fetch(url, { signal });
      if (r.ok) return (await r.json()) as HydraNetGame[];
      lastErr = new Error(`Hydra Network ${r.status}`);
    } catch (e) {
      if ((e as { name?: string })?.name === "AbortError") throw e;
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("Hydra Network unreachable");
}

/** Resolve a relative path (file_name or thumb) against the first working base.
 *  Game HTML files live under the `gmes/` folder; thumbs already include their
 *  `thumbs/` prefix in the JSON. */
export function hydraNetAsset(path: string, baseIdx = 0) {
  const clean = path.replace(/^\/+/, "");
  // Thumbs go through jsdelivr (faster); game HTML goes through githack
  // (correct MIME so the iframe actually runs the game).
  if (clean.startsWith("thumbs/")) return HYDRA_THUMB_BASE + clean;
  const needsGmes = !clean.startsWith("gmes/");
  return HYDRA_BASES[baseIdx] + (needsGmes ? `gmes/${clean}` : clean);
}