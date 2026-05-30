/**
 * Thin client for the open Hydra Launcher catalogue API.
 * No auth required, CORS open.
 */
const BASE = "https://hydra-api-us-east-1.losbroxas.org";

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
  const r = await fetch(`${BASE}/catalogue/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: opts.signal,
  });
  if (!r.ok) throw new Error(`Hydra ${r.status}`);
  return r.json();
}

export async function hydraFeatured(signal?: AbortSignal): Promise<HydraFeatured[]> {
  const r = await fetch(`${BASE}/games/featured`, { signal });
  if (!r.ok) throw new Error(`Hydra ${r.status}`);
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