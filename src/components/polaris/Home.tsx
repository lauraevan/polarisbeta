import { useState } from "react";
import { Search } from "lucide-react";

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
    <div className="mx-auto flex min-h-[calc(100vh-96px)] w-full max-w-2xl flex-col items-center justify-center px-5 py-10">
      {/* Compact title */}
      <div className="mb-6 text-center">
        <div className="text-[10px] uppercase tracking-[0.32em] text-white/60">Polaris One</div>
      </div>

      {/* Single centered search */}
      <div className="liquid-glass flex w-full max-w-xl items-center gap-3 rounded-2xl px-4 py-3 transition-shadow duration-300 focus-within:shadow-[0_0_0_1px_rgba(var(--polaris-accent)/0.6),0_20px_50px_-20px_rgba(var(--polaris-accent)/0.45)]">
        <Search className="h-4 w-4 text-white/60" />
        <input
          placeholder="Search the web or enter a URL"
          className="flex-1 bg-transparent text-sm text-white placeholder:text-white/50 focus:outline-none"
        />
        <kbd className="hidden rounded-md border border-white/15 px-1.5 py-0.5 text-[10px] text-white/55 md:inline">↵</kbd>
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

      {/* Compact see-through shortcuts */}
      <div className="mt-5 grid w-full max-w-xl grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-6">
        {visible.map((s) => (
          <a
            key={s.name}
            href={`https://${s.url}`}
            target="_blank"
            rel="noreferrer"
            className="liquid-glass shortcut-card group flex aspect-square flex-col items-center justify-center gap-1.5 rounded-2xl p-2 text-center"
          >
            <img
              src={`https://www.google.com/s2/favicons?domain=${s.url}&sz=128`}
              alt={s.name}
              className="h-6 w-6 rounded"
            />
            <div className="text-[10px] font-medium text-white/85 leading-tight">{s.name}</div>
          </a>
        ))}
      </div>
    </div>
  );
}