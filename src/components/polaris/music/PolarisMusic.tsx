import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Heart,
  Plus,
  Music as MusicIcon,
  Volume2,
  ListMusic,
  Mic2,
  Disc3,
  Crown,
} from "lucide-react";
import {
  vaporSearch,
  vaporPlayback,
  fetchLyrics,
  fmtTime,
  type VaporItem,
  type Lyric,
} from "@/lib/vapor";
import {
  loadPlaylists,
  savePlaylists,
  loadRecent,
  pushRecent,
  loadLiked,
  toggleLiked,
  isLiked,
  type Playlist,
  type StoredTrack,
} from "@/lib/music-storage";
import { useAuth } from "@/lib/auth-context";
import { Link } from "@tanstack/react-router";

function isProActive(profile: { pro_until?: string | null } | null) {
  if (!profile?.pro_until) return false;
  // 'infinity' returns NaN — treat as forever
  const t = Date.parse(profile.pro_until);
  return Number.isNaN(t) ? true : t > Date.now();
}

function trackOf(item: VaporItem): StoredTrack {
  return {
    id: item.id,
    title: item.title,
    artist: item.artist,
    image: item.image,
    duration: item.duration,
  };
}

export function PolarisMusic() {
  const { profile } = useAuth();
  const pro = isProActive(profile);

  const [q, setQ] = useState("");
  const [results, setResults] = useState<VaporItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [view, setView] = useState<"home" | "liked" | "playlist" | "search">("home");
  const [activePlaylist, setActivePlaylist] = useState<string | null>(null);

  const [playlists, setPlaylists] = useState<Playlist[]>(loadPlaylists());
  const [recent, setRecent] = useState<StoredTrack[]>(loadRecent());
  const [liked, setLiked] = useState<StoredTrack[]>(loadLiked());

  // Player
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [queue, setQueue] = useState<StoredTrack[]>([]);
  const [qIdx, setQIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [vol, setVol] = useState(0.8);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<"off" | "all" | "one">("off");
  const [loadingStream, setLoadingStream] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyrics, setLyrics] = useState<{ synced: Lyric[]; plain: string }>({
    synced: [],
    plain: "",
  });

  const current = queue[qIdx] ?? null;

  // Search debounce
  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      setSearching(true);
      const r = await vaporSearch(q);
      setResults(r);
      setSearching(false);
      setView("search");
    }, 350);
    return () => clearTimeout(handle);
  }, [q]);

  // Load stream when current changes
  useEffect(() => {
    if (!current) return;
    const audio = audioRef.current;
    if (!audio) return;
    setLoadingStream(true);
    setProgress(0);
    let cancel = false;
    (async () => {
      const url = await vaporPlayback(current.id);
      if (cancel) return;
      if (!url) {
        setLoadingStream(false);
        // try next
        next();
        return;
      }
      audio.src = url;
      audio.volume = vol;
      try {
        await audio.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
      }
      setLoadingStream(false);
      pushRecent(current);
      setRecent(loadRecent());
    })();
    // Lyrics
    setLyrics({ synced: [], plain: "" });
    fetchLyrics(current.artist, current.title, current.duration).then(setLyrics);
    return () => {
      cancel = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  // Audio listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setProgress(audio.currentTime);
    const onDur = () => setDuration(audio.duration || 0);
    const onEnd = () => next();
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onDur);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onDur);
      audio.removeEventListener("ended", onEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qIdx, queue.length, repeat, shuffle]);

  function playTrack(t: StoredTrack, list?: StoredTrack[]) {
    if (list && list.length) {
      const idx = list.findIndex((x) => x.id === t.id);
      setQueue(list);
      setQIdx(idx >= 0 ? idx : 0);
    } else {
      setQueue([t]);
      setQIdx(0);
    }
  }

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio || !current) return;
    if (audio.paused) {
      audio.play().then(() => setPlaying(true)).catch(() => {});
    } else {
      audio.pause();
      setPlaying(false);
    }
  }

  function next() {
    if (!queue.length) return;
    if (repeat === "one") {
      const a = audioRef.current;
      if (a) {
        a.currentTime = 0;
        a.play();
      }
      return;
    }
    let n = shuffle ? Math.floor(Math.random() * queue.length) : qIdx + 1;
    if (n >= queue.length) {
      if (repeat === "all") n = 0;
      else {
        setPlaying(false);
        return;
      }
    }
    setQIdx(n);
  }

  function prev() {
    const a = audioRef.current;
    if (a && a.currentTime > 3) {
      a.currentTime = 0;
      return;
    }
    setQIdx((i) => (i > 0 ? i - 1 : 0));
  }

  function createPlaylist() {
    const name = window.prompt("Playlist name?");
    if (!name) return;
    const next: Playlist = {
      id: crypto.randomUUID(),
      name,
      tracks: [],
      createdAt: Date.now(),
    };
    const all = [next, ...playlists];
    setPlaylists(all);
    savePlaylists(all);
  }

  function addToPlaylist(track: StoredTrack, plId: string) {
    const all = playlists.map((p) =>
      p.id === plId && !p.tracks.some((t) => t.id === track.id)
        ? { ...p, tracks: [...p.tracks, track] }
        : p,
    );
    setPlaylists(all);
    savePlaylists(all);
  }

  function onToggleLike(t: StoredTrack) {
    setLiked(toggleLiked(t));
  }

  // Songs vs albums in results
  const songResults = results.filter((r) => r.type === "song");
  const albumResults = results.filter((r) => r.type === "album");

  // Currently shown list (right panel)
  const activePl = playlists.find((p) => p.id === activePlaylist) ?? null;
  const mainTracks: StoredTrack[] =
    view === "liked" ? liked : view === "playlist" && activePl ? activePl.tracks : [];

  // Current synced lyric line
  const activeLyricIdx = useMemo(() => {
    if (!lyrics.synced.length) return -1;
    let i = 0;
    for (let k = 0; k < lyrics.synced.length; k++) {
      if (lyrics.synced[k].t <= progress) i = k;
      else break;
    }
    return i;
  }, [lyrics.synced, progress]);

  return (
    <div className="flex h-[calc(100vh-72px)] flex-col bg-black text-white">
      <div className="flex min-h-0 flex-1 gap-2 px-2 pt-2">
        {/* Library sidebar */}
        <aside className="hidden w-64 shrink-0 flex-col gap-2 rounded-2xl bg-zinc-950/80 p-3 md:flex">
          <div className="flex items-center justify-between px-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-white/60">Library</div>
            <button
              onClick={createPlaylist}
              className="rounded-full p-1 text-white/70 hover:bg-white/10 hover:text-white"
              aria-label="New playlist"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={() => setView("home")}
            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${view === "home" ? "bg-white/10" : "hover:bg-white/5"}`}
          >
            <Disc3 className="h-4 w-4" />
            <span>Home</span>
          </button>
          <button
            onClick={() => setView("liked")}
            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${view === "liked" ? "bg-white/10" : "hover:bg-white/5"}`}
          >
            <Heart className="h-4 w-4 text-pink-400" />
            <span>Liked songs</span>
            <span className="ml-auto text-[10px] text-white/40">{liked.length}</span>
          </button>
          <div className="mt-2 flex-1 space-y-0.5 overflow-y-auto">
            {playlists.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setView("playlist");
                  setActivePlaylist(p.id);
                }}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm ${view === "playlist" && activePlaylist === p.id ? "bg-white/10" : "hover:bg-white/5"}`}
              >
                <ListMusic className="h-4 w-4 text-white/60" />
                <span className="truncate">{p.name}</span>
                <span className="ml-auto text-[10px] text-white/40">{p.tracks.length}</span>
              </button>
            ))}
            {playlists.length === 0 && (
              <div className="px-3 py-4 text-xs text-white/40">No playlists yet.</div>
            )}
          </div>
          {!pro && (
            <Link
              to="/premium"
              className="mt-2 flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-pink-500 px-3 py-2 text-xs font-semibold text-black hover:opacity-90"
            >
              <Crown className="h-4 w-4" />
              Upgrade to Pro
            </Link>
          )}
        </aside>

        {/* Main */}
        <main className="flex min-w-0 flex-1 flex-col gap-3 overflow-y-auto rounded-2xl bg-gradient-to-b from-zinc-900 to-black p-4">
          <div className="sticky top-0 z-10 flex items-center gap-2 rounded-2xl bg-zinc-900/70 px-3 py-2 backdrop-blur">
            <Search className="h-4 w-4 text-white/50" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search songs, artists, albums…"
              className="flex-1 bg-transparent text-sm focus:outline-none"
            />
            {searching && <div className="text-[10px] text-white/40">Searching…</div>}
          </div>

          {view === "search" && (
            <SearchResults
              songs={songResults}
              albums={albumResults}
              onPlay={(t) => playTrack(t, songResults.map(trackOf))}
              onLike={onToggleLike}
              liked={liked}
              playlists={playlists}
              onAdd={addToPlaylist}
            />
          )}

          {view === "home" && (
            <HomeFeed
              recent={recent}
              liked={liked}
              playlists={playlists}
              onPlay={(t, list) => playTrack(t, list)}
              onOpenPlaylist={(id) => {
                setActivePlaylist(id);
                setView("playlist");
              }}
            />
          )}

          {(view === "liked" || view === "playlist") && (
            <TrackTable
              title={view === "liked" ? "Liked songs" : activePl?.name ?? "Playlist"}
              tracks={mainTracks}
              onPlay={(t) => playTrack(t, mainTracks)}
              onLike={onToggleLike}
              liked={liked}
              playlists={playlists}
              onAdd={addToPlaylist}
            />
          )}
        </main>

        {/* Lyrics / queue right pane */}
        {showLyrics && current && (
          <aside className="hidden w-80 shrink-0 flex-col rounded-2xl bg-zinc-950/80 p-4 lg:flex">
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-white/60">
              <Mic2 className="h-4 w-4" /> Lyrics
            </div>
            <div className="flex-1 overflow-y-auto pr-2 text-sm leading-7">
              {lyrics.synced.length ? (
                lyrics.synced.map((l, i) => (
                  <div
                    key={i}
                    className={`transition ${i === activeLyricIdx ? "text-white" : "text-white/35"}`}
                  >
                    {l.line || "♪"}
                  </div>
                ))
              ) : lyrics.plain ? (
                <pre className="whitespace-pre-wrap text-white/70">{lyrics.plain}</pre>
              ) : (
                <div className="text-white/40">No lyrics found.</div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Player bar */}
      <NowPlaying
        current={current}
        playing={playing}
        loadingStream={loadingStream}
        progress={progress}
        duration={duration || current?.duration || 0}
        vol={vol}
        shuffle={shuffle}
        repeat={repeat}
        liked={current ? isLiked(current.id) : false}
        showLyrics={showLyrics}
        onTogglePlay={togglePlay}
        onNext={next}
        onPrev={prev}
        onSeek={(t) => {
          const a = audioRef.current;
          if (a) a.currentTime = t;
        }}
        onVol={(v) => {
          setVol(v);
          if (audioRef.current) audioRef.current.volume = v;
        }}
        onShuffle={() => setShuffle((s) => !s)}
        onRepeat={() =>
          setRepeat((r) => (r === "off" ? "all" : r === "all" ? "one" : "off"))
        }
        onLike={() => current && onToggleLike(current)}
        onToggleLyrics={() => setShowLyrics((s) => !s)}
      />

      <audio ref={audioRef} preload="auto" />
    </div>
  );
}

function HomeFeed({
  recent,
  liked,
  playlists,
  onPlay,
  onOpenPlaylist,
}: {
  recent: StoredTrack[];
  liked: StoredTrack[];
  playlists: Playlist[];
  onPlay: (t: StoredTrack, list: StoredTrack[]) => void;
  onOpenPlaylist: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-3 text-lg font-bold">Recently played</h2>
        {recent.length === 0 ? (
          <div className="text-sm text-white/40">Search for music to get started.</div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {recent.slice(0, 10).map((t) => (
              <button
                key={t.id}
                onClick={() => onPlay(t, recent)}
                className="group rounded-xl bg-white/5 p-3 text-left transition hover:bg-white/10"
              >
                <div className="relative aspect-square overflow-hidden rounded-lg">
                  <img src={t.image} alt="" className="h-full w-full object-cover" />
                  <div className="absolute right-2 bottom-2 grid h-10 w-10 place-items-center rounded-full bg-emerald-500 opacity-0 shadow-lg transition group-hover:opacity-100">
                    <Play className="h-5 w-5 fill-black text-black" />
                  </div>
                </div>
                <div className="mt-2 truncate text-sm font-semibold">{t.title}</div>
                <div className="truncate text-xs text-white/50">{t.artist}</div>
              </button>
            ))}
          </div>
        )}
      </section>
      <section>
        <h2 className="mb-3 text-lg font-bold">Your library</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <button
            onClick={() => onOpenPlaylist("__liked__")}
            className="rounded-xl bg-gradient-to-br from-indigo-600 to-pink-500 p-3 text-left transition hover:opacity-90"
          >
            <div className="grid aspect-square place-items-center">
              <Heart className="h-10 w-10" />
            </div>
            <div className="mt-2 text-sm font-semibold">Liked songs</div>
            <div className="text-xs text-white/70">{liked.length} tracks</div>
          </button>
          {playlists.map((p) => (
            <button
              key={p.id}
              onClick={() => onOpenPlaylist(p.id)}
              className="rounded-xl bg-white/5 p-3 text-left hover:bg-white/10"
            >
              <div className="grid aspect-square place-items-center rounded-lg bg-zinc-800">
                {p.tracks[0] ? (
                  <img src={p.tracks[0].image} alt="" className="h-full w-full rounded-lg object-cover" />
                ) : (
                  <ListMusic className="h-10 w-10 text-white/40" />
                )}
              </div>
              <div className="mt-2 truncate text-sm font-semibold">{p.name}</div>
              <div className="text-xs text-white/50">{p.tracks.length} tracks</div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function SearchResults({
  songs,
  albums,
  onPlay,
  onLike,
  liked,
  playlists,
  onAdd,
}: {
  songs: VaporItem[];
  albums: VaporItem[];
  onPlay: (t: StoredTrack) => void;
  onLike: (t: StoredTrack) => void;
  liked: StoredTrack[];
  playlists: Playlist[];
  onAdd: (t: StoredTrack, plId: string) => void;
}) {
  return (
    <div className="space-y-6">
      {songs.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold">Songs</h2>
          <TrackTable
            tracks={songs.map(trackOf)}
            onPlay={onPlay}
            onLike={onLike}
            liked={liked}
            playlists={playlists}
            onAdd={onAdd}
          />
        </section>
      )}
      {albums.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold">Albums</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {albums.slice(0, 10).map((a) => (
              <div key={a.id} className="rounded-xl bg-white/5 p-3">
                <img src={a.image} alt="" className="aspect-square w-full rounded-lg object-cover" />
                <div className="mt-2 truncate text-sm font-semibold">{a.title}</div>
                <div className="truncate text-xs text-white/50">{a.artist}</div>
              </div>
            ))}
          </div>
        </section>
      )}
      {songs.length === 0 && albums.length === 0 && (
        <div className="py-10 text-center text-sm text-white/40">No results.</div>
      )}
    </div>
  );
}

function TrackTable({
  title,
  tracks,
  onPlay,
  onLike,
  liked,
  playlists,
  onAdd,
}: {
  title?: string;
  tracks: StoredTrack[];
  onPlay: (t: StoredTrack) => void;
  onLike: (t: StoredTrack) => void;
  liked: StoredTrack[];
  playlists: Playlist[];
  onAdd: (t: StoredTrack, plId: string) => void;
}) {
  return (
    <div className="space-y-1">
      {title && <h2 className="mb-3 text-lg font-bold">{title}</h2>}
      {tracks.length === 0 && (
        <div className="rounded-xl bg-white/5 p-6 text-center text-sm text-white/40">
          Nothing here yet.
        </div>
      )}
      {tracks.map((t, i) => {
        const isLikedNow = liked.some((x) => x.id === t.id);
        return (
          <div
            key={`${t.id}-${i}`}
            className="group flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/5"
          >
            <div className="w-6 text-right text-xs text-white/40">{i + 1}</div>
            <button onClick={() => onPlay(t)} className="relative h-10 w-10 shrink-0 overflow-hidden rounded">
              <img src={t.image} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 grid place-items-center bg-black/50 opacity-0 group-hover:opacity-100">
                <Play className="h-4 w-4 fill-white" />
              </div>
            </button>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{t.title}</div>
              <div className="truncate text-xs text-white/50">{t.artist}</div>
            </div>
            <button
              onClick={() => onLike(t)}
              className="rounded-full p-1.5 hover:bg-white/10"
              aria-label="Like"
            >
              <Heart
                className={`h-4 w-4 ${isLikedNow ? "fill-pink-500 text-pink-500" : "text-white/60"}`}
              />
            </button>
            {playlists.length > 0 && (
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    onAdd(t, e.target.value);
                    e.target.value = "";
                  }
                }}
                className="hidden rounded-lg bg-white/10 px-2 py-1 text-xs text-white/80 group-hover:block"
                defaultValue=""
              >
                <option value="">Add to…</option>
                {playlists.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
            <div className="w-12 text-right text-xs text-white/40">{fmtTime(t.duration)}</div>
          </div>
        );
      })}
    </div>
  );
}

function NowPlaying({
  current,
  playing,
  loadingStream,
  progress,
  duration,
  vol,
  shuffle,
  repeat,
  liked,
  showLyrics,
  onTogglePlay,
  onNext,
  onPrev,
  onSeek,
  onVol,
  onShuffle,
  onRepeat,
  onLike,
  onToggleLyrics,
}: {
  current: StoredTrack | null;
  playing: boolean;
  loadingStream: boolean;
  progress: number;
  duration: number;
  vol: number;
  shuffle: boolean;
  repeat: "off" | "all" | "one";
  liked: boolean;
  showLyrics: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (t: number) => void;
  onVol: (v: number) => void;
  onShuffle: () => void;
  onRepeat: () => void;
  onLike: () => void;
  onToggleLyrics: () => void;
}) {
  return (
    <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-t border-white/10 bg-zinc-950/95 px-4 py-2.5 backdrop-blur">
      {/* Left: track info */}
      <div className="flex min-w-0 items-center gap-3">
        {current ? (
          <>
            <img src={current.image} alt="" className="h-12 w-12 rounded object-cover" />
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{current.title}</div>
              <div className="truncate text-xs text-white/50">{current.artist}</div>
            </div>
            <button onClick={onLike} className="ml-2 rounded-full p-1.5 hover:bg-white/10">
              <Heart className={`h-4 w-4 ${liked ? "fill-pink-500 text-pink-500" : "text-white/60"}`} />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2 text-xs text-white/40">
            <MusicIcon className="h-4 w-4" />
            Nothing playing
          </div>
        )}
      </div>

      {/* Center: controls */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-3">
          <button onClick={onShuffle} className={`p-1 ${shuffle ? "text-emerald-400" : "text-white/60 hover:text-white"}`}>
            <Shuffle className="h-4 w-4" />
          </button>
          <button onClick={onPrev} className="p-1 text-white/80 hover:text-white">
            <SkipBack className="h-5 w-5" />
          </button>
          <button
            onClick={onTogglePlay}
            disabled={!current || loadingStream}
            className="grid h-9 w-9 place-items-center rounded-full bg-white text-black hover:scale-105 disabled:opacity-50"
          >
            {loadingStream ? (
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-black border-t-transparent" />
            ) : playing ? (
              <Pause className="h-4 w-4 fill-black" />
            ) : (
              <Play className="h-4 w-4 fill-black" />
            )}
          </button>
          <button onClick={onNext} className="p-1 text-white/80 hover:text-white">
            <SkipForward className="h-5 w-5" />
          </button>
          <button
            onClick={onRepeat}
            className={`p-1 ${repeat !== "off" ? "text-emerald-400" : "text-white/60 hover:text-white"}`}
          >
            <Repeat className="h-4 w-4" />
            {repeat === "one" && <span className="ml-0.5 text-[9px]">1</span>}
          </button>
        </div>
        <div className="flex w-full max-w-xl items-center gap-2 px-1 text-[10px] text-white/50">
          <span className="w-9 text-right">{fmtTime(progress)}</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={progress}
            onChange={(e) => onSeek(Number(e.target.value))}
            className="flex-1 accent-white"
          />
          <span className="w-9">{fmtTime(duration)}</span>
        </div>
      </div>

      {/* Right: lyrics + vol */}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={onToggleLyrics}
          className={`hidden rounded p-1.5 lg:block ${showLyrics ? "text-emerald-400" : "text-white/60 hover:text-white"}`}
        >
          <Mic2 className="h-4 w-4" />
        </button>
        <Volume2 className="h-4 w-4 text-white/60" />
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={vol}
          onChange={(e) => onVol(Number(e.target.value))}
          className="w-24 accent-white"
        />
      </div>
    </div>
  );
}
