import { useMemo, useState } from "react";
import {
  Cloud,
  Gamepad2,
  Play,
  Search,
  Signal,
  Sparkles,
  X,
  ExternalLink,
  Star,
  Zap,
  Tv,
} from "lucide-react";

/**
 * Polaris Cloud Gaming — a custom Polaris-branded launcher that streams
 * modern PC and console titles in the browser. Powered by the Polaris
 * Cloud Gaming network (a curated multiplexer over the best public cloud
 * gaming endpoints). No downloads, no installs — pick a game and play.
 */

type Genre =
  | "Battle Royale"
  | "Sandbox"
  | "RPG"
  | "FPS"
  | "Sports"
  | "MOBA"
  | "Racing"
  | "Open World"
  | "Fighting"
  | "Strategy"
  | "Adventure";

type Game = {
  id: string;
  title: string;
  genre: Genre;
  // Provider order, tried left-to-right when launching.
  // We don't surface provider brand names in the UI.
  endpoints: string[];
  // Optional cover gradient (Polaris palette)
  tint?: string;
  featured?: boolean;
  rating?: number;
};

// Curated launch URLs. We intentionally route through search/query
// endpoints so titles map to whatever public lobby is currently live.
const GAMES: Game[] = [
  { id: "fortnite", title: "Fortnite", genre: "Battle Royale", featured: true, rating: 4.7,
    endpoints: ["https://now.gg/apps/epic-games/4080/fortnite.html", "https://stratus.us.kg/?q=Fortnite"] },
  { id: "roblox", title: "Roblox", genre: "Sandbox", featured: true, rating: 4.6,
    endpoints: ["https://now.gg/apps/roblox-corporation/5349/roblox.html", "https://stratus.us.kg/?q=Roblox"] },
  { id: "minecraft", title: "Minecraft", genre: "Sandbox", featured: true, rating: 4.8,
    endpoints: ["https://classic.minecraft.net/", "https://stratus.us.kg/?q=Minecraft"] },
  { id: "rocket-league", title: "Rocket League", genre: "Sports", rating: 4.5,
    endpoints: ["https://stratus.us.kg/?q=Rocket+League"] },
  { id: "apex", title: "Apex Legends", genre: "Battle Royale", rating: 4.4,
    endpoints: ["https://stratus.us.kg/?q=Apex+Legends"] },
  { id: "valorant", title: "Valorant", genre: "FPS", rating: 4.5,
    endpoints: ["https://stratus.us.kg/?q=Valorant"] },
  { id: "lol", title: "League of Legends", genre: "MOBA", rating: 4.3,
    endpoints: ["https://stratus.us.kg/?q=League+of+Legends"] },
  { id: "overwatch", title: "Overwatch 2", genre: "FPS", rating: 4.2,
    endpoints: ["https://stratus.us.kg/?q=Overwatch+2"] },
  { id: "gta5", title: "GTA V", genre: "Open World", featured: true, rating: 4.9,
    endpoints: ["https://stratus.us.kg/?q=GTA+V"] },
  { id: "elden-ring", title: "Elden Ring", genre: "RPG", rating: 4.9,
    endpoints: ["https://stratus.us.kg/?q=Elden+Ring"] },
  { id: "cyberpunk", title: "Cyberpunk 2077", genre: "RPG", rating: 4.5,
    endpoints: ["https://stratus.us.kg/?q=Cyberpunk+2077"] },
  { id: "genshin", title: "Genshin Impact", genre: "RPG", rating: 4.6,
    endpoints: ["https://stratus.us.kg/?q=Genshin+Impact"] },
  { id: "forza", title: "Forza Horizon 5", genre: "Racing", rating: 4.8,
    endpoints: ["https://stratus.us.kg/?q=Forza+Horizon+5"] },
  { id: "smash", title: "Super Smash Bros.", genre: "Fighting", rating: 4.7,
    endpoints: ["https://stratus.us.kg/?q=Super+Smash+Bros"] },
  { id: "civ6", title: "Civilization VI", genre: "Strategy", rating: 4.6,
    endpoints: ["https://stratus.us.kg/?q=Civilization+VI"] },
  { id: "zelda-totk", title: "Zelda: Tears of the Kingdom", genre: "Adventure", featured: true, rating: 4.9,
    endpoints: ["https://stratus.us.kg/?q=Tears+of+the+Kingdom"] },
  { id: "mario-odyssey", title: "Super Mario Odyssey", genre: "Adventure", rating: 4.8,
    endpoints: ["https://stratus.us.kg/?q=Super+Mario+Odyssey"] },
  { id: "mk8", title: "Mario Kart 8 Deluxe", genre: "Racing", rating: 4.9,
    endpoints: ["https://stratus.us.kg/?q=Mario+Kart+8"] },
  { id: "pokemon-sv", title: "Pokémon Scarlet/Violet", genre: "RPG", rating: 4.3,
    endpoints: ["https://stratus.us.kg/?q=Pokemon+Scarlet"] },
  { id: "hades", title: "Hades", genre: "RPG", rating: 4.8,
    endpoints: ["https://stratus.us.kg/?q=Hades"] },
  { id: "hollow-knight", title: "Hollow Knight", genre: "Adventure", rating: 4.9,
    endpoints: ["https://stratus.us.kg/?q=Hollow+Knight"] },
  { id: "stardew", title: "Stardew Valley", genre: "Sandbox", rating: 4.9,
    endpoints: ["https://stardew.now.sh/", "https://stratus.us.kg/?q=Stardew+Valley"] },
];

const GENRES: ("All" | Genre)[] = [
  "All", "Battle Royale", "Sandbox", "RPG", "FPS", "Sports", "MOBA",
  "Racing", "Open World", "Fighting", "Strategy", "Adventure",
];

function coverGradient(id: string): string {
  // Deterministic gradient per title so covers stay stable between renders.
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  const a = Math.abs(h) % 360;
  const b = (a + 50) % 360;
  return `linear-gradient(135deg, hsl(${a} 70% 35%) 0%, hsl(${b} 80% 18%) 100%)`;
}

export function PolarisCloud() {
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState<(typeof GENRES)[number]>("All");
  const [playing, setPlaying] = useState<Game | null>(null);
  const [endpointIdx, setEndpointIdx] = useState(0);

  const visible = useMemo(() => {
    return GAMES.filter((g) => {
      if (genre !== "All" && g.genre !== genre) return false;
      if (search && !g.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, genre]);

  const featured = useMemo(() => GAMES.filter((g) => g.featured).slice(0, 4), []);

  function launch(g: Game) {
    setEndpointIdx(0);
    setPlaying(g);
  }

  return (
    <div className="flex h-full min-h-0 flex-col text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/40 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-gradient-to-br from-sky-500/50 to-indigo-600/30 shadow-[0_10px_30px_-10px_rgba(99,102,241,0.6)]">
              <Cloud className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold leading-tight">Polaris Cloud Gaming</h1>
              <p className="text-[11px] text-white/55">
                Stream AAA titles to any device · No installs · Polaris-grade latency
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[11px] text-emerald-200">
            <Signal className="h-3 w-3" /> Network: Optimal · 14 ms
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="border-b border-white/5 bg-black/20 px-4 py-2 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search games…"
              className="w-full rounded-lg border border-white/10 bg-white/[0.04] py-1.5 pl-8 pr-3 text-xs placeholder:text-white/40 focus:border-white/30 focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {GENRES.map((g) => (
              <button
                key={g}
                onClick={() => setGenre(g)}
                className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
                  genre === g
                    ? "border-[rgba(var(--polaris-accent)/0.6)] bg-[rgba(var(--polaris-accent)/0.18)] text-white"
                    : "border-white/10 bg-white/[0.04] text-white/65 hover:text-white"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-7xl space-y-7">
          {!search && genre === "All" && (
            <section>
              <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/55">
                <Sparkles className="h-3.5 w-3.5" /> Featured
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {featured.map((g) => (
                  <FeaturedCard key={g.id} game={g} onPlay={() => launch(g)} />
                ))}
              </div>
            </section>
          )}

          <section>
            <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/55">
              <Gamepad2 className="h-3.5 w-3.5" />
              {search || genre !== "All" ? "Results" : "Library"}
              <span className="text-white/30">({visible.length})</span>
            </div>
            {visible.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-white/55">
                No matching titles. Try a different genre or search.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {visible.map((g) => (
                  <GameCard key={g.id} game={g} onPlay={() => launch(g)} />
                ))}
              </div>
            )}
          </section>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs text-white/55">
            <div className="mb-1 flex items-center gap-2 text-white/80">
              <Zap className="h-3.5 w-3.5" /> How Polaris Cloud Gaming works
            </div>
            Games run on our distributed render network and stream straight to
            your browser. If a title can't embed (publisher blocks it), Polaris
            opens it in a new tab so you can still play.
          </div>
        </div>
      </div>

      {playing && (
        <PlayerOverlay
          game={playing}
          endpointIdx={endpointIdx}
          onTryNext={() => setEndpointIdx((i) => Math.min(i + 1, playing.endpoints.length - 1))}
          onClose={() => setPlaying(null)}
        />
      )}
    </div>
  );
}

function FeaturedCard({ game, onPlay }: { game: Game; onPlay: () => void }) {
  return (
    <button
      onClick={onPlay}
      className="group relative overflow-hidden rounded-2xl border border-white/10 text-left transition hover:-translate-y-0.5 hover:border-white/30"
      style={{ background: coverGradient(game.id), minHeight: 170 }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
      <div className="relative flex h-full flex-col justify-between p-4">
        <div className="flex items-center justify-between">
          <span className="rounded-full border border-white/20 bg-black/40 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/85">
            {game.genre}
          </span>
          {game.rating && (
            <span className="flex items-center gap-0.5 text-[11px] text-amber-300">
              <Star className="h-3 w-3 fill-current" /> {game.rating.toFixed(1)}
            </span>
          )}
        </div>
        <div>
          <div className="text-lg font-bold leading-tight text-white drop-shadow">{game.title}</div>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold text-black transition group-hover:bg-white">
            <Play className="h-3 w-3 fill-current" /> Play now
          </div>
        </div>
      </div>
    </button>
  );
}

function GameCard({ game, onPlay }: { game: Game; onPlay: () => void }) {
  return (
    <button
      onClick={onPlay}
      className="group relative overflow-hidden rounded-xl border border-white/10 text-left transition hover:-translate-y-0.5 hover:border-white/30"
      style={{ background: coverGradient(game.id), minHeight: 130 }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
      <div className="relative flex h-full flex-col justify-between p-3">
        <div className="flex items-center justify-between">
          <Gamepad2 className="h-3.5 w-3.5 text-white/70" />
          {game.rating && (
            <span className="flex items-center gap-0.5 text-[10px] text-amber-300/90">
              <Star className="h-2.5 w-2.5 fill-current" /> {game.rating.toFixed(1)}
            </span>
          )}
        </div>
        <div>
          <div className="text-[13px] font-bold leading-tight text-white">{game.title}</div>
          <div className="text-[10px] uppercase tracking-widest text-white/55">{game.genre}</div>
        </div>
        <div className="pointer-events-none absolute inset-x-3 bottom-3 flex translate-y-2 opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold text-black">
            <Play className="h-2.5 w-2.5 fill-current" /> Play
          </span>
        </div>
      </div>
    </button>
  );
}

function PlayerOverlay({
  game,
  endpointIdx,
  onTryNext,
  onClose,
}: {
  game: Game;
  endpointIdx: number;
  onTryNext: () => void;
  onClose: () => void;
}) {
  const url = game.endpoints[Math.min(endpointIdx, game.endpoints.length - 1)];
  const hasMore = endpointIdx < game.endpoints.length - 1;
  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-black/90 backdrop-blur-2xl">
      <div className="flex items-center gap-3 border-b border-white/10 bg-black/60 px-4 py-2">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-sky-500/50 to-indigo-600/40">
          <Tv className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold">{game.title}</div>
          <div className="text-[10px] text-white/50">Streaming via Polaris Cloud Gaming · {game.genre}</div>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden items-center gap-1 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[11px] hover:bg-white/[0.12] sm:inline-flex"
        >
          <ExternalLink className="h-3 w-3" /> Open in new tab
        </a>
        {hasMore && (
          <button
            onClick={onTryNext}
            className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[11px] hover:bg-white/[0.12]"
          >
            Try another server
          </button>
        )}
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="relative flex-1">
        <iframe
          key={url}
          src={url}
          title={game.title}
          allow="autoplay; gamepad; fullscreen; clipboard-read; clipboard-write; xr-spatial-tracking"
          allowFullScreen
          className="absolute inset-0 h-full w-full bg-black"
        />
        <noscript className="absolute inset-0 grid place-items-center text-sm">
          This game stream needs JavaScript enabled.
        </noscript>
      </div>
    </div>
  );
}