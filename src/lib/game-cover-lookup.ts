/**
 * Lazy cover lookup for HTML5 / catalog games.
 * Calls Steam's CORS-open storesearch endpoint and picks the closest title match.
 * Results cached in-memory + sessionStorage so the same tile only hits the
 * network once per session.
 */
const MEM = new Map<string, Promise<string | null>>();
const SKEY = (k: string) => `pgcov:${k}`;

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function lookupCover(title: string): Promise<string | null> {
  const key = norm(title);
  if (!key) return Promise.resolve(null);
  if (MEM.has(key)) return MEM.get(key)!;

  try {
    const cached = sessionStorage.getItem(SKEY(key));
    if (cached !== null) {
      const p = Promise.resolve(cached || null);
      MEM.set(key, p);
      return p;
    }
  } catch {}

  const p = (async () => {
    try {
      const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(
        title
      )}&cc=us&l=en`;
      const r = await fetch(url, { referrerPolicy: "no-referrer" });
      if (!r.ok) throw 0;
      const j = (await r.json()) as {
        items?: { id: number; name: string; tiny_image?: string }[];
      };
      const items = j.items || [];
      // Find best match: exact normalized name first, otherwise first that contains it
      const exact = items.find((it) => norm(it.name) === key);
      const fuzzy =
        exact ||
        items.find((it) => norm(it.name).includes(key)) ||
        items[0];
      if (fuzzy?.id) {
        const cover = `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${fuzzy.id}/header.jpg`;
        try { sessionStorage.setItem(SKEY(key), cover); } catch {}
        return cover;
      }
      try { sessionStorage.setItem(SKEY(key), ""); } catch {}
      return null;
    } catch {
      return null;
    }
  })();
  MEM.set(key, p);
  return p;
}