/**
 * Hydra Network — open HTML5 game catalogue hosted on GitHub.
 * Source: https://github.com/Hydra-Network/hydra-assets
 */
// jsdelivr is primary — it serves with correct MIME types so HTML games render
// inside an iframe. raw.githubusercontent.com sends text/plain which breaks the
// iframe boot, and rawcdn.githack.com is rate-limited.
export const HYDRA_BASES = [
  "https://cdn.jsdelivr.net/gh/Hydra-Network/hydra-assets@main/",
  "https://rawcdn.githack.com/Hydra-Network/hydra-assets/main/",
  "https://raw.githubusercontent.com/Hydra-Network/hydra-assets/main/",
];

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
  const needsGmes = !clean.startsWith("thumbs/") && !clean.startsWith("gmes/");
  return HYDRA_BASES[baseIdx] + (needsGmes ? `gmes/${clean}` : clean);
}