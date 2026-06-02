import { useEffect, useMemo, useState } from "react";
import {
  Radio, Search, X, Tv2, Trophy, Newspaper, Film, Music2, Baby, FlaskConical,
  Globe2, Flame, Star, Volume2, Maximize2, ListVideo, ChevronRight,
  Loader2, RefreshCw, Calendar,
} from "lucide-react";

type Channel = {
  id: string;
  name: string;
  category: Category;
  domain: string;          // used for favicon fallback chains
  emoji: string;           // always-renders fallback
  accent: string;          // brand tint for the chip backdrop
  tagline?: string;
  popular?: boolean;
  highlight?: boolean;
  now?: string;            // what's airing now (display-only)
  next?: string;           // up next
  /** DaddyLive numeric stream id — pure player iframe, no website chrome. */
  dlhd?: number;
};

type Category = "All" | "Sports" | "News" | "Entertainment" | "Movies" | "Kids" | "Music" | "Documentary";

// Pure-player iframes only — no third-party website chrome. We rotate
// through several DaddyLive-compatible mirrors AND a couple of independent
// providers, because some mirrors (e.g. dlhd.pk) gate playback on the
// parent domain and return "Access Denied" when embedded from anywhere
// other than their own site. If one server is blocked, the user (and the
// auto-fallback) can rotate to the next one with a single click.
type StreamBuilder = (id: number) => string;
const STREAM_SERVERS: { label: string; build: StreamBuilder }[] = [
  // DaddyLive-compatible mirrors that historically don't gate by parent domain.
  { label: "daddylive.sx",       build: (id) => `https://daddylive.sx/embed/stream-${id}.php` },
  { label: "daddylivehd.sx",     build: (id) => `https://daddylivehd.sx/embed/stream-${id}.php` },
  { label: "thedaddy.click",     build: (id) => `https://thedaddy.click/embed/stream-${id}.php` },
  { label: "dlhd.click",         build: (id) => `https://dlhd.click/embed/stream-${id}.php` },
  { label: "dlhd.so",            build: (id) => `https://dlhd.so/embed/stream-${id}.php` },
  { label: "thedaddy.top",       build: (id) => `https://thedaddy.top/embed/stream-${id}.php` },
  // Independent providers (different upstream entirely) — used as a safety
  // net when every DaddyLive mirror in the pool is being blocked.
  { label: "weakstream.org",     build: (id) => `https://weakstream.org/wstream/${id}` },
  { label: "embedsports.top",    build: (id) => `https://embedsports.top/embed/alpha/dl-${id}/1` },
];
function streamEmbed(id: number, idx = 0) {
  return STREAM_SERVERS[idx % STREAM_SERVERS.length].build(id);
}

// Only channels with known DaddyLive IDs are kept — every tile maps to a
// pure HTML5 player iframe (no third-party website wrapper).
const CHANNELS: Channel[] = [
  // Sports
  { id: "sky-sports-main",   name: "Sky Sports Main Event", category: "Sports",        domain: "skysports.com",        emoji: "⚽", accent: "5 95 200",   tagline: "Premier League · F1 · Boxing", popular: true, highlight: true, dlhd: 130 },
  { id: "sky-sports-pl",     name: "Sky Sports Premier League", category: "Sports",    domain: "skysports.com",        emoji: "🏟️", accent: "5 95 200",   tagline: "Live Premier League",          popular: true,                  dlhd: 131 },
  { id: "sky-sports-football", name: "Sky Sports Football", category: "Sports",        domain: "skysports.com",        emoji: "⚽", accent: "5 95 200",   tagline: "EFL · International",                                          dlhd: 134 },
  { id: "sky-sports-f1",     name: "Sky Sports F1",         category: "Sports",        domain: "skysports.com",        emoji: "🏎️", accent: "200 30 30",  tagline: "Formula 1 · MotoGP",                                          dlhd: 137 },
  { id: "tnt-sports-1",      name: "TNT Sports 1",          category: "Sports",        domain: "tntsports.co.uk",      emoji: "🥊", accent: "230 60 30",  tagline: "UCL · Premiership Rugby",      highlight: true,                dlhd: 132 },
  { id: "tnt-sports-2",      name: "TNT Sports 2",          category: "Sports",        domain: "tntsports.co.uk",      emoji: "🏉", accent: "230 60 30",  tagline: "Champions League nights",                                     dlhd: 133 },
  { id: "espn",              name: "ESPN",                  category: "Sports",        domain: "espn.com",             emoji: "🏈", accent: "200 30 30",  tagline: "NFL · NBA · UFC",              popular: true, highlight: true, dlhd: 44 },
  { id: "espn2",             name: "ESPN2",                 category: "Sports",        domain: "espn.com",             emoji: "🥎", accent: "200 30 30",  tagline: "College · Tennis",                                            dlhd: 45 },
  { id: "fs1",               name: "FOX Sports 1",          category: "Sports",        domain: "foxsports.com",        emoji: "⚾", accent: "30 50 160",  tagline: "MLB · College Football",                                      dlhd: 51 },
  { id: "nba-tv",            name: "NBA TV",                category: "Sports",        domain: "nba.com",              emoji: "🏀", accent: "200 80 30",  tagline: "League Pass · Live Games",     popular: true,                  dlhd: 75 },
  { id: "nfl-network",       name: "NFL Network",           category: "Sports",        domain: "nfl.com",              emoji: "🏈", accent: "30 30 30",   tagline: "24/7 NFL",                                                    dlhd: 100 },
  { id: "mlb-network",       name: "MLB Network",           category: "Sports",        domain: "mlb.com",              emoji: "⚾", accent: "30 60 160",  tagline: "Baseball nightly",                                            dlhd: 76 },

  // News
  { id: "bbc-news",          name: "BBC News",              category: "News",          domain: "bbc.co.uk",            emoji: "🌍", accent: "190 20 20",  tagline: "Global news · 24/7",           popular: true, highlight: true, dlhd: 80 },
  { id: "sky-news",          name: "Sky News",              category: "News",          domain: "sky.com",              emoji: "📡", accent: "10 90 200",  tagline: "UK & World",                                                  dlhd: 514 },
  { id: "cnn",               name: "CNN",                   category: "News",          domain: "cnn.com",              emoji: "📰", accent: "200 30 30",  tagline: "Breaking news",                popular: true,                  dlhd: 13 },
  { id: "fox-news",          name: "FOX News",              category: "News",          domain: "foxnews.com",          emoji: "🦅", accent: "30 60 160",  tagline: "US politics",                                                 dlhd: 27 },
  { id: "msnbc",             name: "MSNBC",                 category: "News",          domain: "msnbc.com",            emoji: "🎙️", accent: "20 130 220", tagline: "Analysis & commentary",                                       dlhd: 121 },
  { id: "al-jazeera",        name: "Al Jazeera English",    category: "News",          domain: "aljazeera.com",        emoji: "🕌", accent: "210 150 40", tagline: "International perspectives",                                  dlhd: 36 },

  // Entertainment
  { id: "bbc-one",           name: "BBC One",               category: "Entertainment", domain: "bbc.co.uk",            emoji: "🎭", accent: "180 30 90",  tagline: "Flagship UK channel",          popular: true,                  dlhd: 81 },
  { id: "itv1",              name: "ITV1",                  category: "Entertainment", domain: "itv.com",              emoji: "📺", accent: "230 60 130", tagline: "Drama · Reality",                                             dlhd: 12 },
  { id: "channel4",          name: "Channel 4",             category: "Entertainment", domain: "channel4.com",         emoji: "🎬", accent: "240 80 130", tagline: "Bold storytelling",                                           dlhd: 14 },

  // Movies
  { id: "hbo",               name: "HBO",                   category: "Movies",        domain: "hbo.com",              emoji: "🎞️", accent: "120 60 200", tagline: "Premium cinema",               popular: true, highlight: true, dlhd: 169 },
  { id: "amc",               name: "AMC",                   category: "Movies",        domain: "amc.com",              emoji: "🍿", accent: "200 30 30",  tagline: "Cinematic series",                                            dlhd: 174 },

  // Kids
  { id: "cartoon-network",   name: "Cartoon Network",       category: "Kids",          domain: "cartoonnetwork.com",   emoji: "🐰", accent: "30 30 30",   tagline: "Animation hub",                popular: true,                  dlhd: 11 },
  { id: "disney-channel",    name: "Disney Channel",        category: "Kids",          domain: "disney.com",           emoji: "🏰", accent: "40 60 200",  tagline: "Family favorites",             popular: true,                  dlhd: 19 },
  { id: "nick",              name: "Nickelodeon",           category: "Kids",          domain: "nick.com",             emoji: "🟧", accent: "230 110 30", tagline: "SpongeBob & more",                                            dlhd: 88 },

  // Music
  { id: "mtv",               name: "MTV",                   category: "Music",         domain: "mtv.com",              emoji: "🎵", accent: "230 60 30",  tagline: "Pop & culture",                                                dlhd: 26 },

  // Documentary
  { id: "natgeo",            name: "National Geographic",   category: "Documentary",   domain: "nationalgeographic.com", emoji: "🌋", accent: "230 200 30", tagline: "Earth · Science",            popular: true, highlight: true, dlhd: 79 },
  { id: "discovery",         name: "Discovery",             category: "Documentary",   domain: "discovery.com",        emoji: "🔭", accent: "30 80 180",  tagline: "Real-world adventures",                                       dlhd: 18 },
  { id: "history",           name: "History",               category: "Documentary",   domain: "history.com",          emoji: "📜", accent: "180 100 40", tagline: "Stories that shaped us",                                      dlhd: 23 },
  { id: "animal-planet",     name: "Animal Planet",         category: "Documentary",   domain: "animalplanet.com",     emoji: "🦁", accent: "120 180 40", tagline: "Wildlife stories",                                            dlhd: 21 },
];

const CATEGORIES: { id: Category; label: string; icon: typeof Tv2 }[] = [
  { id: "All", label: "All", icon: Globe2 },
  { id: "Sports", label: "Sports", icon: Trophy },
  { id: "News", label: "News", icon: Newspaper },
  { id: "Entertainment", label: "Entertainment", icon: Tv2 },
  { id: "Movies", label: "Movies", icon: Film },
  { id: "Kids", label: "Kids", icon: Baby },
  { id: "Music", label: "Music", icon: Music2 },
  { id: "Documentary", label: "Docs", icon: FlaskConical },
];

/**
 * Channel logo with a multi-source fallback chain. Clearbit returns 404 for
 * many broadcaster domains; DuckDuckGo's icon service is dramatically more
 * reliable. We finally fall back to the channel emoji so the tile is never
 * blank.
 */
function ChannelLogo({ c, size = 40, className = "" }: { c: Channel; size?: number; className?: string }) {
  const [stage, setStage] = useState(0);
  const srcs = [
    `https://icons.duckduckgo.com/ip3/${c.domain}.ico`,
    `https://www.google.com/s2/favicons?sz=128&domain=${c.domain}`,
    `https://logo.clearbit.com/${c.domain}`,
  ];
  if (stage >= srcs.length) {
    return (
      <span
        className={`grid place-items-center rounded-md text-white ${className}`}
        style={{
          width: size, height: size,
          background: `linear-gradient(135deg, rgb(${c.accent}/0.95), rgb(${c.accent}/0.55))`,
          fontSize: size * 0.55,
        }}
        aria-label={c.name}
      >
        {c.emoji}
      </span>
    );
  }
  return (
    <img
      key={stage}
      src={srcs[stage]}
      alt={c.name}
      width={size}
      height={size}
      onError={() => setStage((s) => s + 1)}
      className={`rounded-md bg-white object-contain p-1 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

export function LiveTV() {
  const [cat, setCat] = useState<Category>("All");
  const [q, setQ] = useState("");
  const [playing, setPlaying] = useState<Channel | null>(null);
  const [playingMatch, setPlayingMatch] = useState<{ match: SportMatch; stream: SportStream } | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return CHANNELS.filter((c) =>
      (cat === "All" || c.category === cat) &&
      (!s || c.name.toLowerCase().includes(s) || c.tagline?.toLowerCase().includes(s))
    );
  }, [cat, q]);

  const highlights = CHANNELS.filter((c) => c.highlight);
  const popular = CHANNELS.filter((c) => c.popular);

  return (
    <div className="relative min-h-screen pb-24">
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex items-center gap-3 px-4 pt-4 pb-3 sm:px-6">
        <div className="liquid-glass-themed flex w-full items-center gap-2 rounded-2xl px-3 py-2">
          <div className="flex items-center gap-2 pr-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-rose-500/70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
            </span>
            <span
              className="text-lg font-black tracking-tight"
              style={{
                background: "linear-gradient(90deg, rgba(var(--polaris-accent)/1), #fff)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Polaris Live
            </span>
          </div>
          <span className="h-5 w-px bg-white/15" />
          <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              const active = cat === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setCat(c.id)}
                  className={`relative flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm transition ${
                    active ? "text-white" : "text-white/60 hover:text-white"
                  }`}
                >
                  {active && (
                    <span
                      className="absolute inset-0 rounded-xl"
                      style={{
                        background: "linear-gradient(90deg, rgba(var(--polaris-accent)/0.25), rgba(var(--polaris-accent)/0.08))",
                        boxShadow: "inset 0 0 0 1px rgba(var(--polaris-accent)/0.5)",
                      }}
                    />
                  )}
                  <Icon className="relative h-4 w-4" />
                  <span className="relative font-medium">{c.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5">
            <Search className="h-4 w-4 text-white/70" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search channels"
              className="w-32 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none sm:w-44"
            />
          </div>
        </div>
      </header>

      {/* Featured hero */}
      {cat === "All" && !q && (
        <section className="mx-4 mb-8 sm:mx-6">
          <div
            className="relative overflow-hidden rounded-2xl ring-1 ring-amber-200/15"
            style={{
              background: "linear-gradient(135deg, #2a120a 0%, #5b2510 45%, #c25f1f 100%)",
              boxShadow: "0 24px 80px -25px rgba(255,150,80,0.55), inset 0 0 100px rgba(0,0,0,0.35)",
            }}
          >
            <div className="grid gap-6 p-6 sm:p-8 md:grid-cols-[1.2fr_1fr]">
              <div className="flex flex-col justify-center">
                <div className="mb-3 flex items-center gap-2 text-amber-100/85">
                  <Flame className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em]">Live Highlights</span>
                </div>
                <h2 className="text-3xl font-black leading-tight text-amber-50 drop-shadow md:text-4xl">
                  Tune into the world, live.
                </h2>
                <p className="mt-2 max-w-md text-sm text-amber-100/85">
                  Sports, news and premium cinema beamed straight to Polaris — pick a channel and we'll spin it up in seconds.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {highlights.slice(0, 4).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setPlaying(c)}
                      className="flex items-center gap-2 rounded-full bg-black/35 px-3 py-1.5 text-xs font-semibold text-amber-50 ring-1 ring-amber-200/30 transition hover:bg-black/55"
                    >
                      <ChannelLogo c={c} size={16} className="!p-0" />
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {highlights.slice(0, 6).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setPlaying(c)}
                    className="group relative flex aspect-square items-center justify-center rounded-xl bg-stone-950/55 ring-1 ring-white/10 transition hover:scale-[1.04] hover:ring-amber-300/60"
                  >
                    <ChannelLogo c={c} size={42} />
                    <span className="absolute inset-x-0 bottom-1 truncate px-1 text-center text-[9px] font-semibold text-white/80">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Most popular */}
      {cat === "All" && !q && (
        <Section title="Most Popular Right Now" icon={<Star className="h-4 w-4 text-amber-300" />}>
          <ChannelRow channels={popular} onPlay={setPlaying} />
        </Section>
      )}

      {/* Live & upcoming sports (auto-discovered) */}
      {(cat === "All" || cat === "Sports") && !q && (
        <LiveSportsSection onPlay={(match, stream) => setPlayingMatch({ match, stream })} />
      )}

      {/* Filtered grid */}
      <Section title={cat === "All" && !q ? "All Channels" : `${cat}${q ? ` · "${q}"` : ""}`}>
        <div className="grid grid-cols-2 gap-3 px-4 sm:grid-cols-3 sm:px-6 md:grid-cols-4 lg:grid-cols-6">
          {filtered.map((c) => (
            <ChannelCard key={c.id} c={c} onPlay={() => setPlaying(c)} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-12 text-center text-sm text-white/50">No channels match.</div>
          )}
        </div>
      </Section>

      {/* Disclaimer */}
      <div className="mx-4 mt-8 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-center sm:mx-6">
        <p className="text-[11px] text-white/50">
          Live streams are sourced from third-party providers. Channel availability depends on the upstream feed.
        </p>
      </div>

      {playing && (
        <LivePlayer channel={playing} all={CHANNELS} onPick={setPlaying} onClose={() => setPlaying(null)} />
      )}
      {playingMatch && (
        <SportsPlayer
          match={playingMatch.match}
          stream={playingMatch.stream}
          onClose={() => setPlayingMatch(null)}
        />
      )}
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center gap-2 px-4 sm:px-6">
        {icon}
        <h3 className="text-lg font-bold text-amber-50 sm:text-xl">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function ChannelRow({ channels, onPlay }: { channels: Channel[]; onPlay: (c: Channel) => void }) {
  return (
    <div className="flex gap-3 overflow-x-auto px-4 pb-2 sm:px-6">
      {channels.map((c) => (
        <button
          key={c.id}
          onClick={() => onPlay(c)}
          className="group relative flex w-44 shrink-0 flex-col items-center gap-2 rounded-xl border border-white/5 bg-stone-950/70 p-3 text-left transition hover:-translate-y-0.5 hover:border-amber-200/40 hover:bg-stone-900/80"
          style={{ boxShadow: `inset 0 0 0 1px rgb(${c.accent}/0.18)` }}
        >
          <ChannelLogo c={c} size={56} />
          <div className="w-full text-center">
            <div className="truncate text-sm font-bold text-amber-50">{c.name}</div>
            {c.tagline && <div className="line-clamp-1 text-[10px] text-white/55">{c.tagline}</div>}
            {c.now && <div className="mt-1 line-clamp-1 text-[10px] text-amber-200/80">▸ {c.now}</div>}
          </div>
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-rose-500/90 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
            <span className="h-1 w-1 rounded-full bg-white" /> Live
          </span>
        </button>
      ))}
    </div>
  );
}

function ChannelCard({ c, onPlay }: { c: Channel; onPlay: () => void }) {
  return (
    <button
      onClick={onPlay}
      className="group relative flex flex-col items-center gap-2 rounded-xl border border-white/5 bg-stone-950/70 p-3 transition hover:-translate-y-0.5 hover:border-amber-200/40 hover:bg-stone-900/80"
      style={{ boxShadow: `inset 0 0 0 1px rgb(${c.accent}/0.16)` }}
    >
      <ChannelLogo c={c} size={52} />
      <div className="w-full text-center">
        <div className="truncate text-xs font-bold text-amber-50">{c.name}</div>
        {c.tagline && <div className="line-clamp-1 text-[10px] text-white/50">{c.tagline}</div>}
        {c.now && <div className="mt-0.5 line-clamp-1 text-[10px] text-amber-200/75">▸ {c.now}</div>}
      </div>
      <span className="absolute right-1.5 top-1.5 rounded-full bg-rose-500/90 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-white">Live</span>
    </button>
  );
}

function LivePlayer({ channel, all, onPick, onClose }: { channel: Channel; all: Channel[]; onPick: (c: Channel) => void; onClose: () => void }) {
  const [showSidebar, setShowSidebar] = useState(true);
  const related = all.filter((c) => c.category === channel.category && c.id !== channel.id).slice(0, 8);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-black animate-[fadeIn_180ms_ease]">
      {/* Glassy top bar branded with the channel accent */}
      <div
        className="relative flex items-center justify-between gap-3 px-4 py-3 sm:px-6"
        style={{
          background: `linear-gradient(180deg, rgb(${channel.accent}/0.35) 0%, rgba(0,0,0,0.85) 100%)`,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="flex items-center gap-3">
          <ChannelLogo c={channel} size={40} />
          <div>
            <div className="flex items-center gap-2 text-sm font-black text-amber-50">
              <span className="relative inline-flex h-2 w-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-rose-500/70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
              </span>
              {channel.name}
              <span className="rounded-full bg-rose-500/90 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-white">Live</span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">{channel.category}</span>
            </div>
            {channel.now && (
              <div className="text-[11px] text-amber-100/80">
                Now: <span className="font-semibold text-amber-50">{channel.now}</span>
                {channel.next && <span className="text-white/45"> · Next: {channel.next}</span>}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSidebar((v) => !v)}
            className="liquid-glass hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white sm:inline-flex"
            title="Toggle channel guide"
          >
            <ListVideo className="h-3.5 w-3.5" /> Guide
          </button>
          <button onClick={onClose} className="liquid-glass rounded-full p-2 text-white" aria-label="Close player">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="relative flex flex-1 overflow-hidden">
        {/* Player surface */}
        <div className="relative flex-1 overflow-hidden bg-black">
          <ChannelPlayerFrame channel={channel} />
          {/* Bottom action chrome — purely cosmetic but makes the surface feel like a real player */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/85 via-black/30 to-transparent px-4 py-3 text-xs text-white/80">
            <Radio className="h-3.5 w-3.5 text-rose-400" />
            <span className="font-semibold text-amber-50">{channel.name}</span>
            {channel.tagline && <span className="hidden text-white/55 sm:inline">· {channel.tagline}</span>}
            <div className="ml-auto flex items-center gap-2 opacity-70">
              <Volume2 className="h-3.5 w-3.5" />
              <Maximize2 className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>

        {/* Channel guide sidebar */}
        {showSidebar && (
          <aside className="hidden w-72 shrink-0 flex-col border-l border-white/5 bg-stone-950/95 lg:flex">
            <div className="border-b border-white/5 px-4 py-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200/80">More in</div>
              <div className="text-sm font-bold text-amber-50">{channel.category}</div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {related.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onPick(c)}
                  className="group flex w-full items-center gap-3 rounded-lg p-2 text-left transition hover:bg-white/5"
                >
                  <ChannelLogo c={c} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-amber-50">{c.name}</div>
                    {c.now && <div className="truncate text-[10px] text-amber-200/70">▸ {c.now}</div>}
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-white/30 group-hover:text-white/70" />
                </button>
              ))}
              {related.length === 0 && (
                <div className="px-3 py-6 text-center text-xs text-white/40">No siblings in this category.</div>
              )}
            </div>
            <div className="border-t border-white/5 px-4 py-2 text-[10px] text-white/35">
              Polaris Live · pure-player iframes
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Player frame for 24/7 channels — rotates through DaddyLive mirrors so a
// single host outage doesn't kill playback. The iframe is the upstream's
// bare HTML5 player (no website chrome).
// ----------------------------------------------------------------------------
function ChannelPlayerFrame({ channel }: { channel: Channel }) {
  const [hostIdx, setHostIdx] = useState(0);
  const [nonce, setNonce] = useState(0);
  if (channel.dlhd == null) {
    return (
      <div className="absolute inset-0 grid place-items-center text-sm text-white/60">
        This channel doesn't have a direct player yet.
      </div>
    );
  }
  const src = dlhdEmbed(channel.dlhd, hostIdx);
  return (
    <>
      <iframe
        key={`${channel.id}-${hostIdx}-${nonce}`}
        src={src}
        title={`${channel.name} — Live`}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        referrerPolicy="no-referrer"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
        className="absolute inset-0 h-full w-full"
      />
      <div className="absolute right-3 top-3 flex items-center gap-1.5">
        <button
          onClick={() => { setHostIdx((i) => (i + 1) % DLHD_HOSTS.length); setNonce((n) => n + 1); }}
          className="liquid-glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold text-white"
          title="Try another stream server"
        >
          <RefreshCw className="h-3 w-3" /> Server {hostIdx + 1}/{DLHD_HOSTS.length}
        </button>
      </div>
    </>
  );
}

// ----------------------------------------------------------------------------
// Live & upcoming sports — auto-discovered from streamed.pk public API.
// Each match exposes one or more "sources" (servers); we pick the first
// available stream and embed its pure player iframe.
// ----------------------------------------------------------------------------
type SportMatch = {
  id: string;
  title: string;
  category: string;
  date: number;
  poster?: string;
  popular?: boolean;
  teams?: { home?: { name: string; badge?: string }; away?: { name: string; badge?: string } };
  sources: { source: string; id: string }[];
};
type SportStream = {
  id: string;
  streamNo: number;
  language: string;
  hd: boolean;
  embedUrl: string;
  source: string;
};

const STREAMED_API = "https://streamed.pk";
const SPORTS_ICONS: Record<string, string> = {
  football: "⚽", soccer: "⚽", basketball: "🏀", baseball: "⚾",
  "american-football": "🏈", hockey: "🏒", "ice-hockey": "🏒",
  fight: "🥊", boxing: "🥊", mma: "🥋", ufc: "🥋",
  tennis: "🎾", golf: "⛳", cricket: "🏏", rugby: "🏉",
  motor: "🏎️", "motor-sports": "🏎️", f1: "🏎️", racing: "🏁",
  cycling: "🚴", darts: "🎯", snooker: "🎱", esports: "🎮",
  wrestling: "🤼", other: "🏟️",
};
const CAT_ACCENT: Record<string, string> = {
  football: "40 160 90", basketball: "230 110 30", baseball: "30 80 180",
  "american-football": "30 30 30", hockey: "180 200 230", fight: "200 30 30",
  tennis: "200 220 60", golf: "60 160 80", cricket: "30 130 60",
  rugby: "180 100 40", motor: "200 60 60", other: "120 60 200",
};

function badgeUrl(b?: string) {
  if (!b) return "";
  return `${STREAMED_API}/api/images/badge/${b}.webp`;
}
function posterUrl(p?: string) {
  if (!p) return "";
  return p.startsWith("http") ? p : `${STREAMED_API}${p}`;
}

function LiveSportsSection({
  onPlay,
}: {
  onPlay: (m: SportMatch, s: SportStream) => void;
}) {
  const [live, setLive] = useState<SportMatch[]>([]);
  const [upcoming, setUpcoming] = useState<SportMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [loadingMatchId, setLoadingMatchId] = useState<string | null>(null);

  useEffect(() => {
    let dead = false;
    const load = async () => {
      setErr(null);
      try {
        const [liveRes, todayRes] = await Promise.all([
          fetch(`${STREAMED_API}/api/matches/live`).then((r) => r.json() as Promise<SportMatch[]>),
          fetch(`${STREAMED_API}/api/matches/all-today`).then((r) => r.json() as Promise<SportMatch[]>),
        ]);
        if (dead) return;
        const now = Date.now();
        setLive(liveRes.filter((m) => m.sources?.length).slice(0, 18));
        setUpcoming(
          todayRes
            .filter((m) => m.sources?.length && m.date > now)
            .sort((a, b) => a.date - b.date)
            .slice(0, 18),
        );
      } catch (e) {
        if (!dead) setErr(e instanceof Error ? e.message : "Couldn't reach the sports feed");
      } finally {
        if (!dead) setLoading(false);
      }
    };
    void load();
    const t = setInterval(load, 90_000);
    return () => { dead = true; clearInterval(t); };
  }, []);

  const handlePlay = async (m: SportMatch) => {
    setLoadingMatchId(m.id);
    try {
      for (const src of m.sources) {
        try {
          const streams = (await fetch(
            `${STREAMED_API}/api/stream/${src.source}/${src.id}`,
          ).then((r) => r.json())) as SportStream[];
          const hd = streams.find((s) => s.hd) ?? streams[0];
          if (hd?.embedUrl) {
            onPlay(m, hd);
            return;
          }
        } catch { /* try next source */ }
      }
      setErr("No working stream right now — try again in a minute.");
    } finally {
      setLoadingMatchId(null);
    }
  };

  if (loading) {
    return (
      <Section title="Live & Upcoming Sports" icon={<Trophy className="h-4 w-4 text-amber-300" />}>
        <div className="flex items-center gap-2 px-4 py-6 text-sm text-white/55 sm:px-6">
          <Loader2 className="h-4 w-4 animate-spin" /> Finding live games…
        </div>
      </Section>
    );
  }
  if (err && !live.length && !upcoming.length) {
    return (
      <Section title="Live & Upcoming Sports" icon={<Trophy className="h-4 w-4 text-amber-300" />}>
        <div className="px-4 py-6 text-sm text-white/55 sm:px-6">{err}</div>
      </Section>
    );
  }

  return (
    <>
      {live.length > 0 && (
        <Section
          title="Live Games Right Now"
          icon={<Trophy className="h-4 w-4 text-rose-300" />}
        >
          <div className="flex gap-3 overflow-x-auto px-4 pb-2 sm:px-6">
            {live.map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                live
                loading={loadingMatchId === m.id}
                onPlay={() => handlePlay(m)}
              />
            ))}
          </div>
        </Section>
      )}
      {upcoming.length > 0 && (
        <Section
          title="Coming Up Today"
          icon={<Calendar className="h-4 w-4 text-amber-300" />}
        >
          <div className="flex gap-3 overflow-x-auto px-4 pb-2 sm:px-6">
            {upcoming.map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                loading={loadingMatchId === m.id}
                onPlay={() => handlePlay(m)}
              />
            ))}
          </div>
        </Section>
      )}
    </>
  );
}

function MatchCard({
  match, live, loading, onPlay,
}: {
  match: SportMatch; live?: boolean; loading?: boolean; onPlay: () => void;
}) {
  const icon = SPORTS_ICONS[match.category] ?? SPORTS_ICONS.other;
  const accent = CAT_ACCENT[match.category] ?? CAT_ACCENT.other;
  const when = new Date(match.date);
  const timeLabel = when.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const home = match.teams?.home; const away = match.teams?.away;
  return (
    <button
      onClick={onPlay}
      disabled={loading}
      className="group relative flex w-64 shrink-0 flex-col gap-2 overflow-hidden rounded-xl border border-white/5 bg-stone-950/80 p-3 text-left transition hover:-translate-y-0.5 hover:border-amber-200/40 hover:bg-stone-900/90 disabled:opacity-60"
      style={{ boxShadow: `inset 0 0 0 1px rgb(${accent}/0.22)` }}
    >
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-white/55">
        <span className="flex items-center gap-1.5">
          <span className="text-base leading-none">{icon}</span>
          <span>{match.category.replace(/-/g, " ")}</span>
        </span>
        {live ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/90 px-1.5 py-0.5 text-[9px] font-black text-white">
            <span className="h-1 w-1 rounded-full bg-white" /> LIVE
          </span>
        ) : (
          <span className="text-amber-200/80">{timeLabel}</span>
        )}
      </div>
      {home && away ? (
        <div className="flex items-center justify-between gap-2 py-1">
          <TeamBlock name={home.name} badge={home.badge} />
          <span className="text-[10px] font-black text-white/40">VS</span>
          <TeamBlock name={away.name} badge={away.badge} />
        </div>
      ) : (
        <div className="line-clamp-2 py-1 text-sm font-bold text-amber-50">{match.title}</div>
      )}
      <div className="line-clamp-1 text-[11px] font-semibold text-amber-50/90">{match.title}</div>
      <div className="flex items-center justify-between text-[10px] text-white/45">
        <span>{match.sources.length} server{match.sources.length === 1 ? "" : "s"}</span>
        <span className="inline-flex items-center gap-1 font-semibold text-amber-200/80">
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Radio className="h-3 w-3" />}
          {loading ? "Connecting" : live ? "Watch" : "Set reminder"}
        </span>
      </div>
    </button>
  );
}

function TeamBlock({ name, badge }: { name: string; badge?: string }) {
  const [broken, setBroken] = useState(false);
  return (
    <div className="flex min-w-0 flex-1 items-center gap-1.5">
      {badge && !broken ? (
        <img
          src={badgeUrl(badge)}
          alt=""
          className="h-7 w-7 shrink-0 rounded bg-white/5 object-contain p-0.5"
          onError={() => setBroken(true)}
        />
      ) : (
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded bg-white/10 text-[10px] font-black text-white/70">
          {name.slice(0, 2).toUpperCase()}
        </div>
      )}
      <div className="min-w-0 truncate text-xs font-semibold text-amber-50">{name}</div>
    </div>
  );
}

function SportsPlayer({
  match, stream, onClose,
}: {
  match: SportMatch; stream: SportStream; onClose: () => void;
}) {
  const [src, setSrc] = useState(stream.embedUrl);
  const [alts, setAlts] = useState<SportStream[]>([stream]);
  const [altIdx, setAltIdx] = useState(0);
  const icon = SPORTS_ICONS[match.category] ?? SPORTS_ICONS.other;

  useEffect(() => {
    let dead = false;
    (async () => {
      const collected: SportStream[] = [];
      for (const s of match.sources) {
        try {
          const streams = (await fetch(
            `${STREAMED_API}/api/stream/${s.source}/${s.id}`,
          ).then((r) => r.json())) as SportStream[];
          collected.push(...streams.filter((x) => x.embedUrl));
        } catch { /* skip */ }
      }
      if (dead || collected.length === 0) return;
      // De-dup
      const seen = new Set<string>();
      const dedup = collected.filter((s) => !seen.has(s.embedUrl) && seen.add(s.embedUrl));
      const startIdx = Math.max(0, dedup.findIndex((s) => s.embedUrl === stream.embedUrl));
      setAlts(dedup);
      setAltIdx(startIdx);
    })();
    return () => { dead = true; };
  }, [match.id, stream.embedUrl, match.sources]);

  const switchTo = (i: number) => {
    const next = alts[i];
    if (!next) return;
    setAltIdx(i);
    setSrc(next.embedUrl);
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-black animate-[fadeIn_180ms_ease]">
      <div
        className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6"
        style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.95) 100%)" }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="text-2xl leading-none">{icon}</span>
          <div className="min-w-0">
            <div className="truncate text-sm font-black text-amber-50">{match.title}</div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/55">
              {match.category.replace(/-/g, " ")} · Stream {altIdx + 1}/{alts.length}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {alts.length > 1 && (
            <button
              onClick={() => switchTo((altIdx + 1) % alts.length)}
              className="liquid-glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white"
              title="Try another server"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Server
            </button>
          )}
          <button onClick={onClose} className="liquid-glass rounded-full p-2 text-white" aria-label="Close player">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="relative flex-1 overflow-hidden bg-black">
        <iframe
          key={src}
          src={src}
          title={match.title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
          className="absolute inset-0 h-full w-full"
        />
      </div>
    </div>
  );
}