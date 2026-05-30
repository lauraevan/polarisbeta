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

function accent(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `linear-gradient(135deg, hsl(${hue} 70% 35%), hsl(${(hue + 60) % 360} 70% 22%))`;
}

function GameTile({
  title,
  onPlay,
  size = "md",
}: {
  title: string;
  onPlay: () => void;
  size?: "md" | "lg";
}) {
  const h = size === "lg" ? "h-44" : "h-32";
  return (
    <button
      onClick={onPlay}
      className={`group relative ${h} w-full overflow-hidden rounded-xl border border-white/10 text-left transition-transform duration-200 hover:scale-[1.03] hover:border-white/25`}
      style={{ background: accent(title) }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3">
        <span className="line-clamp-2 text-sm font-semibold text-white drop-shadow">
          {title}
        </span>
        <span className="opacity-0 transition group-hover:opacity-100">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-black">
            <Play className="h-4 w-4 fill-current" />
          </span>
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
    setPlaying({ src: CDN + g.f, title: g.t });

  return (
    <div className="space-y-8">
      {/* Search */}
      <div className="liquid-glass-themed flex items-center gap-3 rounded-2xl px-4 py-3">
        <Search className="h-4 w-4 text-white/60" />
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
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/80">
            <Gamepad2 className="h-4 w-4" /> Top Picks
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {featured.map((g) => (
              <GameTile key={g.f} title={g.t} onPlay={() => play(g)} size="lg" />
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/80">
          {dq ? "Results" : "All Games"}
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {visible.map((g) => (
            <GameTile key={g.f} title={g.t} onPlay={() => play(g)} />
          ))}
        </div>
        {visible.length < filtered.length && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setPage((p) => p + 1)}
              className="liquid-glass-themed rounded-full px-6 py-2 text-sm font-medium text-white transition hover:scale-105"
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
          onClose={() => setPlaying(null)}
        />
      )}
    </div>
  );
}