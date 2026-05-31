import { useState } from "react";
import { ExternalLink, Cloud, Search, Info } from "lucide-react";
import { SWITCH_TITLES, type SwitchTitle } from "@/lib/homebrew-roms";

/**
 * Switch streaming pane — fully custom UI.
 *
 * Reality check: there is no public API for Switch emulation. Afterplay is a
 * closed cloud service that actively refuses iframe embedding (X-Frame-Options).
 * So instead of a broken iframe we present a curated catalog with real cover
 * art and launch the game's Afterplay search in a new window. The user picks
 * the title in Afterplay and plays — no in-page embedding promises that don't
 * work.
 */
export function SwitchCloudPane() {
  const [query, setQuery] = useState("");

  const filtered = SWITCH_TITLES.filter((g) =>
    g.title.toLowerCase().includes(query.toLowerCase()),
  );

  function launch(g: SwitchTitle) {
    const url = `https://www.afterplay.io/?q=${encodeURIComponent(g.title)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex h-full flex-col gap-3 p-3">
      {/* Honest banner */}
      <div className="liquid-glass-strong flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 px-4 py-2.5 text-xs text-white/75">
        <div className="flex items-center gap-2">
          <Cloud className="h-3.5 w-3.5" />
          <span>
            Modern Switch library. Streamed by Afterplay — clicking a game opens
            it in a new tab (they block in-page embedding).
          </span>
        </div>
        <a
          href="https://www.afterplay.io"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-white/10"
        >
          <ExternalLink className="h-3 w-3" /> Afterplay home
        </a>
      </div>

      <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
        <Search className="h-3.5 w-3.5 text-white/50" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Switch games…"
          className="w-full bg-transparent text-sm text-white placeholder-white/40 focus:outline-none"
        />
      </label>

      <div className="grid min-h-0 flex-1 grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {filtered.map((g) => (
          <button
            key={g.title}
            onClick={() => launch(g)}
            className="group relative overflow-hidden rounded-xl border border-white/10 bg-black/30 text-left transition hover:border-white/30 hover:-translate-y-0.5"
          >
            <div className="relative aspect-[3/4] w-full overflow-hidden">
              <img
                src={g.cover}
                alt={g.title}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  const el = e.currentTarget as HTMLImageElement;
                  el.style.display = "none";
                }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.85))",
                }}
              />
              <div className="absolute inset-x-0 bottom-0 p-2.5">
                <div className="text-[12px] font-bold leading-tight text-white drop-shadow">
                  {g.title}
                </div>
                <div className="mt-0.5 text-[10px] uppercase tracking-widest text-white/55">
                  {g.tag} · {g.year}
                </div>
              </div>
              <div
                className="absolute right-2 top-2 rounded-full border border-white/15 bg-black/55 p-1 opacity-0 transition group-hover:opacity-100"
              >
                <ExternalLink className="h-3 w-3 text-white" />
              </div>
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full grid place-items-center py-12 text-xs text-white/45">
            No games match “{query}”.
          </div>
        )}
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] text-white/55">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          No browser-native Switch emulator exists today. Vela's WebGPU prototype
          is offline. Afterplay is the only realistic streaming option — and yes,
          it requires their account.
        </span>
      </div>
    </div>
  );
}