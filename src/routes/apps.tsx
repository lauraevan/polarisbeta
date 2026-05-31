import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/polaris/AppShell";
import { useState } from "react";
import { Search } from "lucide-react";
import { getPolarisBrowserUrl } from "@/lib/proxy-utils";
import { useTheme } from "@/lib/theme-context";

type App = { name: string; url: string; category: string; tagline?: string };
const APPS: App[] = [
  // Social
  { name: "YouTube", url: "youtube.com", category: "Media", tagline: "Videos for everyone" },
  { name: "TikTok", url: "tiktok.com", category: "Media", tagline: "Short-form video" },
  { name: "Twitch", url: "twitch.tv", category: "Media", tagline: "Live streaming" },
  { name: "Netflix", url: "netflix.com", category: "Media", tagline: "Movies & TV" },
  { name: "Spotify", url: "spotify.com", category: "Media", tagline: "Music streaming" },
  { name: "SoundCloud", url: "soundcloud.com", category: "Media", tagline: "Indie audio" },
  { name: "Apple Music", url: "music.apple.com", category: "Media", tagline: "Apple's library" },
  // Social
  { name: "Reddit", url: "reddit.com", category: "Social", tagline: "Communities" },
  { name: "Instagram", url: "instagram.com", category: "Social", tagline: "Photos & reels" },
  { name: "Twitter / X", url: "x.com", category: "Social", tagline: "Real-time chatter" },
  { name: "Snapchat", url: "web.snapchat.com", category: "Social", tagline: "Snaps & chats" },
  { name: "Discord", url: "discord.com", category: "Social", tagline: "Chat with friends" },
  { name: "Pinterest", url: "pinterest.com", category: "Social", tagline: "Visual ideas" },
  // AI
  { name: "ChatGPT", url: "chatgpt.com", category: "AI", tagline: "OpenAI assistant" },
  { name: "Gemini", url: "gemini.google.com", category: "AI", tagline: "Google's AI" },
  { name: "Claude", url: "claude.ai", category: "AI", tagline: "Anthropic AI" },
  { name: "Perplexity", url: "perplexity.ai", category: "AI", tagline: "AI search" },
  { name: "Grok", url: "grok.com", category: "AI", tagline: "xAI chat" },
  { name: "DeepSeek", url: "chat.deepseek.com", category: "AI", tagline: "Open reasoning" },
  // Games
  { name: "Roblox", url: "roblox.com", category: "Games", tagline: "Online platform" },
  { name: "Now.gg", url: "now.gg", category: "Games", tagline: "Cloud Android" },
  { name: "Poki", url: "poki.com", category: "Games", tagline: "Browser games" },
  { name: "CrazyGames", url: "crazygames.com", category: "Games", tagline: "Free browser games" },
  { name: "itch.io", url: "itch.io", category: "Games", tagline: "Indie games" },
  { name: "Kongregate", url: "kongregate.com", category: "Games", tagline: "Casual classics" },
  // Productivity
  { name: "Google", url: "google.com", category: "Productivity", tagline: "Search" },
  { name: "Gmail", url: "mail.google.com", category: "Productivity", tagline: "Email" },
  { name: "Drive", url: "drive.google.com", category: "Productivity", tagline: "Storage" },
  { name: "Docs", url: "docs.google.com", category: "Productivity", tagline: "Documents" },
  { name: "Notion", url: "notion.so", category: "Productivity", tagline: "Notes & docs" },
  { name: "GitHub", url: "github.com", category: "Productivity", tagline: "Code & repos" },
  { name: "Figma", url: "figma.com", category: "Productivity", tagline: "Design" },
  { name: "Canva", url: "canva.com", category: "Productivity", tagline: "Quick design" },
];
const CATS = ["All", "Media", "Social", "AI", "Games", "Productivity"] as const;

function AppsPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<(typeof CATS)[number]>("All");
  const { defaultEngine } = useTheme();
  const visible = APPS.filter(
    (a) => (cat === "All" || a.category === cat) && a.name.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="min-h-screen px-4 pb-32 pt-8 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="space-y-1">
          <div className="text-[11px] uppercase tracking-[0.3em] text-white/55">Polaris</div>
          <h1 className="text-3xl font-black tracking-tight">Apps</h1>
          <p className="text-sm text-white/55">Curated launchers — all opened through the Polaris proxy.</p>
        </header>

        <div className="liquid-glass-themed flex items-center gap-3 rounded-2xl px-4 py-3">
          <Search className="h-4 w-4 text-white/60" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search apps"
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/45 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {CATS.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                cat === c
                  ? "bg-white text-black"
                  : "border border-white/10 bg-white/[0.03] text-white/65 hover:bg-white/10 hover:text-white"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {visible.map((a) => (
            <a
              key={a.name}
              href={getPolarisBrowserUrl(defaultEngine, a.url)}
              target="_blank"
              rel="noreferrer"
              className="liquid-glass-ghost group rounded-2xl p-4 transition hover:-translate-y-1 hover:border-white/30"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${a.url}&sz=128`}
                    alt=""
                    className="h-6 w-6 rounded"
                  />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-white">{a.name}</div>
                  <div className="truncate text-[11px] text-white/50">{a.tagline}</div>
                </div>
              </div>
            </a>
          ))}
          {visible.length === 0 && (
            <div className="col-span-full py-16 text-center text-sm text-white/45">No apps match.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/apps")({
  head: () => ({ meta: [{ title: "Apps — Polaris One" }] }),
  component: () => <AppShell><AppsPage /></AppShell>,
});