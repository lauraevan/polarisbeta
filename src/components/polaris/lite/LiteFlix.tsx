import { useEffect, useState } from "react";
import { tmdbApi, IMG, type TmdbItem } from "@/lib/tmdb";
import { useDebounced } from "@/lib/lite-utils";

type Row = { key: string; label: string; items: TmdbItem[] };

const ROW_DEFS: { key: string; label: string; load: () => Promise<TmdbItem[]> }[] = [
  { key: "trending", label: "Trending This Week", load: () => tmdbApi.trendingAll() },
  { key: "popularMovies", label: "Popular Movies", load: () => tmdbApi.popular("movie") },
  { key: "popularTv", label: "Popular TV", load: () => tmdbApi.popular("tv") },
  { key: "topRated", label: "Top Rated Movies", load: () => tmdbApi.topRated("movie") },
  { key: "nowPlaying", label: "In Theaters", load: () => tmdbApi.nowPlaying() },
  { key: "anime", label: "Anime", load: () => tmdbApi.animeTrending() },
];

export function LiteFlix() {
  const [q, setQ] = useState("");
  const dq = useDebounced(q, 350);
  const [rows, setRows] = useState<Row[]>([]);
  const [results, setResults] = useState<TmdbItem[] | null>(null);
  const [play, setPlay] = useState<{ id: number; type: "movie" | "tv"; title: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      ROW_DEFS.map((d) => d.load().then((items) => ({ key: d.key, label: d.label, items: items.filter((i) => i.poster_path) })).catch(() => null)),
    ).then((r) => { if (!cancelled) setRows(r.filter(Boolean) as Row[]); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const term = dq.trim();
    if (!term) { setResults(null); return; }
    let cancelled = false;
    tmdbApi.multiSearch(term)
      .then((items) => { if (!cancelled) setResults(items.filter((i) => i.poster_path)); })
      .catch(() => { if (!cancelled) setResults([]); });
    return () => { cancelled = true; };
  }, [dq]);

  if (play) {
    const src = `https://vidsrc.to/embed/${play.type}/${play.id}`;
    return (
      <div className="fixed inset-0 z-40 flex flex-col bg-black">
        <div className="flex items-center justify-between border-b border-white/10 bg-zinc-950/90 px-3 py-2">
          <div className="truncate text-sm font-bold">{play.title}</div>
          <button onClick={() => setPlay(null)} className="rounded-full border border-white/15 px-3 py-1 text-xs hover:bg-white/10">Close</button>
        </div>
        <iframe src={src} title={play.title} className="flex-1 w-full border-0" allow="autoplay; fullscreen" allowFullScreen />
      </div>
    );
  }

  function Card({ it }: { it: TmdbItem }) {
    const type: "movie" | "tv" = it.media_type === "tv" || it.first_air_date ? "tv" : "movie";
    const title = it.title || it.name || "Untitled";
    return (
      <button onClick={() => setPlay({ id: it.id, type, title })} className="group flex-shrink-0 text-left">
        <img
          src={IMG(it.poster_path, "w300")}
          alt={title}
          loading="lazy"
          decoding="async"
          width={150}
          height={225}
          className="w-[120px] sm:w-[140px] aspect-[2/3] rounded-md border border-white/10 bg-white/5 object-cover transition group-hover:border-white/30"
        />
        <div className="mt-1.5 w-[120px] sm:w-[140px] truncate text-[11px] text-white/70">{title}</div>
      </button>
    );
  }

  return (
    <div className="px-4 pt-2">
      <h1 className="text-xl font-bold">Flix</h1>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search movies & TV…"
        className="mt-3 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-white/30"
      />

      {results ? (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-bold text-white/80">Results</h2>
          {results.length === 0 ? (
            <div className="text-sm text-white/45">No matches.</div>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
              {results.map((it) => <Card key={`${it.media_type}-${it.id}`} it={it} />)}
            </div>
          )}
        </section>
      ) : (
        <div className="mt-4 space-y-7">
          {rows.length === 0 && <div className="text-xs text-white/40">Loading catalog…</div>}
          {rows.map((row) => (
            <section key={row.key}>
              <h2 className="mb-2 text-sm font-bold text-white/80">{row.label}</h2>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {row.items.map((it) => <Card key={`${row.key}-${it.id}`} it={it} />)}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
