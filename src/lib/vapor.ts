// Vapor music API client (Audiomack proxy).
const BASE = "https://audiomack.vpr.workers.dev";
const LRC = "https://lrclib.net/api";

export type VaporItem = {
  id: number;
  type: "song" | "album" | "playlist" | "artist";
  title: string;
  artist: string;
  artist_id?: string;
  genre?: string;
  duration: number;
  image: string;
  explicit?: boolean;
  tracks?: Array<{ id: number; title: string; duration: number; artist: string }>;
};

export async function vaporSearch(
  q: string,
  type: "song" | "album" | "all" = "all",
): Promise<VaporItem[]> {
  if (!q.trim()) return [];
  const url = new URL(BASE + "/search");
  url.searchParams.set("q", q);
  if (type !== "all") url.searchParams.set("type", type);
  const r = await fetch(url.toString());
  if (!r.ok) return [];
  const j = (await r.json()) as { status?: string; data?: VaporItem[] };
  return j?.data ?? [];
}

const PLAYBACK_CACHE = new Map<number, { url: string; at: number }>();
const TTL = 1000 * 60 * 60 * 3;

export async function vaporPlayback(id: number): Promise<string | null> {
  const hit = PLAYBACK_CACHE.get(id);
  if (hit && Date.now() - hit.at < TTL) return hit.url;
  try {
    const r = await fetch(`${BASE}/playback?id=${id}`);
    if (!r.ok) return null;
    const j = (await r.json()) as { stream_url?: string };
    if (!j?.stream_url) return null;
    PLAYBACK_CACHE.set(id, { url: j.stream_url, at: Date.now() });
    return j.stream_url;
  } catch {
    return null;
  }
}

/** YouTube fallback search (returns video id) via piped/invidious — best-effort. */
export async function youtubeFallback(query: string): Promise<string | null> {
  try {
    const r = await fetch(
      `https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(query)}&filter=music_songs`,
    );
    if (!r.ok) return null;
    const j = (await r.json()) as { items?: Array<{ url?: string }> };
    const url = j.items?.[0]?.url ?? "";
    const m = url.match(/v=([\w-]{11})/);
    return m?.[1] ?? null;
  } catch {
    return null;
  }
}

export type Lyric = { line: string; t: number };

export async function fetchLyrics(
  artist: string,
  title: string,
  duration?: number,
): Promise<{ synced: Lyric[]; plain: string }> {
  try {
    const url = new URL(LRC + "/get");
    url.searchParams.set("artist_name", artist);
    url.searchParams.set("track_name", title.replace(/\s*\(.*?\)\s*/g, "").trim());
    if (duration) url.searchParams.set("duration", String(duration));
    const r = await fetch(url.toString());
    if (!r.ok) return { synced: [], plain: "" };
    const j = (await r.json()) as {
      syncedLyrics?: string;
      plainLyrics?: string;
    };
    const synced: Lyric[] = [];
    if (j.syncedLyrics) {
      for (const raw of j.syncedLyrics.split("\n")) {
        const m = raw.match(/^\[(\d+):(\d+\.\d+)\](.*)$/);
        if (!m) continue;
        const t = parseInt(m[1], 10) * 60 + parseFloat(m[2]);
        synced.push({ t, line: m[3].trim() });
      }
    }
    return { synced, plain: j.plainLyrics ?? "" };
  } catch {
    return { synced: [], plain: "" };
  }
}

export function fmtTime(s: number) {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}
