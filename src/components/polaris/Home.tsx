import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { getPolarisBrowserUrl, normalizeUrl } from "@/lib/proxy-utils";
import { useTheme } from "@/lib/theme-context";
import { PolarisAI } from "./ai/PolarisAI";

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
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState<0 | 1>(0);
  const { homeAISwipe } = useTheme();

  // Track which page is centered after a swipe/scroll
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      const idx = Math.round(el.scrollLeft / el.clientWidth);
      setPage(idx === 1 ? 1 : 0);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  function goTo(p: 0 | 1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: p * el.clientWidth, behavior: "smooth" });
  }

  if (!homeAISwipe) {
    return (
      <div className="relative">
        <HomeWeb />
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Horizontal snap-scroller: page 0 = web hub, page 1 = AI hub */}
      <div
        ref={scrollerRef}
        className="flex h-[calc(100vh-32px)] snap-x snap-mandatory overflow-x-auto overflow-y-hidden scroll-smooth"
        style={{ scrollbarWidth: "none" }}
      >
        <section className="min-w-full shrink-0 snap-center overflow-y-auto">
          <HomeWeb />
        </section>
        <section className="min-w-full shrink-0 snap-center overflow-hidden">
          <PolarisAI />
        </section>
      </div>

      {/* Page indicator / quick toggle */}
      <div className="pointer-events-none fixed left-1/2 top-3 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/10 bg-black/30 px-2 py-1 backdrop-blur">
        {([0, 1] as const).map((i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={i === 0 ? "Web hub" : "AI hub"}
            className={`pointer-events-auto h-1.5 rounded-full transition-all ${
              page === i ? "w-6 bg-white" : "w-1.5 bg-white/35 hover:bg-white/55"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function HomeWeb() {
  const [active, setActive] = useState<(typeof CATEGORIES)[number]>("Popular");
  const { defaultEngine, shortcutSize } = useTheme();
  const engine = defaultEngine;
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
            gridTemplateColumns: `repeat(auto-fit, minmax(${Math.round(60 * shortcutSize)}px, ${Math.round(70 * shortcutSize)}px))`,
            justifyContent: "center",
          }}
        >
          {visible.map((s) => (
            <a
              key={s.name}
              href={getPolarisBrowserUrl(engine, s.url)}
              target="_blank"
              rel="noreferrer"
              className="liquid-glass-ghost shortcut-card group flex aspect-square flex-col items-center justify-center gap-1 rounded-xl p-1.5 text-center"
            >
              <img
                src={`https://www.google.com/s2/favicons?domain=${s.url}&sz=128`}
                alt={s.name}
                className="h-5 w-5 rounded"
              />
              <div className="text-[9px] font-medium leading-tight text-white/85">{s.name}</div>
            </a>
          ))}
        </div>
      </div>

      {/* T9 partner shout-out */}
      <div className="mt-10 flex flex-col items-center gap-1.5 pt-6">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white"
          style={{
            background: "rgba(var(--polaris-accent)/0.18)",
            boxShadow: "inset 0 0 0 1px rgba(var(--polaris-accent)/0.55)",
          }}
        >
          ★ T9 is the best
        </span>
        <a
          href="https://t9os.space"
          target="_blank"
          rel="noreferrer"
          className="text-[10px] text-white/55 underline decoration-white/20 underline-offset-4 transition hover:text-white"
        >
          Support T9 at t9os.space — our partner OS
        </a>
      </div>
    </div>
  );
}