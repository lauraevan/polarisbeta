import { useState } from "react";
import { Search, Shield, Zap } from "lucide-react";
import { getPolarisBrowserUrl, normalizeUrl, type ProxyEngine } from "@/lib/proxy-utils";
import { useTheme } from "@/lib/theme-context";

type Shortcut = { name: string; url: string; category: Category };
type Category = "Popular" | "Games" | "AI Tools" | "Websites" | "Media" | "Apps";

const SHORTCUTS: Shortcut[] = [
  { name: "YouTube", url: "youtube.com", category: "Media" },
  { name: "Reddit", url: "reddit.com", category: "Websites" },
  { name: "Google", url: "google.com", category: "Websites" },
  { name: "TikTok", url: "tiktok.com", category: "Media" },
  { name: "Instagram", url: "instagram.com", category: "Media" },
  { name: "Spotify", url: "spotify.com", category: "Media" },
  { name: "Discord", url: "discord.com", category: "Apps" },
  { name: "Gemini", url: "gemini.google.com", category: "AI Tools" },
  { name: "ChatGPT", url: "chatgpt.com", category: "AI Tools" },
  { name: "Roblox", url: "roblox.com", category: "Games" },
  { name: "Now.gg", url: "now.gg", category: "Games" },
];

const POPULAR_NAMES = new Set([
  "YouTube", "Reddit", "Google", "TikTok", "Instagram", "Spotify", "Discord",
]);
const CATEGORIES: (Category | "Popular")[] = ["Popular", "Games", "AI Tools", "Websites", "Media", "Apps"];

export function Home() {
  const [active, setActive] = useState<(typeof CATEGORIES)[number]>("Popular");
  const { defaultEngine, setDefaultEngine, shortcutSize } = useTheme();
  const engine = defaultEngine;
  const setEngine = (e: ProxyEngine) => setDefaultEngine(e);
  const [query, setQuery] = useState("");

  const visible = SHORTCUTS.filter((s) =>
    active === "Popular" ? POPULAR_NAMES.has(s.name) : s.category === active
  );

  return (
    <div className="mx-auto flex min-h-[calc(100vh-96px)] w-full max-w-2xl flex-col items-center justify-center px-5 py-10">
      {/* Compact title */}
      <div className="mb-6 text-center">
        <div className="text-[10px] uppercase tracking-[0.32em] text-white/70">Polaris One</div>
        <div className="mt-1 text-[11px] text-white/45">Your warm cinematic web hub</div>
      </div>

      {/* Single centered search */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          window.open(getPolarisBrowserUrl(engine, normalizeUrl(query)), "_blank", "noopener,noreferrer");
        }}
        className="liquid-glass-ghost flex w-full max-w-xl items-center gap-3 rounded-2xl px-4 py-3 transition-shadow duration-300 focus-within:shadow-[0_0_0_1px_rgba(var(--polaris-accent)/0.6),0_20px_50px_-20px_rgba(var(--polaris-accent)/0.45)]"
      >
        <Search className="h-4 w-4 text-white/60" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the web or enter a URL"
          className="flex-1 bg-transparent text-sm text-white placeholder:text-white/50 focus:outline-none"
        />
        <kbd className="hidden rounded-md border border-white/15 px-1.5 py-0.5 text-[10px] text-white/55 md:inline">↵</kbd>
      </form>

      <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl border border-white/8 bg-black/15 p-1 text-xs font-bold">
        {(["uv", "scramjet"] as const).map((next) => (
          <button
            key={next}
            onClick={() => setEngine(next)}
            className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2 ${
              engine === next ? "bg-white text-black" : "text-white/65 hover:bg-white/10 hover:text-white"
            }`}
          >
            {next === "uv" ? <Shield className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5" />}
            {next === "uv" ? "Ultraviolet" : "Scramjet"}
          </button>
        ))}
      </div>

      {/* Categories */}
      <div className="mt-5 flex flex-wrap justify-center gap-1.5">
        {CATEGORIES.map((c) => {
          const isOn = c === active;
          return (
            <button
              key={c}
              onClick={() => setActive(c)}
              className={`rounded-full px-3 py-1 text-[11px] font-medium transition-all duration-200 ${
                isOn ? "text-white" : "text-white/65 hover:text-white"
              }`}
              style={
                isOn
                  ? {
                      background: `rgba(var(--polaris-accent)/0.22)`,
                      boxShadow: `inset 0 0 0 1px rgba(var(--polaris-accent)/0.55)`,
                    }
                  : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)" }
              }
            >
              {c}
            </button>
          );
        })}
      </div>

      {/* Shortcuts — auto-centering responsive grid */}
      <div className="mt-5 flex w-full justify-center">
        <div
          className="grid w-full justify-center gap-3"
          style={{
            gridTemplateColumns: `repeat(auto-fit, minmax(${Math.round(76 * shortcutSize)}px, ${Math.round(88 * shortcutSize)}px))`,
            justifyContent: "center",
          }}
        >
          {visible.map((s) => (
            <a
              key={s.name}
              href={getPolarisBrowserUrl(engine, s.url)}
              target="_blank"
              rel="noreferrer"
              className="liquid-glass-ghost shortcut-card group flex aspect-square flex-col items-center justify-center gap-1.5 rounded-2xl p-2 text-center"
            >
              <img
                src={`https://www.google.com/s2/favicons?domain=${s.url}&sz=128`}
                alt={s.name}
                className="h-6 w-6 rounded"
              />
              <div className="text-[10px] font-medium leading-tight text-white/85">{s.name}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}