// Curated query packs that fan out to Vapor's /search to build a deep,
// Spotify-style browse experience without a real catalog endpoint.
// Each pack returns dozens to hundreds of unique tracks after dedupe.

import { vaporSearch, type VaporItem } from "@/lib/vapor";

export type Genre = {
  id: string;
  name: string;
  color: string; // tailwind gradient class
  queries: string[];
};

export const GENRES: Genre[] = [
  {
    id: "pop",
    name: "Pop",
    color: "from-pink-500 to-rose-600",
    queries: ["pop hits", "top pop", "pop 2024", "pop 2023", "dance pop", "synth pop"],
  },
  {
    id: "hiphop",
    name: "Hip-Hop",
    color: "from-orange-500 to-red-600",
    queries: ["hip hop", "rap 2024", "trap", "drill", "hip hop classics", "old school rap"],
  },
  {
    id: "rnb",
    name: "R&B",
    color: "from-purple-500 to-indigo-600",
    queries: ["r&b", "soul", "neo soul", "rnb 2024", "smooth r&b", "rnb slow jams"],
  },
  {
    id: "rock",
    name: "Rock",
    color: "from-red-600 to-zinc-800",
    queries: ["rock", "indie rock", "alt rock", "classic rock", "punk rock", "grunge"],
  },
  {
    id: "electronic",
    name: "Electronic",
    color: "from-cyan-400 to-blue-700",
    queries: ["edm", "house", "techno", "dnb", "future bass", "electronic 2024"],
  },
  {
    id: "afrobeats",
    name: "Afrobeats",
    color: "from-amber-400 to-orange-600",
    queries: ["afrobeats", "amapiano", "afro pop", "nigerian", "burna boy", "wizkid"],
  },
  {
    id: "latin",
    name: "Latin",
    color: "from-yellow-400 to-red-500",
    queries: ["latin", "reggaeton", "bachata", "salsa", "latin pop", "trap latino"],
  },
  {
    id: "country",
    name: "Country",
    color: "from-amber-700 to-yellow-900",
    queries: ["country", "country 2024", "country pop", "country rock", "americana"],
  },
  {
    id: "jazz",
    name: "Jazz",
    color: "from-amber-300 to-orange-700",
    queries: ["jazz", "smooth jazz", "jazz classics", "bebop", "lo-fi jazz"],
  },
  {
    id: "kpop",
    name: "K-Pop",
    color: "from-fuchsia-500 to-purple-700",
    queries: ["kpop", "korean pop", "bts", "blackpink", "kpop 2024"],
  },
  {
    id: "indie",
    name: "Indie",
    color: "from-emerald-400 to-teal-700",
    queries: ["indie", "bedroom pop", "indie folk", "dream pop", "shoegaze"],
  },
  {
    id: "lofi",
    name: "Chill & Lo-fi",
    color: "from-violet-400 to-indigo-700",
    queries: ["lofi", "chillhop", "lo-fi beats", "study", "chill"],
  },
  {
    id: "classical",
    name: "Classical",
    color: "from-stone-400 to-stone-700",
    queries: ["classical", "piano", "orchestra", "violin", "baroque"],
  },
  {
    id: "reggae",
    name: "Reggae",
    color: "from-green-500 to-emerald-800",
    queries: ["reggae", "dancehall", "bob marley", "roots reggae"],
  },
  {
    id: "metal",
    name: "Metal",
    color: "from-zinc-600 to-zinc-900",
    queries: ["metal", "metalcore", "heavy metal", "death metal", "thrash"],
  },
];

export const MOODS: Genre[] = [
  {
    id: "workout",
    name: "Workout",
    color: "from-red-500 to-orange-600",
    queries: ["workout", "gym", "hype", "pump up"],
  },
  {
    id: "focus",
    name: "Focus",
    color: "from-blue-500 to-indigo-700",
    queries: ["focus", "study", "deep focus", "instrumental"],
  },
  {
    id: "party",
    name: "Party",
    color: "from-pink-500 to-fuchsia-700",
    queries: ["party", "club bangers", "dance floor"],
  },
  {
    id: "sleep",
    name: "Sleep",
    color: "from-indigo-400 to-purple-800",
    queries: ["sleep", "ambient", "calm", "meditation"],
  },
  {
    id: "throwback",
    name: "Throwback",
    color: "from-amber-400 to-orange-700",
    queries: ["throwback", "90s hits", "2000s hits", "80s"],
  },
  {
    id: "feelgood",
    name: "Feel Good",
    color: "from-yellow-300 to-pink-500",
    queries: ["feel good", "happy", "good vibes", "uplifting"],
  },
];

const cache = new Map<string, { at: number; data: VaporItem[] }>();
const TTL = 1000 * 60 * 30;

/** Run a query pack and return a deduped, song-only list. */
export async function fetchPack(
  cacheKey: string,
  queries: string[],
  limitPerQuery = 25,
): Promise<VaporItem[]> {
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < TTL) return hit.data;

  const results = await Promise.all(queries.map((q) => vaporSearch(q, "song").catch(() => [])));
  const seen = new Set<number>();
  const merged: VaporItem[] = [];
  for (const list of results) {
    for (const it of list.slice(0, limitPerQuery)) {
      if (it.type !== "song") continue;
      if (seen.has(it.id)) continue;
      seen.add(it.id);
      merged.push(it);
    }
  }
  cache.set(cacheKey, { at: Date.now(), data: merged });
  return merged;
}

export async function fetchGenre(g: Genre) {
  return fetchPack(`g:${g.id}`, g.queries);
}

/** A handful of trending-ish lists for the Browse hero rows. */
export const FEATURED_ROWS: Array<{ id: string; title: string; queries: string[] }> = [
  {
    id: "trending",
    title: "Trending now",
    queries: ["top hits 2024", "viral", "billboard hot 100", "tiktok hits"],
  },
  {
    id: "new",
    title: "New releases",
    queries: ["new music 2024", "just released", "fresh finds", "new singles"],
  },
  {
    id: "throwback",
    title: "Throwback vault",
    queries: ["90s hits", "2000s hits", "80s classics", "70s classics"],
  },
  {
    id: "global",
    title: "Global pulse",
    queries: ["afrobeats", "kpop", "reggaeton", "uk drill", "bollywood hits"],
  },
];
