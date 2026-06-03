import { useEffect, useState } from "react";
import { cachedFetchJson, useDebounced } from "@/lib/lite-utils";

const KEY = "ea29882e1ad27e91b16e09b34b76fb45"; // public TMDB demo key used elsewhere
const IMG = "https://image.tmdb.org/t/p/w342";

type Item = { id: number; title?: string; name?: string; poster_path?: string | null; media_type?: "movie" | "tv" };

export function LiteFlix() {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"trending" | "search">("trending");
  const [items, setItems] = useState<Item[]>([]);
  const [play, setPlay] = useState<{ id: number; type: "movie" | "tv"; title: string } | null>(null);
  const dq = useDebounced(q, 350);

  useEffect(() => {
    const ctrl = new AbortController();
    const url =
      tab === "search" && dq.trim()
        ? `https://api.themoviedb.org/3/search/multi?api_key=${KEY}&query=${encodeURIComponent(dq.trim())}`
        : `https://api.themoviedb.org/3/trending/all/week?api_key=${KEY}`;
    cachedFetchJson<{ results?: Item[] }>(url, { signal: ctrl.signal, ttlMs: 10 * 60_000 })
      .then((j) => setItems((j.results || []).filter((x: Item) => x.poster_path)))
      .catch(() => {});
    return () => ctrl.abort();
  }, [tab, dq]);

  if (play) {
    const src =
      play.type === "movie"
        ? `https://vidsrc.to/embed/movie/${play.id}`
        : `https://vidsrc.to/embed/tv/${play.id}`;
    return (
      <div className="fixed inset-0 z-40 flex flex-col bg-black">
        <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-950 px-3 py-2">
          <div className="truncate text-sm font-bold">{play.title}</div>
          <button onClick={() => setPlay(null)} className="rounded border border-neutral-700 px-3 py-1 text-xs hover:bg-neutral-800">
            Close
          </button>
        </div>
        <iframe src={src} title={play.title} className="flex-1 w-full border-0" allow="autoplay; fullscreen" allowFullScreen />
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      <h1 className="text-xl font-bold">Flix</h1>
      <div className="mt-3 flex gap-2">
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setTab(e.target.value ? "search" : "trending"); }}
          placeholder="Search movies & TV…"
          className="flex-1 rounded border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-600"
        />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
        {items.map((it) => {
          const type = (it.media_type === "tv" ? "tv" : "movie") as "movie" | "tv";
          const title = it.title || it.name || "Untitled";
          return (
            <button
              key={`${type}-${it.id}`}
              onClick={() => setPlay({ id: it.id, type, title })}
              className="text-left"
              title={title}
            >
              <img
                src={IMG + it.poster_path}
                alt={title}
                loading="lazy"
                className="aspect-[2/3] w-full rounded border border-neutral-800 bg-neutral-900 object-cover"
              />
              <div className="mt-1 truncate text-[11px] text-neutral-400">{title}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}