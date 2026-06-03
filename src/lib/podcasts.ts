// iTunes Search API — free, no key. Episodes via a CORS proxy.

export type Podcast = {
  id: number; // collectionId
  title: string;
  artist: string;
  artwork: string; // 600x600
  feedUrl: string;
  genre: string;
};

export type Episode = {
  guid: string;
  title: string;
  description: string;
  pubDate: string;
  duration: string;
  audioUrl: string;
  image?: string;
};

const ITUNES = "https://itunes.apple.com";
// Try several CORS proxies — if one is down or rate-limited podcasts still load.
// Each entry is `(url) => proxiedUrl` so we can vary the wrapping format.
const RSS_PROXIES: ((u: string) => string)[] = [
  (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
  (u) => `https://cors.eu.org/${u}`,
  (u) => `https://thingproxy.freeboard.io/fetch/${u}`,
  (u) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`,
];

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

function mapPodcast(r: Record<string, unknown>): Podcast {
  const art = (r.artworkUrl600 as string) || (r.artworkUrl100 as string) || "";
  return {
    id: r.collectionId as number,
    title: (r.collectionName as string) || "",
    artist: (r.artistName as string) || "",
    artwork: art,
    feedUrl: (r.feedUrl as string) || "",
    genre: (r.primaryGenreName as string) || "",
  };
}

export async function searchPodcasts(q: string, limit = 24): Promise<Podcast[]> {
  if (!q.trim()) return [];
  const url = `${ITUNES}/search?media=podcast&limit=${limit}&term=${encodeURIComponent(q)}`;
  const r = await fetch(url);
  if (!r.ok) return [];
  const j = (await r.json()) as { results: Record<string, unknown>[] };
  return (j.results || []).map(mapPodcast).filter((p) => p.feedUrl && p.artwork);
}

// Top podcasts: aggregate iTunes search across popular topics. Each call returns
// rich entries with feedUrl baked in, so we never get stuck on a lookup step.
const TOP_TERMS = [
  "joe rogan", "lex fridman", "huberman", "npr news", "this american life",
  "the daily", "smartless", "crime junkie", "stuff you should know", "serial",
  "tim ferriss", "freakonomics", "ted talks daily", "armchair expert",
  "morbid", "call her daddy", "comedy", "technology", "history", "business",
  "theo von", "shawn ryan", "this past weekend", "conan o brien", "dax shepard",
  "my favorite murder", "radiolab", "planet money", "hardcore history",
  "rotten mango", "up first", "wait wait", "fresh air", "99 percent invisible",
  "reply all", "economist", "wall street journal", "new york times", "ezra klein",
  "sam harris", "bill simmons", "pat mcafee", "my first million", "all in podcast",
  "acquired", "masters of scale", "how i built this", "huberman lab",
  "modern wisdom", "jordan peterson", "ben shapiro", "tucker carlson",
  "candace owens", "piers morgan", "megyn kelly", "political gabfest", "science",
  "sports", "true crime", "music", "education",
];
export async function topPodcasts(_limit = 50): Promise<Podcast[]> {
  const results = await Promise.all(
    TOP_TERMS.map((t) => searchPodcasts(t, 4).catch(() => [] as Podcast[])),
  );
  const seen = new Set<number>();
  const out: Podcast[] = [];
  for (const arr of results) for (const p of arr) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    out.push(p);
  }
  return out;
}

export async function fetchEpisodes(feedUrl: string, limit = 50): Promise<Episode[]> {
  if (!feedUrl) return [];
  let text = "";
  let lastErr: unknown = null;
  for (const wrap of RSS_PROXIES) {
    const url = wrap(feedUrl);
    try {
      const r = await fetchWithTimeout(url, 8000);
      if (!r.ok) { lastErr = new Error(`Proxy ${r.status}`); continue; }
      let body = await r.text();
      // allorigins `/get` wraps the feed in JSON: { contents: "<xml…>" }
      if (url.includes("allorigins.win/get")) {
        try { body = (JSON.parse(body) as { contents?: string }).contents ?? ""; } catch { /* */ }
      }
      if (body && body.includes("<")) { text = body; break; }
    } catch (e) {
      lastErr = e;
    }
  }
  if (!text) {
    console.warn("[podcasts] all proxies failed for", feedUrl, lastErr);
    return [];
  }
  const doc = new DOMParser().parseFromString(text, "application/xml");
  const items = Array.from(doc.querySelectorAll("item")).slice(0, limit);
  return items.map((it) => {
    const enc = it.querySelector("enclosure");
    const itunesImage = it.getElementsByTagNameNS("*", "image")[0]?.getAttribute("href") || "";
    const dur = it.getElementsByTagNameNS("*", "duration")[0]?.textContent || "";
    return {
      guid: it.querySelector("guid")?.textContent || it.querySelector("title")?.textContent || Math.random().toString(36),
      title: it.querySelector("title")?.textContent || "Episode",
      description: (it.querySelector("description")?.textContent || "").replace(/<[^>]+>/g, "").slice(0, 400),
      pubDate: it.querySelector("pubDate")?.textContent || "",
      duration: dur,
      audioUrl: enc?.getAttribute("url") || "",
      image: itunesImage,
    };
  }).filter((e) => e.audioUrl);
}