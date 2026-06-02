import { useEffect, useMemo, useRef, useState } from "react";
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
  streams: { label: string; url: string }[];
};

type Category = "All" | "Sports" | "News" | "Entertainment" | "Movies" | "Kids" | "Music" | "Documentary";

// Direct public HLS feeds. No DaddyLive mirrors, no blocked iframe domains.
const CHANNELS: Channel[] = [
  { id: "nfl-channel", name: "NFL Channel", category: "Sports", domain: "nfl.com", emoji: "🏈", accent: "30 30 30", tagline: "NFL originals · highlights", popular: true, highlight: true, streams: [{ label: "NFL FAST", url: "https://pb-we3ltka9xobj6.akamaized.net/master.m3u8" }] },
  { id: "nba-tv", name: "NBA TV", category: "Sports", domain: "nba.com", emoji: "🏀", accent: "200 80 30", tagline: "Hoops coverage", popular: true, highlight: true, streams: [{ label: "NBA FAST", url: "https://amg00556-amg00556c3-firetv-us-6060.playouts.now.amagi.tv/playlist.m3u8" }, { label: "NBA alt", url: "https://pb-5pdyic0cu7tri.akamaized.net/NBA.m3u8" }] },
  { id: "pga-tour", name: "PGA Tour", category: "Sports", domain: "pgatour.com", emoji: "⛳", accent: "40 130 70", tagline: "Golf highlights · live windows", popular: true, streams: [{ label: "PGA Tour", url: "https://d11k1mnrgfposz.cloudfront.net/playlist.m3u8" }] },
  { id: "swerve-sports", name: "Swerve Sports", category: "Sports", domain: "swervesports.com", emoji: "🏟️", accent: "230 80 30", tagline: "Action sports · competitions", streams: [{ label: "Swerve", url: "https://linear-253.frequency.stream/mt/roku/253/hls/master/playlist.m3u8" }] },
  { id: "red-bull-tv", name: "Red Bull TV", category: "Sports", domain: "redbull.com", emoji: "🏁", accent: "200 30 30", tagline: "Racing · outdoor · culture", highlight: true, streams: [{ label: "Red Bull", url: "https://db34cc6127ac459db55cab5f97cd66b9.mediatailor.us-west-2.amazonaws.com/v1/master/ba62fe743df0fe93366eba3a257d792884136c7f/LINEAR-680-WORBAUENFAST-WHALETVPLUS/680/whaletvplus/hls/master/playlist.m3u8" }] },

  // News
  { id: "cbs-news", name: "CBS News 24/7", category: "News", domain: "cbsnews.com", emoji: "📰", accent: "30 70 180", tagline: "US news · 24/7", popular: true, highlight: true, streams: [{ label: "CBS primary", url: "https://cbsn-us-vtt.cbsnstream.cbsnews.com/out/v1/ef868690d34144509eda696884bf1619/master.m3u8" }, { label: "CBS alt", url: "https://cbsn-us.cbsnstream.cbsnews.com/out/v1/55a8648e8f134e82a470f83d562deeca/master.m3u8" }] },
  { id: "nbc-news-now", name: "NBC News NOW", category: "News", domain: "nbcnews.com", emoji: "📡", accent: "20 130 220", tagline: "Breaking news", popular: true, streams: [{ label: "NBC NOW", url: "https://d1si3n1st4nkgb.cloudfront.net/10502/88896001/hls/master.m3u8?ads.xumo_channelId=88896001" }, { label: "NBC alt", url: "https://d1bl6tskrpq9ze.cloudfront.net/hls/master.m3u8?ads.xumo_channelId=99984003" }] },
  { id: "livenow-fox", name: "LiveNOW from FOX", category: "News", domain: "fox.com", emoji: "🦊", accent: "30 60 160", tagline: "Live events · headlines", highlight: true, streams: [{ label: "LiveNOW", url: "https://cdn-uw2-prod.tsv2.amagi.tv/linear/amg00488-foxdigital-livenowbyfox-lgus/playlist.m3u8" }] },
  { id: "abc-news-au", name: "ABC News", category: "News", domain: "abc.net.au", emoji: "🌏", accent: "190 20 20", tagline: "World news", streams: [{ label: "ABC News", url: "https://abc-news-dmd-streams-1.akamaized.net/out/v1/701126012d044971b3fa89406a440133/index.m3u8" }, { label: "ABC alt", url: "https://c.mjh.nz/abc-news.m3u8" }] },
  { id: "bloomberg", name: "Bloomberg TV", category: "News", domain: "bloomberg.com", emoji: "💹", accent: "30 30 30", tagline: "Markets · business", popular: true, streams: [{ label: "Bloomberg US", url: "https://bloomberg.com/media-manifest/streams/us.m3u8" }, { label: "Bloomberg Europe", url: "https://bloomberg.com/media-manifest/streams/eu.m3u8" }, { label: "Bloomberg Asia", url: "https://bloomberg.com/media-manifest/streams/asia.m3u8" }] },
  { id: "reuters", name: "Reuters TV", category: "News", domain: "reuters.com", emoji: "🌍", accent: "230 110 30", tagline: "Global reporting", streams: [{ label: "Reuters", url: "https://amg00453-reuters-amg00453c1-rakuten-uk-2110.playouts.now.amagi.tv/playlist/amg00453-reuters-reuters-rakutenuk/playlist.m3u8" }] },
  { id: "euronews", name: "Euronews English", category: "News", domain: "euronews.com", emoji: "🇪🇺", accent: "20 80 180", tagline: "European news", streams: [{ label: "Euronews", url: "https://dash4.antik.sk/live/test_euronews/playlist.m3u8" }, { label: "Euronews alt", url: "https://a-cdn.klowdtv.com/live3/euronews_720p/playlist.m3u8" }] },
  { id: "accuweather", name: "AccuWeather NOW", category: "News", domain: "accuweather.com", emoji: "⛅", accent: "30 130 210", tagline: "Weather live", streams: [{ label: "AccuWeather", url: "https://cdn-ue1-prod.tsv2.amagi.tv/linear/amg00684-accuweather-accuweather-plex/playlist.m3u8" }] },

  // Entertainment
  { id: "failarmy", name: "FailArmy", category: "Entertainment", domain: "failarmy.com", emoji: "😂", accent: "230 80 30", tagline: "Viral clips", popular: true, streams: [{ label: "FailArmy", url: "https://failarmy-international-gb.samsung.wurl.tv/playlist.m3u8" }, { label: "FailArmy alt", url: "https://bd93cfed.wurl.com/master/f36d25e7e52f1ba8d7e56eb859c636563214f541/UmFrdXRlblRWLWV1X0ZhaWxBcm15X0hMUw/playlist.m3u8" }] },
  { id: "people-awesome", name: "People Are Awesome", category: "Entertainment", domain: "peopleareawesome.com", emoji: "🤯", accent: "120 60 200", tagline: "Stunts · skills", highlight: true, streams: [{ label: "People Are Awesome", url: "https://3ab76e42.wurl.com/master/f36d25e7e52f1ba8d7e56eb859c636563214f541/UmFrdXRlblRWLWV1X1Blb3BsZUFyZUF3ZXNvbWVfSExT/playlist.m3u8" }] },
  { id: "tastemade", name: "Tastemade", category: "Entertainment", domain: "tastemade.com", emoji: "🍜", accent: "230 120 40", tagline: "Food · travel", streams: [{ label: "Tastemade", url: "https://tmint-aus-samsungau.amagi.tv/playlist.m3u8" }, { label: "Tastemade Travel", url: "https://amg00047-tastemade-amg00047c3-cineverse-us-1360.playouts.now.amagi.tv/playlist/amg00047-tastemadefast-tastemadetravel-cineverseus/playlist.m3u8" }] },
  { id: "bon-appetit", name: "Bon Appétit", category: "Entertainment", domain: "bonappetit.com", emoji: "🍳", accent: "200 120 70", tagline: "Cooking shows", streams: [{ label: "Bon Appétit", url: "https://bonappetit-samsung.amagi.tv/playlist.m3u8" }] },

  // Movies
  { id: "moviesphere", name: "MovieSphere", category: "Movies", domain: "lionsgate.com", emoji: "🎞️", accent: "120 60 200", tagline: "Movies all day", popular: true, highlight: true, streams: [{ label: "MovieSphere", url: "https://amg00353-lionsgatefilmsi-moviesphereaus-samsungau-7qzhf.amagi.tv/playlist/amg00353-lionsgatefilmsi-moviesphereaus-samsungau/playlist.m3u8" }] },
  { id: "filmrise-classic", name: "FilmRise Classic TV", category: "Movies", domain: "filmrise.com", emoji: "📼", accent: "200 30 30", tagline: "Classic shows", popular: true, streams: [{ label: "FilmRise Classic", url: "https://d2tv4k5moji5m7.cloudfront.net/v1/master/3722c60a815c199d9c0ef36c5b73da68a62b09d1/cc-lu4pzh9l4b57p/master.m3u8" }] },
  { id: "filmrise-western", name: "FilmRise Western", category: "Movies", domain: "filmrise.com", emoji: "🤠", accent: "180 100 40", tagline: "Western movies", streams: [{ label: "FilmRise Western", url: "https://dz05z8iljgvbe.cloudfront.net/master.m3u8" }] },
  { id: "hallmark-movies", name: "Hallmark Movies & More", category: "Movies", domain: "hallmarkchannel.com", emoji: "💌", accent: "230 60 130", tagline: "Feel-good movies", streams: [{ label: "Hallmark", url: "https://pb-clwlfvkqpn19r.akamaized.net/Hallmark_Movies_&_More.m3u8" }] },
  { id: "maverick", name: "Maverick Black Cinema", category: "Movies", domain: "maverickentertainment.cc", emoji: "🍿", accent: "210 150 40", tagline: "Independent cinema", streams: [{ label: "Maverick", url: "https://maverick-maverick-black-cinema-3-us.roku.wurl.tv/playlist.m3u8" }] },

  // Kids
  { id: "pbs-kids", name: "PBS Kids", category: "Kids", domain: "pbskids.org", emoji: "🐰", accent: "40 160 90", tagline: "Family favorites", popular: true, highlight: true, streams: [{ label: "PBS Kids", url: "https://livestream.pbskids.org/out/v1/14507d931bbe48a69287e4850e53443c/est.m3u8" }] },
  { id: "kartoon", name: "Kartoon Channel!", category: "Kids", domain: "kartoonchannel.com", emoji: "🦸", accent: "230 110 30", tagline: "Animated shows", popular: true, streams: [{ label: "Kartoon", url: "https://lightning-fnf-samsungaus.amagi.tv/playlist.m3u8" }] },
  { id: "filmrise-anime", name: "FilmRise Anime", category: "Kids", domain: "filmrise.com", emoji: "🌸", accent: "230 60 130", tagline: "Anime channel", streams: [{ label: "FilmRise Anime", url: "https://dvu7aia8rjlfm.cloudfront.net/master.m3u8" }] },

  // Music
  { id: "vevo-pop", name: "Vevo Pop", category: "Music", domain: "vevo.com", emoji: "🎵", accent: "230 60 30", tagline: "Music videos", popular: true, streams: [{ label: "Vevo Pop", url: "https://d128y56w6v2kax.cloudfront.net/playlist/amg00056-vevotv-vevopopau-samsungau/playlist.m3u8" }] },
  { id: "qello", name: "Qello Concerts", category: "Music", domain: "stingray.com", emoji: "🎸", accent: "120 60 200", tagline: "Concerts live", streams: [{ label: "Qello", url: "https://d39g1vxj2ef6in.cloudfront.net/v1/master/3fec3e5cac39a52b2132f9c66c83dae043dc17d4/prod-rakuten-stitched/master.m3u8?ads.xumo_channelId=88883052" }] },

  // Documentary
  { id: "pbs-nature", name: "PBS Nature", category: "Documentary", domain: "pbs.org", emoji: "🌋", accent: "120 180 40", tagline: "Earth · wildlife", popular: true, highlight: true, streams: [{ label: "PBS Nature", url: "https://amg02333-pbs-amg02333c11-firetv-us-4242.playouts.now.amagi.tv/playlist.m3u8" }] },
  { id: "naturetime", name: "NatureTime", category: "Documentary", domain: "lovenature.com", emoji: "🦁", accent: "90 160 80", tagline: "Wildlife stories", streams: [{ label: "NatureTime", url: "https://amg00090-blueantllc-lovenature-au-samsungau-wggcn.amagi.tv/playlist/amg00090-blueantllc-lovenature-au-samsungau/playlist.m3u8" }] },
  { id: "court-tv", name: "Court TV", category: "Documentary", domain: "courttv.com", emoji: "⚖️", accent: "30 80 180", tagline: "Trials · true crime", popular: true, streams: [{ label: "Court TV", url: "https://cdn-uw2-prod.tsv2.amagi.tv/linear/amg01438-ewscrippscompan-courttv-tablo/playlist.m3u8" }] },
  { id: "xplore-tv", name: "Xplore TV", category: "Documentary", domain: "xplore.com", emoji: "🔭", accent: "120 60 200", tagline: "Adventure docs", streams: [{ label: "Xplore", url: "https://cdn-uw2-prod.tsv2.amagi.tv/linear/amg00111-hearstmediaprod-xploreintlnl-samsungnl/playlist.m3u8" }] },
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
// Player frame for 24/7 channels — direct HLS video, no DaddyLive iframe hosts.
// ----------------------------------------------------------------------------
function ChannelPlayerFrame({ channel }: { channel: Channel }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streamIdx, setStreamIdx] = useState(0);
  const [status, setStatus] = useState("Connecting…");
  const stream = channel.streams[streamIdx % channel.streams.length];

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;

    let cancelled = false;
    let hls: {
      destroy: () => void;
      loadSource: (url: string) => void;
      attachMedia: (media: HTMLMediaElement) => void;
      on: (event: string, callback: (...args: any[]) => void) => void;
    } | null = null;
    setStatus("Connecting…");

    const tryPlay = async () => {
      try {
        await video.play();
        if (!cancelled) setStatus("");
      } catch {
        if (!cancelled) setStatus("Press play if autoplay is blocked.");
      }
    };

    video.pause();
    video.removeAttribute("src");
    video.load();
    video.onerror = () => {
      if (!cancelled) setStatus("Stream failed — try another source.");
    };

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = stream.url;
      video.onloadedmetadata = tryPlay;
    } else {
      void import("hls.js").then(({ default: Hls }) => {
        if (cancelled || !video) return;
        if (!Hls.isSupported()) {
          setStatus("This browser can't play this live stream.");
          return;
        }
        hls = new Hls({ lowLatencyMode: true, maxBufferLength: 24, enableWorker: true });
        hls.loadSource(stream.url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, tryPlay);
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal && !cancelled) setStatus("Stream failed — try another source.");
        });
      }).catch(() => {
        if (!cancelled) setStatus("Player failed to load.");
      });
    }

    return () => {
      cancelled = true;
      video.onerror = null;
      video.onloadedmetadata = null;
      hls?.destroy();
    };
  }, [channel.id, stream]);

  if (!stream) {
    return (
      <div className="absolute inset-0 grid place-items-center text-sm text-white/60">
        This channel doesn't have a direct stream yet.
      </div>
    );
  }

  return (
    <>
      <video
        key={`${channel.id}-${streamIdx}`}
        ref={videoRef}
        className="absolute inset-0 h-full w-full bg-black object-contain"
        controls
        autoPlay
        playsInline
      />
      {status && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/35 text-sm font-semibold text-white/80">
          <span className="liquid-glass flex items-center gap-2 rounded-full px-4 py-2">
            {status === "Connecting…" && <Loader2 className="h-4 w-4 animate-spin" />}
            {status}
          </span>
        </div>
      )}
      <div className="absolute right-3 top-3 flex items-center gap-1.5">
        {channel.streams.length > 1 && (
          <button
            onClick={() => setStreamIdx((i) => (i + 1) % channel.streams.length)}
            className="liquid-glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold text-white"
            title="Try another stream source"
          >
            <RefreshCw className="h-3 w-3" /> Source {streamIdx + 1}/{channel.streams.length} · {stream.label}
          </button>
        )}
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