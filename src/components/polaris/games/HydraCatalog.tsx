import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Download, ExternalLink, Cloud, Loader2 } from "lucide-react";
import {
  hydraSearch,
  steamHeader,
  steamStoreUrl,
  hydraDeepLink,
  type HydraEdge,
} from "@/lib/hydra-api";
import { GameTile } from "./GameTile";

const PAGE = 36;

const GENRES = [
  "All", "Action", "Adventure", "RPG", "Indie", "Strategy",
  "Simulation", "Sports", "Racing", "Casual", "Massively Multiplayer",
] as const;

function DetailSheet({ g, onClose }: { g: HydraEdge; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/80 p-0 backdrop-blur-md sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl overflow-hidden rounded-t-2xl border border-white/10 bg-zinc-950 shadow-2xl sm:rounded-2xl"
      >
        <div className="relative aspect-[460/215] w-full">
          <img
            src={g.libraryImageUrl || steamHeader(g.objectId)}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
        </div>
        <div className="space-y-4 px-6 pb-6 pt-2">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-[rgb(var(--polaris-accent))]">
              {(g.genres || []).slice(0, 3).join(" · ") || "PC Game"}
              {g.releaseYear ? ` · ${g.releaseYear}` : ""}
            </div>
            <h2 className="mt-1 text-2xl font-bold text-white">{g.title}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={hydraDeepLink(g.objectId, g.title)}
              className="inline-flex items-center gap-2 rounded-md bg-[rgb(var(--polaris-accent))] px-5 py-2.5 text-sm font-semibold text-black transition hover:brightness-110"
            >
              <Download className="h-4 w-4" /> Launch in Hydra
            </a>
            <a
              href={steamStoreUrl(g.objectId)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <ExternalLink className="h-4 w-4" /> Steam Page
            </a>
            <a
              href="https://cinesteam.cine-softwares.workers.dev/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <Cloud className="h-4 w-4" /> Cloud Stream
            </a>
          </div>
          <p className="text-[11px] text-white/45">
            Powered by the open Hydra Launcher catalogue. Install Hydra from{" "}
            <a
              href="https://hydralauncher.gg/"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-white/70"
            >
              hydralauncher.gg
            </a>{" "}
            to play locally.
          </p>
        </div>
      </div>
    </div>
  );
}

export function HydraCatalog() {
  const [q, setQ] = useState("");
  const [genre, setGenre] = useState<(typeof GENRES)[number]>("All");
  const [page, setPage] = useState(0);
  const [data, setData] = useState<HydraEdge[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [active, setActive] = useState<HydraEdge | null>(null);
  const reqId = useRef(0);

  // Debounce search
  const debouncedQ = useDebounced(q, 300);

  useEffect(() => {
    setData([]);
    setPage(0);
  }, [debouncedQ, genre]);

  useEffect(() => {
    const id = ++reqId.current;
    const ctrl = new AbortController();
    setLoading(true);
    setErr(null);
    hydraSearch({
      title: debouncedQ,
      take: PAGE,
      skip: page * PAGE,
      genres: genre === "All" ? [] : [genre],
      signal: ctrl.signal,
    })
      .then((res) => {
        if (id !== reqId.current) return;
        setData((prev) => (page === 0 ? res.edges : [...prev, ...res.edges]));
        setCount(res.count);
      })
      .catch((e) => {
        if (ctrl.signal.aborted || id !== reqId.current) return;
        setErr(String(e?.message ?? e));
      })
      .finally(() => id === reqId.current && setLoading(false));
    return () => ctrl.abort();
  }, [debouncedQ, genre, page]);

  const canLoadMore = data.length < count;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-3 rounded-md border border-white/10 bg-zinc-900/80 px-4 py-3">
          <Search className="h-4 w-4 text-white/50" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search the Hydra catalogue…"
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
          />
          <span className="text-xs text-white/40 tabular-nums">
            {count.toLocaleString()} games
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {GENRES.map((c) => (
          <button
            key={c}
            onClick={() => setGenre(c)}
            className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wider transition ${
              genre === c
                ? "bg-[rgb(var(--polaris-accent))] text-black"
                : "border border-white/10 bg-white/5 text-white/65 hover:bg-white/10"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {err && (
        <div className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-zinc-900/80 p-4 text-sm text-white/70">
          <span>Couldn't reach Hydra Network: {err}</span>
          <button
            onClick={() => { setPage(0); setData([]); setErr(null); }}
            className="rounded-md bg-[rgb(var(--polaris-accent))] px-3 py-1.5 text-xs font-bold text-black"
          >Retry</button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {data.map((g) => (
          <GameTile
            key={g.id}
            title={g.title}
            cover={g.libraryImageUrl || steamHeader(g.objectId)}
            autoCover={false}
            onPlay={() => setActive(g)}
          />
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8 text-white/50">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}

      {!loading && canLoadMore && (
        <div className="flex justify-center">
          <button
            onClick={() => setPage((p) => p + 1)}
            className="rounded-md border border-white/15 bg-white/5 px-6 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Load more ({(count - data.length).toLocaleString()} left)
          </button>
        </div>
      )}

      {active && <DetailSheet g={active} onClose={() => setActive(null)} />}
    </div>
  );
}

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}