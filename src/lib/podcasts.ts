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
const RSS_PROXY = "https://api.allorigins.win/raw?url=";

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

// Top podcasts via Apple's marketing RSS.
export async function topPodcasts(limit = 50): Promise<Podcast[]> {
  const url = `https://rss.applemarketingtools.com/api/v2/us/podcasts/top/${limit}/podcasts.json`;
  const r = await fetch(url);
  if (!r.ok) return [];
  const j = (await r.json()) as { feed: { results: Array<{ id: string; name: string; artistName: string; artworkUrl100: string; genres: { name: string }[] }> } };
  // Hydrate feedUrl via lookup batch
  const ids = j.feed.results.map((x) => x.id).join(",");
  let feeds: Record<string, string> = {};
  try {
    const lr = await fetch(`${ITUNES}/lookup?id=${ids}&entity=podcast`);
    const lj = (await lr.json()) as { results: Array<{ collectionId: number; feedUrl?: string }> };
    feeds = Object.fromEntries(lj.results.map((x) => [String(x.collectionId), x.feedUrl || ""]));
  } catch { /* ignore */ }
  return j.feed.results.map((x) => ({
    id: Number(x.id),
    title: x.name,
    artist: x.artistName,
    artwork: x.artworkUrl100.replace("100x100", "600x600"),
    feedUrl: feeds[x.id] || "",
    genre: x.genres?.[0]?.name || "",
  })).filter((p) => p.feedUrl);
}

export async function fetchEpisodes(feedUrl: string, limit = 50): Promise<Episode[]> {
  if (!feedUrl) return [];
  const r = await fetch(RSS_PROXY + encodeURIComponent(feedUrl));
  if (!r.ok) return [];
  const text = await r.text();
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