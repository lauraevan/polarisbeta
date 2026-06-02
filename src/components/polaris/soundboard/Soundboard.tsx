import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Square, Volume2, Music2, Loader2, Flame, Sparkles, Search as SearchIcon } from "lucide-react";

// soundbuttonsworld.com is the source of truth. Metadata is proxied through
// /api/soundboard (their JSON is CORS-locked to their own origin), but the
// audio files at /uploads/<fileName>.mp3 play fine directly via <audio>.
type Pad = {
  id: string | number;
  name: string;
  fileName: string;
  color?: string;
  categoryId?: number;
  categoryName?: string;
};
const AUDIO_BASE = "https://soundbuttonsworld.com/uploads/";
const audioUrl = (fileName: string) => `${AUDIO_BASE}${fileName}`;

type Category = { id: number; name: string; image_url?: string };
type Tab = "trending" | "new" | "category" | "search";

const COLOR_BG: Record<string, string> = {
  red: "from-rose-500/40 to-rose-700/20 border-rose-400/30",
  green: "from-emerald-500/40 to-emerald-700/20 border-emerald-400/30",
  blue: "from-sky-500/40 to-sky-700/20 border-sky-400/30",
  yellow: "from-amber-400/40 to-amber-600/20 border-amber-400/30",
  purple: "from-violet-500/40 to-violet-700/20 border-violet-400/30",
  black: "from-zinc-700/60 to-zinc-900/40 border-zinc-400/20",
  pink: "from-pink-500/40 to-pink-700/20 border-pink-400/30",
};

export function Soundboard() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [activeId, setActiveId] = useState<string | number | null>(null);
  const [vol, setVol] = useState(0.7);
  const [tab, setTab] = useState<Tab>("trending");
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCat, setActiveCat] = useState<number | null>(null);
  const [pads, setPads] = useState<Pad[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Load categories once
  useEffect(() => {
    fetch("/api/soundboard?kind=categories")
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setCategories(d))
      .catch(() => {});
  }, []);

  // Load pads when tab or category changes
  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setErr(null);
      try {
        const url =
          tab === "new"
            ? "/api/soundboard?kind=new&pageSize=120"
            : "/api/soundboard?kind=trends&pageSize=120";
        const r = await fetch(url);
        const j = await r.json();
        if (cancelled) return;
        const list: Pad[] = Array.isArray(j) ? j : (j.data ?? j.trending ?? []);
        setPads(list);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (tab === "trending" || tab === "new" || tab === "category") run();
    return () => {
      cancelled = true;
    };
  }, [tab]);

  // Search debounce
  useEffect(() => {
    if (tab !== "search") return;
    const q = search.trim();
    if (!q) {
      setPads([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      setLoading(true);
      setErr(null);
      try {
        const r = await fetch(`/api/soundboard?kind=search&q=${encodeURIComponent(q)}`);
        const j = await r.json();
        if (cancelled) return;
        const list: Pad[] = (j.results ?? []).map((x: Record<string, unknown>) => ({
          id: x.id as string | number,
          name: x.name as string,
          fileName: x.fileName as string,
          color: x.color as string | undefined,
          categoryName: x.category as string | undefined,
        }));
        setPads(list);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Search failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [search, tab]);

  function play(p: Pad) {
    const a = audioRef.current;
    if (!a) return;
    a.src = audioUrl(p.fileName);
    a.volume = vol;
    a.currentTime = 0;
    a.play()
      .then(() => setActiveId(p.id))
      .catch(() => setActiveId(null));
    a.onended = () => setActiveId(null);
  }
  function stop() {
    audioRef.current?.pause();
    setActiveId(null);
  }

  // Client-side filtering for the category tab and for instant local filter
  const visible = useMemo(() => {
    let list = pads;
    if (tab === "category" && activeCat != null) {
      list = list.filter((p) => p.categoryId === activeCat);
    }
    if (tab !== "search" && search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [pads, tab, activeCat, search]);

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-8 text-white">
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600">
          <Music2 className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Soundboard</h1>
          <div className="text-sm text-white/60">
            Powered by Sound Buttons World — tap a pad to fire it.
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl bg-white/5 p-2">
        <TabBtn active={tab === "trending"} onClick={() => setTab("trending")} icon={Flame}>
          Trending
        </TabBtn>
        <TabBtn active={tab === "new"} onClick={() => setTab("new")} icon={Sparkles}>
          New
        </TabBtn>
        <TabBtn active={tab === "category"} onClick={() => setTab("category")} icon={Music2}>
          Categories
        </TabBtn>
        <TabBtn active={tab === "search"} onClick={() => setTab("search")} icon={SearchIcon}>
          Search
        </TabBtn>
        <div className="ml-1 flex flex-1 items-center gap-2 rounded-lg bg-black/30 px-3 py-1.5">
          <SearchIcon className="h-3.5 w-3.5 text-white/45" />
          <input
            placeholder={tab === "search" ? "Search all sounds…" : "Filter loaded pads…"}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (e.target.value.trim() && tab !== "search") setTab("search");
            }}
            className="min-w-0 flex-1 bg-transparent text-sm focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2 pl-1">
          <Volume2 className="h-4 w-4 text-white/60" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={vol}
            onChange={(e) => setVol(Number(e.target.value))}
            className="w-28 accent-white"
          />
          <button
            onClick={stop}
            className="rounded-lg bg-white/10 px-2.5 py-1.5 text-xs hover:bg-white/20"
            aria-label="Stop"
          >
            <Square className="h-3 w-3" />
          </button>
        </div>
      </div>

      {tab === "category" && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCat(activeCat === c.id ? null : c.id)}
              className={`rounded-full px-3 py-1 text-xs transition ${
                activeCat === c.id ? "bg-white text-black" : "bg-white/5 hover:bg-white/10"
              }`}
            >
              {c.name}
            </button>
          ))}
          {!categories.length && <div className="text-xs text-white/40">Loading categories…</div>}
        </div>
      )}

      {err && (
        <div className="mb-3 rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-200">{err}</div>
      )}

      {loading ? (
        <div className="grid place-items-center py-16 text-white/50">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-sm text-white/40">
          {tab === "search"
            ? "Type something to search Sound Buttons World."
            : tab === "category" && !activeCat
              ? "Pick a category above."
              : "No pads."}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {visible.map((p) => {
            const active = activeId === p.id;
            const tone =
              COLOR_BG[p.color ?? ""] ??
              "from-white/10 to-white/[0.02] border-white/10";
            return (
              <button
                key={p.id}
                onClick={() => play(p)}
                title={p.name}
                className={`group relative aspect-square overflow-hidden rounded-2xl border bg-gradient-to-br p-3 text-left transition active:scale-95 ${tone} ${
                  active ? "shadow-[0_0_30px_-5px_rgba(236,72,153,0.55)] ring-2 ring-pink-400/60" : "hover:brightness-110"
                }`}
              >
                {p.categoryName && (
                  <div className="absolute right-2 top-2 max-w-[70%] truncate rounded-full bg-black/40 px-2 py-0.5 text-[9px] uppercase tracking-wider text-white/70">
                    {p.categoryName.replace(" Soundboard", "")}
                  </div>
                )}
                <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2">
                  <div className="line-clamp-2 break-words text-sm font-bold leading-tight text-white drop-shadow">
                    {p.name}
                  </div>
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black/40 backdrop-blur transition group-hover:bg-white group-hover:text-black">
                    <Play className="h-4 w-4" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <audio ref={audioRef} crossOrigin="anonymous" />
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Flame;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
        active ? "bg-white text-black" : "text-white/70 hover:bg-white/10"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </button>
  );
}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {visible.map((p) => {
          const active = activeId === p.id;
          return (
            <button
              key={p.id}
              onClick={() => play(p)}
              className={`group relative aspect-square overflow-hidden rounded-2xl border p-3 text-left transition active:scale-95 ${
                active
                  ? "border-pink-400 bg-pink-500/15 shadow-[0_0_30px_-5px_rgba(236,72,153,0.6)]"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
            >
              <div className="text-4xl">{p.emoji}</div>
              <div className="absolute right-2 top-2 rounded-full bg-black/40 px-2 py-0.5 text-[9px] uppercase tracking-wider text-white/60">
                {p.category}
              </div>
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <div className="truncate text-sm font-semibold">{p.label}</div>
                <Play className="h-4 w-4 text-white/40 group-hover:text-white" />
              </div>
            </button>
          );
        })}
      </div>

      <audio ref={audioRef} />
    </div>
  );
}
