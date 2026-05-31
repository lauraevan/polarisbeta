import { useEffect, useState } from "react";
import { Compass, SlidersHorizontal, Signal, Wifi, LayoutGrid, ChevronLeft, ChevronRight, GripVertical } from "lucide-react";
import logo from "@/assets/polaris-logo.png";
import { Launchpad } from "./Launchpad";
import { Link } from "@tanstack/react-router";
import { useTheme } from "@/lib/theme-context";
import { getPolarisBrowserUrl } from "@/lib/proxy-utils";

// Mirror of the launcher catalog — keep in sync with Launchpad
const PIN_CATALOG: Record<string, string> = {
  YouTube: "youtube.com", Reddit: "reddit.com", Google: "google.com", TikTok: "tiktok.com",
  Instagram: "instagram.com", "Twitter / X": "x.com", Snapchat: "web.snapchat.com",
  Spotify: "spotify.com", SoundCloud: "soundcloud.com", Discord: "discord.com",
  Gemini: "gemini.google.com", ChatGPT: "chatgpt.com", Claude: "claude.ai",
  Perplexity: "perplexity.ai", Roblox: "roblox.com", "Now.gg": "now.gg",
  Poki: "poki.com", CrazyGames: "crazygames.com", GitHub: "github.com",
  Notion: "notion.so", Drive: "drive.google.com", Gmail: "mail.google.com",
  Twitch: "twitch.tv", Netflix: "netflix.com",
};

export function Dock({ onOpenWallpaper }: { onOpenWallpaper: () => void }) {
  const [now, setNow] = useState<Date | null>(null);
  const [launchpadOpen, setLaunchpadOpen] = useState(false);
  const { dockSize, dockPins, defaultEngine, dockPosition, setDockPosition } = useTheme();

  useEffect(() => {
    // Only run on the client to avoid SSR/CSR hydration mismatch.
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(id);
  }, []);

  const time = now
    ? now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : "--:--";
  const date = now
    ? now.toLocaleDateString([], { month: "long", day: "numeric" })
    : "";

  return (
    <>
      <Launchpad open={launchpadOpen} onClose={() => setLaunchpadOpen(false)} />
      <div
        className={`pointer-events-none fixed inset-x-0 bottom-4 z-30 flex px-4 ${
          dockPosition === "left" ? "justify-start" : dockPosition === "right" ? "justify-end" : "justify-center"
        }`}
      >
        <div
          className="pointer-events-auto flex items-center gap-1.5"
          style={{
            transform: `scale(${dockSize})`,
            transformOrigin:
              dockPosition === "left" ? "bottom left" : dockPosition === "right" ? "bottom right" : "bottom center",
          }}
        >
          {/* Left handle: shift dock left */}
          <button
            onClick={() => setDockPosition(dockPosition === "right" ? "center" : "left")}
            aria-label="Move dock left"
            title="Move dock left"
            className="liquid-glass-ghost grid h-8 w-5 place-items-center rounded-l-xl text-white/55 hover:text-white disabled:opacity-30"
            disabled={dockPosition === "left"}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>

          <div className="liquid-glass-themed flex max-w-[calc(100vw-6rem)] items-center gap-3 overflow-x-auto rounded-2xl px-3 py-2 sm:gap-4 sm:px-4">
            {/* Drag-grip indicator (decorative) */}
            <GripVertical className="h-4 w-4 shrink-0 text-white/30" />
        {/* Brand */}
        <div className="flex items-center gap-2 pr-1 sm:pr-2">
          <img src={logo} alt="Polaris One" className="h-7 w-7 rounded-lg object-contain" />
        </div>

        <span className="h-6 w-px bg-white/15" />

        {/* Launchpad — opens the all-apps overlay */}
        <button
          onClick={() => setLaunchpadOpen((o) => !o)}
          aria-label="Launchpad"
          className={`rounded-lg p-1.5 transition hover:bg-white/10 hover:text-white ${
            launchpadOpen ? "bg-white/15 text-white" : "text-white/80"
          }`}
        >
          <LayoutGrid className="h-4 w-4" />
        </button>

        {/* Quick controls */}
        <Link to="/browser" className="rounded-lg p-1.5 text-white/80 transition hover:bg-white/10 hover:text-white" aria-label="Polaris Browser">
          <Compass className="h-4 w-4" />
        </Link>
        <button onClick={onOpenWallpaper} className="rounded-lg p-1.5 text-white/80 transition hover:bg-white/10 hover:text-white" aria-label="Change wallpaper">
          <SlidersHorizontal className="h-4 w-4" />
        </button>

        {/* Pinned shortcuts */}
        {dockPins.length > 0 && <span className="h-6 w-px bg-white/15" />}
        {dockPins.map((name) => {
          const url = PIN_CATALOG[name];
          if (!url) return null;
          return (
            <a
              key={name}
              href={getPolarisBrowserUrl(defaultEngine, url)}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg p-1 text-white/80 transition hover:bg-white/10"
              title={name}
            >
              <img
                src={`https://www.google.com/s2/favicons?domain=${url}&sz=64`}
                alt={name}
                className="h-5 w-5 rounded"
              />
            </a>
          );
        })}

        {/* Network */}
        <div className="hidden items-center gap-1.5 text-white/85 sm:flex">
          <Signal className="h-4 w-4" />
          <span className="text-[11px] font-medium tabular-nums">13ms</span>
        </div>
        <Wifi className="hidden h-4 w-4 text-white/85 sm:block" />

        <span className="hidden h-6 w-px bg-white/15 sm:block" />

        {/* Clock */}
        <div className="flex flex-col items-end leading-tight" suppressHydrationWarning>
          <span className="text-[13px] font-semibold text-white tabular-nums" suppressHydrationWarning>{time}</span>
          <span className="text-[10px] text-white/60" suppressHydrationWarning>{date}</span>
        </div>
          </div>

          {/* Right handle: shift dock right */}
          <button
            onClick={() => setDockPosition(dockPosition === "left" ? "center" : "right")}
            aria-label="Move dock right"
            title="Move dock right"
            className="liquid-glass-ghost grid h-8 w-5 place-items-center rounded-r-xl text-white/55 hover:text-white disabled:opacity-30"
            disabled={dockPosition === "right"}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </>
  );
}