/**
 * Thin client for the open Hydra Launcher catalogue API.
 * No auth required, CORS open.
 */
// Multiple Hydra mirrors — we race-fallback so one bad region doesn't kill the network tab.
const BASES = [
  "https://hydra-api-us-east-1.losbroxas.org",
  "https://hydra-api-eu-east-1.losbroxas.org",
];

async function fetchAny(path: string, init: RequestInit, signal?: AbortSignal) {
  let lastErr: unknown = null;
  for (const base of BASES) {
    try {
      const r = await fetch(`${base}${path}`, { ...init, signal });
      if (r.ok) return r;
      lastErr = new Error(`Hydra ${r.status}`);
    } catch (e) {
      if ((e as { name?: string })?.name === "AbortError") throw e;
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("Hydra unreachable");
}

export type HydraEdge = {
  objectId: string;
  title: string;
  shop: "steam" | string;
  genres?: string[];
  libraryImageUrl?: string;
  releaseYear?: number;
  id: string;
};

export type HydraSearchResult = {
  count: number;
  edges: HydraEdge[];
};

export type HydraFeatured = {
  shop: string;
  title: string;
  objectId: string;
  description?: string;
  libraryHeroImageUrl?: string;
  logoImageUrl?: string;
  uri?: string;
};

export async function hydraSearch(opts: {
  title?: string;
  take?: number;
  skip?: number;
  genres?: string[];
  signal?: AbortSignal;
}): Promise<HydraSearchResult> {
  const body = {
    title: opts.title ?? "",
    take: Math.max(5, opts.take ?? 30),
    skip: opts.skip ?? 0,
    genres: opts.genres ?? [],
    tags: [],
    publishers: [],
    developers: [],
    downloadSourceFingerprints: [],
  };
  const r = await fetchAny(
    `/catalogue/search`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
    opts.signal,
  );
  return r.json();
}

export async function hydraFeatured(signal?: AbortSignal): Promise<HydraFeatured[]> {
  const r = await fetchAny(`/games/featured`, {}, signal);
  return r.json();
}

export function steamHeader(objectId: string | number) {
  return `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${objectId}/header.jpg`;
}

export function steamStoreUrl(objectId: string | number) {
  return `https://store.steampowered.com/app/${objectId}/`;
}

export function hydraDeepLink(objectId: string | number, title: string) {
  return `hydralauncher://library/search?q=${encodeURIComponent(title)}&objectId=${objectId}`;
}