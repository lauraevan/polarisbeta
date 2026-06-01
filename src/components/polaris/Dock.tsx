import { useEffect, useRef, useState } from "react";
import { Compass, SlidersHorizontal, Signal, Wifi, LayoutGrid, GripVertical, Sun, Moon, Droplets, Square } from "lucide-react";
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
  const { dockSize, dockPins, defaultEngine, dockPosition, setDockPosition, uiTheme, setUITheme, liquidGlass, setLiquidGlass } = useTheme();
  const [dragging, setDragging] = useState(false);
  const dragX = useRef<number | null>(null);

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

  // Snap dock to nearest third based on pointer X
  function snapFromX(x: number) {
    if (typeof window === "undefined") return;
    const w = window.innerWidth;
    if (x < w / 3) setDockPosition("left");
    else if (x > (w * 2) / 3) setDockPosition("right");
    else setDockPosition("center");
  }

  function onGripDown(e: React.PointerEvent) {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(true);
    dragX.current = e.clientX;
  }
  function onGripMove(e: React.PointerEvent) {
    if (!dragging) return;
    dragX.current = e.clientX;
    snapFromX(e.clientX);
  }
  function onGripUp(e: React.PointerEvent) {
    if (!dragging) return;
    setDragging(false);
    if (dragX.current != null) snapFromX(dragX.current);
    dragX.current = null;
  }

  return (
    <>
      <Launchpad open={launchpadOpen} onClose={() => setLaunchpadOpen(false)} />
      <div
        className="pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center px-4"
      >
        <div
          className="pointer-events-auto flex items-center gap-1.5 transform-gpu will-change-transform [backface-visibility:hidden]"
          style={{
            transform: `scale(${dockSize}) translateZ(0)`,
            transformOrigin: "bottom center",
            transition: dragging ? "none" : "transform 220ms cubic-bezier(.2,.7,.2,1)",
          }}
        >
          {/* Left grip — drag to reposition */}
          <button
            onPointerDown={onGripDown}
            onPointerMove={onGripMove}
            onPointerUp={onGripUp}
            onPointerCancel={onGripUp}
            aria-label="Drag dock"
            title="Drag to move dock"
            className={`liquid-glass-ghost grid h-9 w-5 cursor-grab place-items-center rounded-l-xl touch-none ${
              dragging ? "cursor-grabbing text-white" : "text-white/55 hover:text-white"
            }`}
          >
            <GripVertical className="h-4 w-4 pointer-events-none" />
          </button>

          <div className="liquid-glass flex max-w-[calc(100vw-6rem)] items-center gap-3 overflow-x-auto rounded-2xl px-3 py-2 sm:gap-4 sm:px-4">
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
        <button
          onClick={() => setUITheme(uiTheme === "dark" ? "light" : "dark")}
          className="rounded-lg p-1.5 text-white/80 transition hover:bg-white/10 hover:text-white"
          aria-label="Toggle theme"
          title={uiTheme === "dark" ? "Switch to light" : "Switch to dark"}
        >
          {uiTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <button
          onClick={() => setLiquidGlass(!liquidGlass)}
          className="rounded-lg p-1.5 text-white/80 transition hover:bg-white/10 hover:text-white"
          aria-label="Toggle Liquid Glass"
          title={liquidGlass ? "Disable Liquid Glass" : "Enable Liquid Glass"}
        >
          {liquidGlass ? <Square className="h-4 w-4" /> : <Droplets className="h-4 w-4" />}
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

          {/* Right grip — same drag handle on the opposite side for ambidextrous use */}
          <button
            onPointerDown={onGripDown}
            onPointerMove={onGripMove}
            onPointerUp={onGripUp}
            onPointerCancel={onGripUp}
            aria-label="Drag dock"
            title="Drag to move dock"
            className={`liquid-glass-ghost grid h-9 w-5 cursor-grab place-items-center rounded-r-xl touch-none ${
              dragging ? "cursor-grabbing text-white" : "text-white/55 hover:text-white"
            }`}
          >
            <GripVertical className="h-4 w-4 pointer-events-none" />
          </button>
        </div>
      </div>
    </>
  );
}