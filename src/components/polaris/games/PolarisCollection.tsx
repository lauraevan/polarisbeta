import { useDeferredValue, useMemo, useState } from "react";
import { Search, Play, Gamepad2 } from "lucide-react";
import { POLARIS_GAMES } from "@/lib/polaris-games";
import { EmbedFrame } from "./EmbedFrame";

const CDN = "https://cdn.jsdelivr.net/npm/ugs-singlefiles@1.0.6/";
const PAGE = 60;

// Curated "Top picks" for the featured row
const TOP_PICKS = [
  "1v1lol","slope","retrobowl","driftboss","tunnelrush","crossyroad","awesometanks",
  "papasfreezeria","subwaysurfers","tombofthemask","tinyfishing","monkeymart",
  "bittlife","amongus","minecraftclassic","cookieclicker","2048","geometrydash",
];

// Steam-style monochrome tile (a single accent color, no rainbow gradients)
function GameTile({
  title,
  onPlay,
  size = "md",
}: {
  title: string;
  onPlay: () => void;
  size?: "md" | "lg";
}) {
  const h = size === "lg" ? "h-40" : "h-28";
  return (
    <button
      onClick={onPlay}
      className={`group relative ${h} w-full overflow-hidden rounded-sm border border-white/5 bg-zinc-900/90 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-[rgb(var(--polaris-accent))]/60`}
    >
      <div
        className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(ellipse at bottom, rgba(var(--polaris-accent)/0.35), transparent 70%)",
        }}
      />
      <div className="relative flex h-full flex-col justify-end p-3">
        <span className="line-clamp-2 text-sm font-semibold text-white">
          {title}
        </span>
        <span className="mt-1 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-white/45 transition group-hover:text-[rgb(var(--polaris-accent))]">
          <Play className="h-2.5 w-2.5 fill-current" /> Play
        </span>
      </div>
    </button>
  );
}

export function PolarisCollection() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [playing, setPlaying] = useState<{ src: string; title: string } | null>(null);
  const dq = useDeferredValue(q.trim().toLowerCase());

  const filtered = useMemo(() => {
    if (!dq) return POLARIS_GAMES;
    return POLARIS_GAMES.filter((g) => g.t.toLowerCase().includes(dq));
  }, [dq]);

  const visible = filtered.slice(0, page * PAGE);

  const featured = useMemo(() => {
    const pool = POLARIS_GAMES;
    return TOP_PICKS
      .map((slug) =>
        pool.find((g) => g.f.toLowerCase().includes(slug))
      )
      .filter(Boolean) as typeof POLARIS_GAMES;
  }, []);

  const play = (g: { f: string; t: string }) =>
    setPlaying({ src: CDN + encodeURI(g.f), title: g.t });

  return (
    <div className="space-y-8">
      {/* Search */}
      <div className="flex items-center gap-3 rounded-sm border border-white/10 bg-zinc-900/80 px-4 py-3">
        <Search className="h-4 w-4 text-white/50" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder={`Search ${POLARIS_GAMES.length.toLocaleString()} games…`}
          className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
        />
        <span className="text-xs text-white/40 tabular-nums">
          {filtered.length.toLocaleString()}
        </span>
      </div>

      {!dq && featured.length > 0 && (
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/55">
            <Gamepad2 className="h-3.5 w-3.5" /> Top Picks
          </h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {featured.map((g) => (
              <GameTile key={g.f} title={g.t} onPlay={() => play(g)} size="lg" />
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/55">
          {dq ? "Results" : "All Games"}
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {visible.map((g) => (
            <GameTile key={g.f} title={g.t} onPlay={() => play(g)} />
          ))}
        </div>
        {visible.length < filtered.length && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setPage((p) => p + 1)}
              className="rounded-sm border border-white/15 bg-white/5 px-6 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Load more ({(filtered.length - visible.length).toLocaleString()} left)
            </button>
          </div>
        )}
      </section>

      {playing && (
        <EmbedFrame
          src={playing.src}
          title={playing.title}
          mode="srcdoc"
          onClose={() => setPlaying(null)}
        />
      )}
    </div>
  );
}