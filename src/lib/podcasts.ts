// iTunes Search API — free, no key. Episodes via RSS proxy.

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
// Try several CORS proxies — if one is down podcasts still load.
const RSS_PROXIES = [
  "https://api.allorigins.win/raw?url=",
  "https://corsproxy.io/?",
  "https://api.codetabs.com/v1/proxy?quest=",
];

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
];
export async function topPodcasts(_limit = 50): Promise<Podcast[]> {
  const results = await Promise.all(
    TOP_TERMS.map((t) => searchPodcasts(t, 3).catch(() => [] as Podcast[])),
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
  for (const proxy of RSS_PROXIES) {
    try {
      const r = await fetch(proxy + encodeURIComponent(feedUrl));
      if (r.ok) { text = await r.text(); if (text) break; }
    } catch { /* try next */ }
  }
  if (!text) return [];
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