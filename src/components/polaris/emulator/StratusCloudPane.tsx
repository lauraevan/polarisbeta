import { ExternalLink, Cloud, Zap, Info } from "lucide-react";

/**
 * Stratus Cloud pane.
 *
 * Stratus is the same cloud backend several proxy sites (Cherri etc.) use to
 * stream modern/Switch-era titles. Like Afterplay it blocks iframe embedding
 * via X-Frame-Options, so the honest UX is: a curated launcher that opens
 * Stratus in a fresh window. We surface a clean, themed entry-point with the
 * most-played titles, plus a "Browse all" CTA.
 */
const STRATUS_URL = "https://stratus.us.kg";

const POPULAR = [
  { title: "Fortnite", tag: "Battle Royale" },
  { title: "Roblox", tag: "Sandbox" },
  { title: "Minecraft", tag: "Sandbox" },
  { title: "Rocket League", tag: "Sports" },
  { title: "Apex Legends", tag: "Battle Royale" },
  { title: "Genshin Impact", tag: "RPG" },
  { title: "Valorant", tag: "FPS" },
  { title: "League of Legends", tag: "MOBA" },
  { title: "Overwatch 2", tag: "Hero shooter" },
  { title: "GTA V", tag: "Open world" },
  { title: "Elden Ring", tag: "Souls-like" },
  { title: "Cyberpunk 2077", tag: "RPG" },
];

export function StratusCloudPane() {
  function launch(q?: string) {
    const url = q ? `${STRATUS_URL}/?q=${encodeURIComponent(q)}` : STRATUS_URL;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex h-full flex-col gap-3 p-3">
      <div className="liquid-glass-strong flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 px-4 py-2.5 text-xs text-white/75">
        <div className="flex items-center gap-2">
          <Zap className="h-3.5 w-3.5" />
          <span>
            Stratus Cloud — same backend Cherri uses. Stratus blocks in-page
            embedding, so titles launch in a new tab.
          </span>
        </div>
        <button
          onClick={() => launch()}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white hover:bg-white/15"
        >
          <ExternalLink className="h-3 w-3" /> Browse all on Stratus
        </button>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-4">
        {POPULAR.map((g) => (
          <button
            key={g.title}
            onClick={() => launch(g.title)}
            className="group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-4 text-left transition hover:-translate-y-0.5 hover:border-white/30"
          >
            <div className="mb-6 flex items-center justify-between">
              <Cloud className="h-4 w-4 text-white/60" />
              <ExternalLink className="h-3 w-3 text-white/30 opacity-0 transition group-hover:opacity-100" />
            </div>
            <div className="text-sm font-bold text-white">{g.title}</div>
            <div className="mt-0.5 text-[10px] uppercase tracking-widest text-white/45">
              {g.tag}
            </div>
          </button>
        ))}
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] text-white/55">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          Stratus requires a free account on first launch. If the host changes
          domain, the Browse button still points at the current Stratus URL.
        </span>
      </div>
    </div>
  );
}