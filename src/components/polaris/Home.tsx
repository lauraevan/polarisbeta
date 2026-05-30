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
    <div className="mx-auto w-full max-w-5xl px-5 py-8 md:px-10 md:py-10">
      {/* Header */}
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">👋</span>
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-white/50">Welcome back</div>
            <h1 className="text-2xl font-semibold text-white">
              Player <span className="text-white/40">·</span>{" "}
              <span
                style={{ color: `rgb(var(--polaris-accent))` }}
              >Polaris One</span>
            </h1>
          </div>
        </div>
        <img src={logo} alt="" className="h-8 w-8 opacity-90 md:h-10 md:w-10" />
      </header>

      {/* Search bars */}
      <div className="space-y-3">
        <div className="glass flex items-center gap-3 rounded-2xl px-5 py-4">
          <Search className="h-5 w-5 text-white/50" />
          <input
            placeholder="Search or type a URL…"
            className="flex-1 bg-transparent text-base text-white placeholder:text-white/40 focus:outline-none"
          />
          <kbd className="hidden rounded-md border border-white/15 px-1.5 py-0.5 text-[10px] text-white/50 md:inline">↵</kbd>
        </div>
        <div className="glass-soft flex items-center gap-3 rounded-2xl px-5 py-3">
          <Command className="h-4 w-4 text-white/50" />
          <input
            placeholder="Quickly navigate…"
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
          />
          <kbd className="hidden rounded-md border border-white/15 px-1.5 py-0.5 text-[10px] text-white/50 md:inline">⌘ K</kbd>
        </div>
      </div>

      {/* Categories */}
      <div className="mt-7 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => {
          const isOn = c === active;
          return (
            <button
              key={c}
              onClick={() => setActive(c)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
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
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {visible.map((s) => (
          <a
            key={s.name}
            href={`https://${s.url}`}
            target="_blank"
            rel="noreferrer"
            className="group glass relative flex aspect-[4/4.6] flex-col items-center justify-center gap-3 rounded-2xl p-4 text-center transition-transform hover:-translate-y-0.5"
            style={{ transition: "all 200ms ease" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = `0 20px 40px -16px rgba(var(--polaris-accent)/0.55), inset 0 0 0 1px rgba(var(--polaris-accent)/0.45)`;
            }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = ""; }}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
              <img
                src={`https://www.google.com/s2/favicons?domain=${s.url}&sz=128`}
                alt={s.name}
                className="h-9 w-9 rounded-md"
              />
            </div>
            <div className="text-sm font-medium text-white/90">{s.name}</div>
          </a>
        ))}
      </div>
    </div>
  );
}