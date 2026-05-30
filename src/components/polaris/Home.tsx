import { useState } from "react";
import { Search, Command } from "lucide-react";
import logo from "@/assets/polaris-logo.png";

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

const POPULAR_NAMES = new Set(["YouTube", "Reddit", "Google", "TikTok", "Instagram", "Spotify", "Discord"]);
const CATEGORIES: (Category | "Popular")[] = ["Popular", "Games", "AI Tools", "Websites", "Media", "Apps"];

export function Home() {
  const [active, setActive] = useState<(typeof CATEGORIES)[number]>("Popular");

  const visible = SHORTCUTS.filter((s) =>
    active === "Popular" ? POPULAR_NAMES.has(s.name) : s.category === active
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10 md:px-12 md:py-14">
      {/* Header */}
      <header className="mb-10 flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-white/55">Welcome back</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Player <span className="text-white/35">·</span>{" "}
            <span style={{ color: `rgb(var(--polaris-accent))` }}>Polaris One</span>
          </h1>
        </div>
        <img src={logo} alt="" className="h-10 w-10 opacity-90 md:h-12 md:w-12" />
      </header>

      {/* Search bars */}
      <div className="space-y-3">
        <div className="glass flex items-center gap-3 rounded-2xl px-5 py-4 transition-shadow duration-300 focus-within:shadow-[0_0_0_1px_rgba(var(--polaris-accent)/0.5)]">
          <Search className="h-5 w-5 text-white/50" />
          <input
            placeholder="Search or type a URL…"
            className="flex-1 bg-transparent text-base text-white placeholder:text-white/40 focus:outline-none"
          />
          <kbd className="hidden rounded-md border border-white/15 px-1.5 py-0.5 text-[10px] text-white/50 md:inline">↵</kbd>
        </div>
        <div className="glass-soft flex items-center gap-3 rounded-2xl px-5 py-3 transition-shadow duration-300 focus-within:shadow-[0_0_0_1px_rgba(var(--polaris-accent)/0.4)]">
          <Command className="h-4 w-4 text-white/50" />
          <input
            placeholder="Quickly navigate…"
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
          />
          <kbd className="hidden rounded-md border border-white/15 px-1.5 py-0.5 text-[10px] text-white/50 md:inline">⌘ K</kbd>
        </div>
      </div>

      {/* Categories */}
      <div className="mt-8 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => {
          const isOn = c === active;
          return (
            <button
              key={c}
              onClick={() => setActive(c)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 ${
                isOn ? "text-white" : "text-white/60 hover:text-white"
              }`}
              style={
                isOn
                  ? {
                      background: `rgba(var(--polaris-accent)/0.22)`,
                      boxShadow: `inset 0 0 0 1px rgba(var(--polaris-accent)/0.55), 0 8px 24px -8px rgba(var(--polaris-accent)/0.55)`,
                    }
                  : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }
              }
            >
              {c}
            </button>
          );
        })}
      </div>

      {/* Shortcuts grid */}
      <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 md:gap-6 lg:grid-cols-4">
        {visible.map((s) => (
          <a
            key={s.name}
            href={`https://${s.url}`}
            target="_blank"
            rel="noreferrer"
            className="glass shortcut-card relative flex aspect-[5/6] flex-col items-center justify-center gap-4 rounded-3xl p-5 text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.06] ring-1 ring-white/10">
              <img
                src={`https://www.google.com/s2/favicons?domain=${s.url}&sz=128`}
                alt={s.name}
                className="h-10 w-10 rounded-md"
              />
            </div>
            <div className="text-[15px] font-medium text-white/90">{s.name}</div>
          </a>
        ))}
      </div>
    </div>
  );
}