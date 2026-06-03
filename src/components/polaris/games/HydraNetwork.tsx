import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { GameTile } from "./GameTile";
import { EmbedFrame } from "./EmbedFrame";
import { fetchHydraNetwork, hydraNetAsset, type HydraNetGame } from "@/lib/hydra-network";

const PAGE = 60;

export function HydraNetwork() {
  const [all, setAll] = useState<HydraNetGame[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const [play, setPlay] = useState<{ src: string; title: string } | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchHydraNetwork(ctrl.signal)
      .then((list) => setAll(list))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load Hydra Network"));
    return () => ctrl.abort();
  }, []);

  const filtered = useMemo(() => {
    if (!all) return [];
    const needle = q.trim().toLowerCase();
    if (!needle) return all;
    return all.filter((g) => g.title.toLowerCase().includes(needle));
  }, [all, q]);

  const visible = filtered.slice(0, limit);

  // Auto-load more rows when the sentinel scrolls into view.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setLimit((n) => (n < filtered.length ? n + PAGE : n));
        }
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [filtered.length]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.3em] text-white/55">Hydra Network</div>
          <h2 className="text-2xl font-black tracking-tight text-white">Hydra Network</h2>
          <p className="text-xs text-white/55">
            {all ? `${all.length.toLocaleString()} games` : "Loading catalogue…"} · open-source GitHub mirror
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1.5">
          <Search className="h-3.5 w-3.5 text-white/45" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setLimit(PAGE);
            }}
            placeholder="Search Hydra Network…"
            className="w-48 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none sm:w-64"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {!all && !error && (
        <div className="flex h-48 items-center justify-center text-white/40">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}

      {all && (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {visible.map((g) => (
              <GameTile
                key={g.file_name}
                title={g.title}
                cover={hydraNetAsset(g.thumb)}
                autoCover={false}
                onPlay={() =>
                  setPlay({ src: hydraNetAsset(g.file_name), title: g.title })
                }
              />
            ))}
          </div>
          {visible.length < filtered.length && (
            <div
              ref={sentinelRef}
              className="flex justify-center py-8 text-white/40"
              aria-hidden
            >
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}
          {filtered.length === 0 && (
            <div className="py-16 text-center text-sm text-white/50">No games match “{q}”.</div>
          )}
        </>
      )}

      {play && (
        <EmbedFrame src={play.src} title={play.title} mode="src" onClose={() => setPlay(null)} />
      )}
    </div>
  );
}