import { useMemo, useState } from "react";
import { Radio, Search, X, Tv2, Trophy, Newspaper, Film, Music2, Baby, FlaskConical, Globe2, Flame, Star } from "lucide-react";

type Channel = {
  id: string;
  name: string;
  category: Category;
  logo: string; // URL
  tagline?: string;
  popular?: boolean;
  highlight?: boolean;
};

type Category = "All" | "Sports" | "News" | "Entertainment" | "Movies" | "Kids" | "Music" | "Documentary";

const SRC = "https://toustream.glseries.net/live-tv.html";
const LOGO = (q: string) =>
  `https://logo.clearbit.com/${q}`;

const CHANNELS: Channel[] = [
  // Sports
  { id: "sky-sports", name: "Sky Sports", category: "Sports", logo: LOGO("skysports.com"), tagline: "Premier League · F1 · Boxing", popular: true, highlight: true },
  { id: "espn", name: "ESPN", category: "Sports", logo: LOGO("espn.com"), tagline: "NFL · NBA · UFC", popular: true, highlight: true },
  { id: "bt-sport", name: "TNT Sports", category: "Sports", logo: LOGO("tntsports.co.uk"), tagline: "UCL · Premiership Rugby" },
  { id: "fox-sports", name: "FOX Sports", category: "Sports", logo: LOGO("foxsports.com"), tagline: "MLB · College Football" },
  { id: "nba-tv", name: "NBA TV", category: "Sports", logo: LOGO("nba.com"), tagline: "League Pass · Live Games", popular: true },
  { id: "dazn", name: "DAZN", category: "Sports", logo: LOGO("dazn.com"), tagline: "Boxing · MMA" },

  // News
  { id: "bbc-news", name: "BBC News", category: "News", logo: LOGO("bbc.co.uk"), tagline: "Global news · 24/7", popular: true, highlight: true },
  { id: "cnn", name: "CNN", category: "News", logo: LOGO("cnn.com"), tagline: "Breaking news", popular: true },
  { id: "sky-news", name: "Sky News", category: "News", logo: LOGO("sky.com"), tagline: "UK & World" },
  { id: "al-jazeera", name: "Al Jazeera", category: "News", logo: LOGO("aljazeera.com"), tagline: "International perspectives" },
  { id: "fox-news", name: "FOX News", category: "News", logo: LOGO("foxnews.com"), tagline: "US politics" },
  { id: "msnbc", name: "MSNBC", category: "News", logo: LOGO("msnbc.com"), tagline: "Analysis & commentary" },

  // Entertainment
  { id: "bbc-one", name: "BBC One", category: "Entertainment", logo: LOGO("bbc.co.uk"), tagline: "Flagship UK channel", popular: true, highlight: true },
  { id: "itv", name: "ITV", category: "Entertainment", logo: LOGO("itv.com"), tagline: "Drama · Reality" },
  { id: "channel4", name: "Channel 4", category: "Entertainment", logo: LOGO("channel4.com"), tagline: "Bold storytelling" },
  { id: "abc", name: "ABC", category: "Entertainment", logo: LOGO("abc.com"), tagline: "US prime time" },
  { id: "nbc", name: "NBC", category: "Entertainment", logo: LOGO("nbc.com"), tagline: "SNL · Late Night" },
  { id: "cbs", name: "CBS", category: "Entertainment", logo: LOGO("cbs.com"), tagline: "Drama · Comedy" },

  // Movies
  { id: "hbo", name: "HBO", category: "Movies", logo: LOGO("hbo.com"), tagline: "Premium cinema", popular: true, highlight: true },
  { id: "amc", name: "AMC", category: "Movies", logo: LOGO("amc.com"), tagline: "Cinematic series" },
  { id: "tcm", name: "Turner Classics", category: "Movies", logo: LOGO("tcm.com"), tagline: "Classic cinema" },
  { id: "fxm", name: "FX Movies", category: "Movies", logo: LOGO("fxnetworks.com"), tagline: "Blockbusters & cult" },

  // Kids
  { id: "cartoon-network", name: "Cartoon Network", category: "Kids", logo: LOGO("cartoonnetwork.com"), tagline: "Animation hub", popular: true },
  { id: "disney-channel", name: "Disney Channel", category: "Kids", logo: LOGO("disney.com"), tagline: "Family favorites", popular: true },
  { id: "nick", name: "Nickelodeon", category: "Kids", logo: LOGO("nick.com"), tagline: "SpongeBob & more" },
  { id: "boomerang", name: "Boomerang", category: "Kids", logo: LOGO("boomerang.com"), tagline: "Retro toons" },

  // Music
  { id: "mtv", name: "MTV", category: "Music", logo: LOGO("mtv.com"), tagline: "Pop & culture", popular: true },
  { id: "vh1", name: "VH1", category: "Music", logo: LOGO("vh1.com"), tagline: "Hits & throwbacks" },
  { id: "mtv-live", name: "MTV Live", category: "Music", logo: LOGO("mtv.com"), tagline: "Concert specials" },

  // Documentary
  { id: "natgeo", name: "National Geographic", category: "Documentary", logo: LOGO("nationalgeographic.com"), tagline: "Earth · Science", popular: true, highlight: true },
  { id: "discovery", name: "Discovery", category: "Documentary", logo: LOGO("discovery.com"), tagline: "Real-world adventures" },
  { id: "history", name: "History", category: "Documentary", logo: LOGO("history.com"), tagline: "Stories that shaped us" },
  { id: "animal-planet", name: "Animal Planet", category: "Documentary", logo: LOGO("animalplanet.com"), tagline: "Wildlife stories" },
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

export function LiveTV() {
  const [cat, setCat] = useState<Category>("All");
  const [q, setQ] = useState("");
  const [playing, setPlaying] = useState<Channel | null>(null);

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
                      <img src={c.logo} alt="" className="h-4 w-4 rounded-sm bg-white object-contain" />
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
                    <img src={c.logo} alt={c.name} className="h-10 w-10 rounded bg-white object-contain p-1" />
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

      {playing && <LivePlayer channel={playing} onClose={() => setPlaying(null)} />}
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
          className="group relative flex w-40 shrink-0 flex-col items-center gap-2 rounded-xl border border-amber-100/10 bg-gradient-to-b from-stone-900/80 to-stone-950/90 p-3 transition hover:-translate-y-0.5 hover:border-amber-200/40 hover:shadow-[0_18px_50px_-15px_rgba(255,170,90,0.45)]"
        >
          <div className="grid h-16 w-16 place-items-center rounded-lg bg-white">
            <img src={c.logo} alt={c.name} className="h-12 w-12 object-contain" />
          </div>
          <div className="text-center">
            <div className="truncate text-sm font-bold text-amber-50">{c.name}</div>
            {c.tagline && <div className="line-clamp-1 text-[10px] text-white/55">{c.tagline}</div>}
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
      className="group relative flex flex-col items-center gap-2 rounded-xl border border-amber-100/10 bg-gradient-to-b from-stone-900/80 to-stone-950/90 p-3 transition hover:-translate-y-0.5 hover:border-amber-200/40 hover:shadow-[0_18px_50px_-15px_rgba(255,170,90,0.45)]"
    >
      <div className="grid h-14 w-14 place-items-center rounded-lg bg-white">
        <img src={c.logo} alt={c.name} className="h-10 w-10 object-contain" />
      </div>
      <div className="w-full text-center">
        <div className="truncate text-xs font-bold text-amber-50">{c.name}</div>
        {c.tagline && <div className="line-clamp-1 text-[10px] text-white/50">{c.tagline}</div>}
      </div>
      <span className="absolute right-1.5 top-1.5 rounded-full bg-rose-500/90 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-white">Live</span>
    </button>
  );
}

function LivePlayer({ channel, onClose }: { channel: Channel; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-black/95 backdrop-blur-2xl animate-[fadeIn_180ms_ease]">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-white">
            <img src={channel.logo} alt="" className="h-7 w-7 object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-sm font-black text-amber-50">
              <Radio className="h-3.5 w-3.5 text-rose-400" /> {channel.name}
            </div>
            {channel.tagline && <div className="text-[11px] text-white/55">{channel.tagline}</div>}
          </div>
        </div>
        <button onClick={onClose} className="liquid-glass rounded-full p-2 text-white" aria-label="Close player">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="relative flex-1 overflow-hidden bg-black">
        <iframe
          src={SRC}
          title={`${channel.name} — Live`}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="no-referrer"
          className="absolute inset-0 h-full w-full"
        />
      </div>
      <div className="px-4 py-2 text-center text-[11px] text-white/45 sm:px-6">
        Streaming via toustream · pick a channel inside the player to switch feeds.
      </div>
    </div>
  );
}