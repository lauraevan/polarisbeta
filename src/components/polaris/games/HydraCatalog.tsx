import { useDeferredValue, useMemo, useState } from "react";
import { Search, Download, ExternalLink, Cloud } from "lucide-react";
import {
  HYDRA_GAMES,
  steamCover,
  steamUrl,
  hydraDeepLink,
  type HydraGame,
} from "@/lib/hydra-catalog";

const CATS = ["All", "Action", "RPG", "Multiplayer", "Indie", "Horror", "Racing", "Simulation", "Strategy"] as const;

function GameCard({ g, onOpen }: { g: HydraGame; onOpen: (g: HydraGame) => void }) {
  return (
    <button
      onClick={() => onOpen(g)}
      className="group relative aspect-[460/215] w-full overflow-hidden rounded-md border border-white/5 bg-zinc-900/80 text-left transition-transform duration-150 hover:-translate-y-0.5 hover:border-[rgb(var(--polaris-accent))]/60 focus:outline-none will-change-transform"
    >
      <img
        src={steamCover(g.appId)}
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
      />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-3">
        <div className="text-[10px] uppercase tracking-wider text-[rgb(var(--polaris-accent))]">
          {g.category}
        </div>
        <div className="line-clamp-1 text-sm font-bold text-white">{g.title}</div>
      </div>
    </button>
  );
}

function DetailSheet({
  g,
  onClose,
}: {
  g: HydraGame;
  onClose: () => void;
}) {
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
            src={steamCover(g.appId)}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
        </div>
        <div className="space-y-4 px-6 pb-6 pt-2">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-[rgb(var(--polaris-accent))]">
              {g.category} · Hydra Launcher
            </div>
            <h2 className="mt-1 text-2xl font-bold text-white">{g.title}</h2>
            <p className="mt-2 text-sm text-white/70">{g.blurb}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={hydraDeepLink(g.appId, g.title)}
              className="inline-flex items-center gap-2 rounded-md bg-[rgb(var(--polaris-accent))] px-5 py-2.5 text-sm font-semibold text-black transition hover:brightness-110"
            >
              <Download className="h-4 w-4" /> Launch in Hydra
            </a>
            <a
              href={steamUrl(g.appId)}
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
              <Cloud className="h-4 w-4" /> Try Cloud Stream
            </a>
          </div>
          <p className="text-[11px] text-white/45">
            Hydra Launcher is required to download. If it doesn't open
            automatically, install Hydra from{" "}
            <a
              href="https://hydralauncher.gg/"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-white/70"
            >
              hydralauncher.gg
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

export function HydraCatalog() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<(typeof CATS)[number]>("All");
  const [active, setActive] = useState<HydraGame | null>(null);
  const dq = useDeferredValue(q.trim().toLowerCase());

  const filtered = useMemo(
    () =>
      HYDRA_GAMES.filter(
        (g) =>
          (cat === "All" || g.category === cat) &&
          (!dq || g.title.toLowerCase().includes(dq))
      ),
    [dq, cat]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-3 rounded-md border border-white/10 bg-zinc-900/80 px-4 py-3">
          <Search className="h-4 w-4 text-white/50" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Search ${HYDRA_GAMES.length} PC games…`}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {CATS.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wider transition ${
              cat === c
                ? "bg-[rgb(var(--polaris-accent))] text-black"
                : "border border-white/10 bg-white/5 text-white/65 hover:bg-white/10"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((g) => (
          <GameCard key={`${g.appId}-${g.title}`} g={g} onOpen={setActive} />
        ))}
      </div>

      {active && <DetailSheet g={active} onClose={() => setActive(null)} />}
    </div>
  );
}