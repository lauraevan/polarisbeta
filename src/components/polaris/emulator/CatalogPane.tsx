import { useMemo, useState } from "react";
import { Search, Play, Gamepad2 } from "lucide-react";
import { ROM_CATALOG, GENRES, CORES, type CatalogRom } from "@/lib/homebrew-roms";
import { gameIcon } from "@/lib/game-icon";

type Props = {
  onLaunch: (rom: CatalogRom) => void;
};

const CONSOLE_LABEL: Record<CatalogRom["core"], string> = {
  nes: "NES",
  snes: "SNES",
  gb: "GB / GBC",
  gba: "GBA",
  n64: "N64",
  segaMD: "Genesis",
  psx: "PS1",
};

export function CatalogPane({ onLaunch }: Props) {
  const [q, setQ] = useState("");
  const [genre, setGenre] = useState<(typeof GENRES)[number]>("All");
  const [coreFilter, setCoreFilter] = useState<"all" | CatalogRom["core"]>("all");

  const items = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return ROM_CATALOG.filter((r) => {
      if (genre !== "All" && r.genre !== genre) return false;
      if (coreFilter !== "all" && r.core !== coreFilter) return false;
      if (needle && !r.name.toLowerCase().includes(needle) && !r.blurb.toLowerCase().includes(needle))
        return false;
      return true;
    });
  }, [q, genre, coreFilter]);

  return (
    <div className="flex h-full flex-col gap-3 p-3">
      {/* Toolbar */}
      <div className="liquid-glass-strong rounded-xl border border-white/10 p-3">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-white/55" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search the homebrew catalog…"
            className="w-full bg-transparent text-sm text-white placeholder-white/40 focus:outline-none"
          />
          <span className="hidden text-[10px] uppercase tracking-widest text-white/45 sm:inline">
            {items.length} titles
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {GENRES.map((g) => {
            const active = genre === g;
            return (
              <button
                key={g}
                onClick={() => setGenre(g)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                  active
                    ? "bg-white text-black"
                    : "border border-white/10 text-white/70 hover:bg-white/10"
                }`}
              >
                {g}
              </button>
            );
          })}
          <span className="mx-1 hidden h-4 w-px self-center bg-white/15 sm:block" />
          <select
            value={coreFilter}
            onChange={(e) => setCoreFilter(e.target.value as "all" | CatalogRom["core"])}
            className="rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[11px] text-white focus:outline-none"
          >
            <option value="all" className="bg-black">All consoles</option>
            {CORES.map((c) => (
              <option key={c.id} value={c.id} className="bg-black">{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {items.length === 0 ? (
          <div className="grid place-items-center py-16 text-sm text-white/45">
            No titles match those filters.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {items.map((r) => (
              <CatalogCard key={`${r.core}-${r.url}`} rom={r} onLaunch={() => onLaunch(r)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CatalogCard({ rom, onLaunch }: { rom: CatalogRom; onLaunch: () => void }) {
  const ico = gameIcon(rom.name);
  return (
    <button
      onClick={onLaunch}
      className="group relative overflow-hidden rounded-xl border border-white/10 bg-black/35 text-left transition hover:-translate-y-0.5 hover:border-white/30 hover:shadow-[0_18px_50px_-12px_rgba(var(--polaris-accent)/0.45)]"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden">
        {rom.cover ? (
          <img
            src={rom.cover}
            alt={rom.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ background: ico.bg, color: ico.fg }}
          >
            <span className="text-5xl font-black tracking-tighter drop-shadow">
              {ico.mono}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
        <div className="absolute right-2 top-2 rounded-full border border-white/15 bg-black/55 px-2 py-0.5 text-[10px] font-bold text-white/85 backdrop-blur">
          {CONSOLE_LABEL[rom.core]}
        </div>
        <div className="absolute inset-x-0 bottom-0 p-2.5">
          <div className="line-clamp-1 text-[13px] font-bold text-white drop-shadow">
            {rom.name}
          </div>
          <div className="mt-0.5 line-clamp-1 text-[10px] uppercase tracking-widest text-white/55">
            {rom.genre} · {rom.blurb}
          </div>
        </div>
        <div className="absolute inset-0 grid place-items-center opacity-0 transition group-hover:opacity-100">
          <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-black shadow-lg">
            <Play className="h-3.5 w-3.5 fill-black" /> Play
          </span>
        </div>
      </div>
    </button>
  );
}

export function CatalogPaneEmpty() {
  return (
    <div className="grid h-full place-items-center text-white/40">
      <Gamepad2 className="h-10 w-10" />
    </div>
  );
}