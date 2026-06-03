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
  "https://corsproxy.io/?url=",
  "https://api.allorigins.win/raw?url=",
  "https://api.codetabs.com/v1/proxy?quest=",
  "https://thingproxy.freeboard.io/fetch/",
  "https://cors.eu.org/",
];

function fetchWithTimeout(url: string, ms = 8000): Promise<Response> {
  return Promise.race([
    fetch(url),
    new Promise<Response>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms)),
  ]);
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
  let r: Response;
  try { r = await fetchWithTimeout(url, 6000); } catch { return []; }
  if (!r.ok) return [];
  const j = (await r.json()) as { results: Record<string, unknown>[] };
  return (j.results || []).map(mapPodcast).filter((p) => p.feedUrl && p.artwork);
}

// Top podcasts: aggregate iTunes search across popular topics, but in small
// concurrent batches so a single slow request can't lock up the whole page.
// First batch returns fast for an immediate paint; remaining batches stream
// in via the optional onMore callback.
const TOP_TERMS = [
  "joe rogan", "lex fridman", "huberman lab", "theo von", "shawn ryan",
  "smartless", "this american life", "the daily", "crime junkie", "serial",
  "tim ferriss", "freakonomics", "ted talks daily", "armchair expert",
  "morbid", "call her daddy", "rotten mango", "my favorite murder",
  "radiolab", "planet money", "hardcore history", "up first", "fresh air",
  "99 percent invisible", "ezra klein", "sam harris", "bill simmons",
  "pat mcafee", "my first million", "all in podcast", "acquired",
  "how i built this", "modern wisdom", "jordan peterson", "ben shapiro",
  "tucker carlson", "candace owens", "piers morgan", "megyn kelly",
  "diary of a ceo", "stuff you should know", "conan o brien", "dax shepard",
  "true crime", "science", "comedy", "history", "business", "technology",
];
async function batched<T, R>(items: T[], size: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += size) {
    const chunk = items.slice(i, i + size);
    out.push(...(await Promise.all(chunk.map(fn))));
  }
  return out;
}
export async function topPodcasts(_limit = 50): Promise<Podcast[]> {
  // Run searches in chunks of 6 — fast first paint, no thundering herd.
  const arrays = await batched(TOP_TERMS, 6, (t) => searchPodcasts(t, 3).catch(() => [] as Podcast[]));
  const seen = new Set<number>();
  const out: Podcast[] = [];
  for (const arr of arrays) for (const p of arr) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    out.push(p);
  }
  return out;
}

export async function fetchEpisodes(feedUrl: string, limit = 50): Promise<Episode[]> {
  if (!feedUrl) return [];
  // 1. Try rss2json first — it returns clean JSON so we skip XML parsing.
  try {
    const r = await fetchWithTimeout(
      `https://api.rss2json.com/v1/api.json?count=${limit}&rss_url=${encodeURIComponent(feedUrl)}`,
      8000,
    );
    if (r.ok) {
      const j = await r.json() as { items?: Array<Record<string, any>> };
      const eps: Episode[] = (j.items || []).map((it) => ({
        guid: it.guid || it.link || String(Math.random()),
        title: it.title || "Episode",
        description: (it.description || it.content || "").replace(/<[^>]+>/g, "").slice(0, 400),
        pubDate: it.pubDate || "",
        duration: it.enclosure?.duration || "",
        audioUrl: it.enclosure?.link || it.enclosure?.url || "",
        image: it.thumbnail || it.enclosure?.thumbnail || "",
      })).filter((e) => e.audioUrl);
      if (eps.length) return eps;
    }
  } catch { /* fall through */ }

  // 2. Fall back to raw RSS via rotating proxies.
  let text = "";
  for (const proxy of RSS_PROXIES) {
    try {
      const r = await fetchWithTimeout(proxy + encodeURIComponent(feedUrl), 7000);
      if (r.ok) { text = await r.text(); if (text && text.length > 100) break; }
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