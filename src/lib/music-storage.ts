import { safeGetItem, safeSetItem } from "@/lib/safe-storage";

export type StoredTrack = {
  id: number;
  title: string;
  artist: string;
  image: string;
  duration: number;
};

export type Playlist = {
  id: string;
  name: string;
  tracks: StoredTrack[];
  createdAt: number;
};

const KEY_PL = "polaris:music:playlists";
const KEY_RECENT = "polaris:music:recent";
const KEY_LIKED = "polaris:music:liked";

export function loadPlaylists(): Playlist[] {
  try {
    return JSON.parse(safeGetItem("local", KEY_PL) ?? "[]") as Playlist[];
  } catch {
    return [];
  }
}
export function savePlaylists(p: Playlist[]) {
  safeSetItem("local", KEY_PL, JSON.stringify(p));
}

export function loadRecent(): StoredTrack[] {
  try {
    return JSON.parse(safeGetItem("local", KEY_RECENT) ?? "[]") as StoredTrack[];
  } catch {
    return [];
  }
}
export function pushRecent(t: StoredTrack) {
  const cur = loadRecent().filter((x) => x.id !== t.id);
  cur.unshift(t);
  safeSetItem("local", KEY_RECENT, JSON.stringify(cur.slice(0, 30)));
}

export function loadLiked(): StoredTrack[] {
  try {
    return JSON.parse(safeGetItem("local", KEY_LIKED) ?? "[]") as StoredTrack[];
  } catch {
    return [];
  }
}
export function toggleLiked(t: StoredTrack): StoredTrack[] {
  const cur = loadLiked();
  const idx = cur.findIndex((x) => x.id === t.id);
  const next = idx >= 0 ? cur.filter((_, i) => i !== idx) : [t, ...cur];
  safeSetItem("local", KEY_LIKED, JSON.stringify(next));
  return next;
}
export function isLiked(id: number): boolean {
  return loadLiked().some((t) => t.id === id);
}
