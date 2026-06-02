import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Play } from "lucide-react";
import {
  GENRES,
  MOODS,
  FEATURED_ROWS,
  fetchGenre,
  fetchPack,
  type Genre,
} from "@/lib/music-catalog";
import type { VaporItem } from "@/lib/vapor";
import type { StoredTrack } from "@/lib/music-storage";

function toTrack(v: VaporItem): StoredTrack {
  return { id: v.id, title: v.title, artist: v.artist, image: v.image, duration: v.duration };
}

export function MusicCatalog({
  onPlay,
  onOpenGenre,
}: {
  onPlay: (t: StoredTrack, list: StoredTrack[]) => void;
  onOpenGenre: (g: Genre) => void;
}) {
  const [rows, setRows] = useState<Record<string, VaporItem[]>>({});
  const [hero, setHero] = useState<VaporItem | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const out: Record<string, VaporItem[]> = {};
      for (const r of FEATURED_ROWS) {
        const data = await fetchPack(`row:${r.id}`, r.queries, 18);
        if (cancel) return;
        out[r.id] = data;
        setRows((p) => ({ ...p, [r.id]: data }));
      }
      const pool = out["trending"] ?? [];
      if (pool.length && !cancel) setHero(pool[Math.floor(Math.random() * Math.min(pool.length, 12))]);
    })();
    return () => {
      cancel = true;
    };
  }, []);

  return (
    <div className="space-y-8">
      {hero && (
        <Hero
          item={hero}
          onPlay={() => onPlay(toTrack(hero), (rows["trending"] ?? []).map(toTrack))}
        />
      )}

      {FEATURED_ROWS.map((r) => (
        <Row
          key={r.id}
          title={r.title}
          items={rows[r.id] ?? []}
          onPlay={(t) => onPlay(t, (rows[r.id] ?? []).map(toTrack))}
        />
      ))}

      <section>
        <h2 className="mb-3 text-xl font-bold">Browse all</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {GENRES.map((g) => (
            <button
              key={g.id}
              onClick={() => onOpenGenre(g)}
              className={`relative aspect-[16/10] overflow-hidden rounded-2xl bg-gradient-to-br ${g.color} p-4 text-left transition hover:brightness-110`}
            >
              <div className="text-lg font-extrabold tracking-tight drop-shadow">
                {g.name}
              </div>
              <div className="absolute -bottom-2 -right-2 h-20 w-20 rotate-12 rounded-xl bg-black/30 shadow-2xl" />
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold">Moods & activities</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {MOODS.map((g) => (
            <button
              key={g.id}
              onClick={() => onOpenGenre(g)}
              className={`relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br ${g.color} p-3 text-left transition hover:brightness-110`}
            >
              <div className="text-sm font-extrabold drop-shadow">{g.name}</div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function Hero({ item, onPlay }: { item: VaporItem; onPlay: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-600 p-6 sm:p-8">
      <div className="absolute inset-0 opacity-30">
        <img src={item.image} alt="" className="h-full w-full object-cover blur-2xl scale-110" />
      </div>
      <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-end">
        <img
          src={item.image}
          alt=""
          className="h-32 w-32 rounded-2xl object-cover shadow-2xl ring-1 ring-white/20 sm:h-44 sm:w-44"
        />
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-white/70">
            Featured today
          </div>
          <h1 className="mt-1 text-2xl font-black leading-tight sm:text-4xl">{item.title}</h1>
          <div className="mt-1 text-sm text-white/80">{item.artist}</div>
          <button
            onClick={onPlay}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-bold text-black shadow-xl transition hover:scale-105"
          >
            <Play className="h-4 w-4 fill-black" /> Play
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({
  title,
  items,
  onPlay,
}: {
  title: string;
  items: VaporItem[];
  onPlay: (t: StoredTrack) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.8), behavior: "smooth" });
  };
  return (
    <section className="group/row">
      <div className="mb-3 flex items-end justify-between">
        <h2 className="text-xl font-bold">{title}</h2>
        <div className="flex gap-1 opacity-0 transition group-hover/row:opacity-100">
          <button
            onClick={() => scroll(-1)}
            className="grid h-8 w-8 place-items-center rounded-full bg-white/10 hover:bg-white/20"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll(1)}
            className="grid h-8 w-8 place-items-center rounded-full bg-white/10 hover:bg-white/20"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      {items.length === 0 ? (
        <div className="grid h-44 place-items-center text-white/40">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : (
        <div
          ref={ref}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((it) => (
            <button
              key={it.id}
              onClick={() => onPlay(toTrack(it))}
              className="group/card w-44 shrink-0 snap-start rounded-xl bg-white/[0.04] p-3 text-left transition hover:bg-white/10"
            >
              <div className="relative aspect-square overflow-hidden rounded-lg">
                <img src={it.image} alt="" className="h-full w-full object-cover" />
                <div className="absolute bottom-2 right-2 grid h-10 w-10 translate-y-2 place-items-center rounded-full bg-emerald-500 opacity-0 shadow-lg transition group-hover/card:translate-y-0 group-hover/card:opacity-100">
                  <Play className="h-5 w-5 fill-black text-black" />
                </div>
              </div>
              <div className="mt-2 truncate text-sm font-semibold">{it.title}</div>
              <div className="truncate text-xs text-white/50">{it.artist}</div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

export function GenrePage({
  genre,
  onPlay,
  onBack,
}: {
  genre: Genre;
  onPlay: (t: StoredTrack, list: StoredTrack[]) => void;
  onBack: () => void;
}) {
  const [items, setItems] = useState<VaporItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    setItems([]);
    fetchGenre(genre).then((d) => {
      if (cancel) return;
      setItems(d);
      setLoading(false);
    });
    return () => {
      cancel = true;
    };
  }, [genre]);

  const all = items.map(toTrack);

  return (
    <div className="space-y-5">
      <div
        className={`flex items-end gap-4 rounded-3xl bg-gradient-to-br ${genre.color} p-6 sm:p-8`}
      >
        <button
          onClick={onBack}
          className="rounded-full bg-black/30 px-3 py-1.5 text-xs hover:bg-black/50"
        >
          ← Back
        </button>
        <div className="flex-1">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-white/80">
            Genre
          </div>
          <h1 className="text-3xl font-black sm:text-5xl">{genre.name}</h1>
          <div className="text-xs text-white/80">{items.length} tracks loaded</div>
        </div>
        {items[0] && (
          <button
            onClick={() => onPlay(toTrack(items[0]), all)}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-bold text-black shadow-xl hover:scale-105"
          >
            <Play className="h-4 w-4 fill-black" /> Play all
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid h-40 place-items-center text-white/40">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {items.map((it) => (
            <button
              key={it.id}
              onClick={() => onPlay(toTrack(it), all)}
              className="group rounded-xl bg-white/[0.04] p-3 text-left transition hover:bg-white/10"
            >
              <div className="relative aspect-square overflow-hidden rounded-lg">
                <img src={it.image} alt="" className="h-full w-full object-cover" />
                <div className="absolute bottom-2 right-2 grid h-10 w-10 translate-y-2 place-items-center rounded-full bg-emerald-500 opacity-0 shadow-lg transition group-hover:translate-y-0 group-hover:opacity-100">
                  <Play className="h-5 w-5 fill-black text-black" />
                </div>
              </div>
              <div className="mt-2 truncate text-sm font-semibold">{it.title}</div>
              <div className="truncate text-xs text-white/50">{it.artist}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
