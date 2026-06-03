/**
 * Hydra Network — open HTML5 game catalogue hosted on GitHub.
 * Source: https://github.com/Hydra-Network/hydra-assets
 */
export const HYDRA_BASES = [
  "https://raw.githubusercontent.com/Hydra-Network/hydra-assets/main/",
  "https://rawcdn.githack.com/Hydra-Network/hydra-assets/main/",
];

export const HYDRA_DATA_URLS = [
  "https://raw.githubusercontent.com/Hydra-Network/hydra-assets/main/gmes.json",
  "https://rawcdn.githack.com/Hydra-Network/hydra-assets/main/gmes.json",
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

/** Resolve a relative path (file_name or thumb) against the first working base. */
export function hydraNetAsset(path: string, baseIdx = 0) {
  return HYDRA_BASES[baseIdx] + path;
}