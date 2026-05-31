import { useState } from "react";
import { Search, X } from "lucide-react";
import { getPolarisBrowserUrl } from "@/lib/proxy-utils";

type App = { name: string; url: string; category: string };

const APPS: App[] = [
  { name: "YouTube", url: "youtube.com", category: "Media" },
  { name: "Reddit", url: "reddit.com", category: "Social" },
  { name: "Google", url: "google.com", category: "Tools" },
  { name: "TikTok", url: "tiktok.com", category: "Media" },
  { name: "Instagram", url: "instagram.com", category: "Social" },
  { name: "Twitter / X", url: "x.com", category: "Social" },
  { name: "Snapchat", url: "web.snapchat.com", category: "Social" },
  { name: "Spotify", url: "spotify.com", category: "Media" },
  { name: "SoundCloud", url: "soundcloud.com", category: "Media" },
  { name: "Discord", url: "discord.com", category: "Social" },
  { name: "Gemini", url: "gemini.google.com", category: "AI" },
  { name: "ChatGPT", url: "chatgpt.com", category: "AI" },
  { name: "Claude", url: "claude.ai", category: "AI" },
  { name: "Perplexity", url: "perplexity.ai", category: "AI" },
  { name: "Roblox", url: "roblox.com", category: "Games" },
  { name: "Now.gg", url: "now.gg", category: "Games" },
  { name: "Poki", url: "poki.com", category: "Games" },
  { name: "CrazyGames", url: "crazygames.com", category: "Games" },
  { name: "GitHub", url: "github.com", category: "Tools" },
  { name: "Notion", url: "notion.so", category: "Tools" },
  { name: "Drive", url: "drive.google.com", category: "Tools" },
  { name: "Gmail", url: "mail.google.com", category: "Tools" },
  { name: "Twitch", url: "twitch.tv", category: "Media" },
  { name: "Netflix", url: "netflix.com", category: "Media" },
];

export function Launchpad({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("All");
  const cats = ["All", ...Array.from(new Set(APPS.map((a) => a.category)))];
  const visible = APPS.filter(
    (a) => (cat === "All" || a.category === cat) && a.name.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div
      onClick={onClose}
      className={`fixed inset-0 z-40 flex items-end justify-center px-3 pb-24 transition-all duration-300 sm:items-center sm:pb-4 ${
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
      style={{ backdropFilter: open ? "blur(18px)" : undefined, background: open ? "rgba(0,0,0,0.55)" : "transparent" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/90 p-5 shadow-2xl transition-all duration-300 ${
          open ? "translate-y-0 scale-100" : "translate-y-8 scale-95"
        }`}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white">Launcher</div>
            <div className="text-[11px] text-white/45">{visible.length} apps</div>
          </div>
          <div className="flex flex-1 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-1.5">
            <Search className="h-3.5 w-3.5 text-white/40" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search apps"
              className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/35 focus:outline-none"
            />
            </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 flex flex-wrap gap-1.5">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${
                cat === c
                  ? "bg-white text-black"
                  : "border border-white/10 bg-white/[0.03] text-white/65 hover:bg-white/10 hover:text-white"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div
          className="grid max-h-[60vh] gap-3 overflow-y-auto pr-1"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(84px, 1fr))" }}
        >
          {visible.map((a) => (
            <a
              key={a.name}
              href={getPolarisBrowserUrl("uv", a.url)}
              target="_blank"
              rel="noreferrer"
              className="group flex flex-col items-center gap-2 rounded-2xl p-2 transition hover:bg-white/[0.05]"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] transition group-hover:-translate-y-0.5 group-hover:border-white/25 group-hover:bg-white/[0.08]">
                <img
                  src={`https://www.google.com/s2/favicons?domain=${a.url}&sz=128`}
                  alt=""
                  className="h-7 w-7 rounded"
                />
              </div>
              <div className="truncate text-[11px] font-medium text-white/80">{a.name}</div>
            </a>
          ))}
          {visible.length === 0 && (
            <div className="col-span-full py-10 text-center text-xs text-white/40">No apps match "{q}"</div>
          )}
        </div>
      </div>
    </div>
  );
}