import { X } from "lucide-react";

type App = { name: string; url: string };

const APPS: App[] = [
  { name: "YouTube", url: "youtube.com" },
  { name: "Reddit", url: "reddit.com" },
  { name: "Google", url: "google.com" },
  { name: "TikTok", url: "tiktok.com" },
  { name: "Instagram", url: "instagram.com" },
  { name: "Spotify", url: "spotify.com" },
  { name: "Discord", url: "discord.com" },
  { name: "Gemini", url: "gemini.google.com" },
  { name: "ChatGPT", url: "chatgpt.com" },
  { name: "Roblox", url: "roblox.com" },
  { name: "Now.gg", url: "now.gg" },
];

export function Launchpad({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      className={`fixed inset-0 z-40 flex items-end justify-center px-4 pb-24 transition-all duration-300 ${
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
      style={{ backdropFilter: open ? "blur(14px)" : undefined, background: open ? "rgba(0,0,0,0.35)" : "transparent" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`liquid-glass-strong relative w-full max-w-3xl overflow-hidden rounded-3xl p-5 transition-all duration-300 ${
          open ? "translate-y-0 scale-100" : "translate-y-8 scale-95"
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-white">All Apps</div>
            <div className="text-[11px] text-white/55">
              Quick launch · <span className="text-white/70">WIP</span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div
          className="grid justify-center gap-4"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(88px, 100px))" }}
        >
          {APPS.map((a) => (
            <a
              key={a.name}
              href={`https://${a.url}`}
              target="_blank"
              rel="noreferrer"
              className="group flex flex-col items-center gap-2"
            >
              <div className="liquid-glass shortcut-card flex h-16 w-16 items-center justify-center rounded-2xl">
                <img
                  src={`https://www.google.com/s2/favicons?domain=${a.url}&sz=128`}
                  alt=""
                  className="h-8 w-8 rounded"
                />
              </div>
              <div className="text-[11px] font-medium text-white/85">{a.name}</div>
            </a>
          ))}

          {/* Coming soon placeholders */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 opacity-50">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-white/15">
                <span className="text-[10px] uppercase tracking-wider text-white/40">Soon</span>
              </div>
              <div className="text-[11px] font-medium text-white/40">—</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}