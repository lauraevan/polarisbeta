import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Film, Tv2, Sparkles, X, Home as HomeIcon, Play, Info, Radio, Shuffle } from "lucide-react";
import { tmdbApi, IMG, type TmdbItem, type MediaKind } from "@/lib/tmdb";
import { Row } from "./Row";
import { MovieModal } from "./MovieModal";
import { Player } from "./Player";
import { PolarisFlixSplash } from "./Splash";
import { LiveTV } from "./LiveTV";
import { Roulette } from "./Roulette";
import { useMyList } from "@/lib/mylist-context";
import polarisLogo from "@/assets/polaris-logo.png";

type Tab = "home" | "movies" | "shows" | "anime" | "live" | "roulette";

// TMDB genre IDs. Movie and TV share many but not all.
const MOVIE_GENRES = [
  { id: 28, label: "Action" },
  { id: 35, label: "Comedy" },
  { id: 878, label: "Sci-Fi" },
  { id: 27, label: "Horror" },
  { id: 10749, label: "Romance" },
  { id: 53, label: "Thriller" },
  { id: 16, label: "Animation" },
  { id: 12, label: "Adventure" },
] as const;
const TV_GENRES = [
  { id: 10759, label: "Action & Adventure" },
  { id: 35, label: "Comedy" },
  { id: 10765, label: "Sci-Fi & Fantasy" },
  { id: 18, label: "Drama" },
  { id: 9648, label: "Mystery" },
  { id: 80, label: "Crime" },
  { id: 10751, label: "Family" },
] as const;

// International language filters
const LANGUAGES = [
  { code: "", label: "All Languages" },
  { code: "en", label: "English" },
  { code: "ko", label: "Korean" },
  { code: "ja", label: "Japanese" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "hi", label: "Hindi" },
  { code: "zh", label: "Chinese" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" },
  { code: "tr", label: "Turkish" },
] as const;

function Hero({
  items,
  onPlay,
  onInfo,
}: {
  items: TmdbItem[];
  onPlay: (item: TmdbItem) => void;
  onInfo: (item: TmdbItem) => void;
}) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % Math.min(items.length, 5)), 8000);
    return () => clearInterval(t);
  }, [items.length]);
  const item = items[i];
  if (!item) return null;
  return (
    <div className="relative mb-6 h-[52vh] min-h-[340px] overflow-hidden rounded-2xl mx-4 sm:mx-6">
      {items.slice(0, 5).map((it, idx) => (
        <div
          key={it.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-out ${idx === i ? "opacity-100" : "opacity-0"}`}
        >
          {it.backdrop_path && (
            <img
              src={IMG(it.backdrop_path, "w780")}
              alt=""
              loading={idx === 0 ? "eager" : "lazy"}
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover scale-105"
              style={{ animation: idx === i ? "kenburns 9s ease-out forwards" : undefined }}
            />
          )}
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />
      <div className="relative flex h-full max-w-2xl flex-col justify-end p-6 sm:p-8">
        <div className="mb-2 text-[10px] uppercase tracking-[0.3em] text-white/65">Featured · Top 5 this week</div>
        <h1 className="text-3xl font-black text-white drop-shadow md:text-5xl">
          {item.title || item.name}
        </h1>
        <p className="mt-2 line-clamp-2 text-sm text-white/80 md:text-base">{item.overview}</p>
        <div className="mt-5 flex items-center gap-2.5">
          <button
            onClick={() => onPlay(item)}
            className="flex items-center gap-2 rounded-xl px-7 py-3 text-base font-bold text-black shadow-lg transition hover:brightness-110"
            style={{ backgroundColor: "rgb(var(--polaris-accent))", boxShadow: "0 10px 30px -10px rgb(var(--polaris-accent) / 0.6)" }}
          >
            <Play className="h-5 w-5 fill-black" /> Watch Now
          </button>
          <button
            onClick={() => onInfo(item)}
            className="liquid-glass flex items-center gap-2 rounded-xl px-6 py-3 text-base font-semibold text-white"
          >
            <Info className="h-5 w-5" /> More Info
          </button>
          <div className="ml-3 hidden gap-1.5 sm:flex">
            {items.slice(0, 5).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setI(idx)}
                className={`h-1.5 rounded-full transition-all ${idx === i ? "w-8" : "w-1.5 bg-white/40 hover:bg-white/70"}`}
                style={idx === i ? { backgroundColor: "rgb(var(--polaris-accent))" } : undefined}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

type ViewerProfile = { id: string; label: string; emoji: string; tint: string; kids?: boolean };
const VIEWERS: ViewerProfile[] = [
  { id: "polaris", label: "Polaris User", emoji: "", tint: "from-orange-500/60 to-amber-400/30" },
  { id: "kids", label: "Kids", emoji: "", tint: "from-amber-400/70 to-rose-500/40", kids: true },
];
const VIEWER_KEY = "polaris-flix-viewer";

function WhosWatching({ onPick }: { onPick: (v: ViewerProfile) => void }) {
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/85 backdrop-blur-2xl animate-[fadeIn_220ms_ease]">
      <div className="px-6 text-center">
        <h2 className="mb-10 text-3xl font-light text-white md:text-5xl">Who's watching?</h2>
        <div className="flex items-start justify-center gap-8 md:gap-14">
          {VIEWERS.map((v) => (
            <button
              key={v.id}
              onClick={() => onPick(v)}
              className="group flex flex-col items-center gap-3"
            >
              <div
                className={`grid h-28 w-28 place-items-center rounded-2xl bg-gradient-to-br ${v.tint} p-4 shadow-2xl ring-1 ring-white/10 transition group-hover:scale-105 group-hover:ring-white md:h-36 md:w-36`}
              >
                <img src={polarisLogo} alt="Polaris" className="h-full w-full object-contain drop-shadow-[0_4px_16px_rgba(255,140,40,0.55)]" />
              </div>
              <div className="text-base font-medium text-white/70 group-hover:text-white">
                {v.label}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function FlixInner() {
  const [splash, setSplash] = useState(true);
  const [tab, setTab] = useState<Tab>("home");
  // Viewer selection ("who's watching") removed — go straight into Polaris.
  const [selected, setSelected] = useState<{ item: TmdbItem; kind: MediaKind } | null>(null);
  const [playing, setPlaying] = useState<{ item: TmdbItem; kind: MediaKind } | null>(null);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchType, setSearchType] = useState<"all" | "movie" | "tv">("all");
  const [searchLang, setSearchLang] = useState<string>("");
  const { list } = useMyList();

  const kind: MediaKind = tab === "movies" ? "movie" : "tv";
  const inferKind = (item: TmdbItem): MediaKind =>
    item.media_type === "movie" || item.media_type === "tv"
      ? item.media_type
      : item.title
        ? "movie"
        : "tv";

  const trendingAll = useQuery({
    queryKey: ["trending-all"],
    queryFn: () => tmdbApi.trendingAll(),
    enabled: tab === "home",
    refetchInterval: 1000 * 60 * 30,
    staleTime: 1000 * 60 * 10,
  });
  const homeMovies = useQuery({
    queryKey: ["home-movies"], queryFn: () => tmdbApi.popular("movie"), enabled: tab === "home",
  });
  const homeShows = useQuery({
    queryKey: ["home-shows"], queryFn: () => tmdbApi.popular("tv"), enabled: tab === "home",
  });
  const homeAnime = useQuery({
    queryKey: ["home-anime"], queryFn: () => tmdbApi.animeTrending(), enabled: tab === "home",
  });
  const hiddenGemsMovies = useQuery({
    queryKey: ["hidden-gems-movies"], queryFn: () => tmdbApi.hiddenGems("movie"), enabled: tab === "home" || tab === "movies",
  });
  const indieCult = useQuery({
    queryKey: ["indie-cult"], queryFn: () => tmdbApi.indieCult("movie"), enabled: tab === "home" || tab === "movies",
  });
  const a24 = useQuery({
    queryKey: ["a24"], queryFn: () => tmdbApi.a24Style(), enabled: tab === "home" || tab === "movies",
  });
  const blockbustersMovies = useQuery({
    queryKey: ["blockbusters-movies"], queryFn: () => tmdbApi.blockbusters("movie"), enabled: tab === "home" || tab === "movies",
  });
  const acclaimedMovies = useQuery({
    queryKey: ["acclaimed-movies"], queryFn: () => tmdbApi.criticallyAcclaimed("movie"), enabled: tab === "home" || tab === "movies",
  });
  const familyMovies = useQuery({
    queryKey: ["family-movies"], queryFn: () => tmdbApi.familyNight(), enabled: tab === "home" || tab === "movies",
  });
  const thisYearMovies = useQuery({
    queryKey: ["thisyear-movies"], queryFn: () => tmdbApi.thisYear("movie"), enabled: tab === "home" || tab === "movies",
  });

  const trending = useQuery({
    queryKey: ["trending", tab],
    queryFn: () =>
      tab === "anime" ? tmdbApi.animeTrending() : tmdbApi.trending(kind),
    enabled: tab !== "home",
    refetchInterval: 1000 * 60 * 30,
    staleTime: 1000 * 60 * 10,
  });
  const popular = useQuery({
    queryKey: ["popular", tab],
    queryFn: () => (tab === "anime" ? tmdbApi.animeTrending() : tmdbApi.popular(kind)),
    enabled: tab !== "home",
    refetchInterval: 1000 * 60 * 30,
    staleTime: 1000 * 60 * 10,
  });
  const topRated = useQuery({
    queryKey: ["top", tab],
    queryFn: () => (tab === "anime" ? tmdbApi.animeTop() : tmdbApi.topRated(kind)),
    enabled: tab !== "home",
  });
  const extra = useQuery({
    queryKey: ["extra", tab],
    queryFn: () =>
      tab === "movies"
        ? tmdbApi.nowPlaying()
        : tab === "shows"
          ? tmdbApi.airing()
          : tmdbApi.animeMovies(),
    enabled: tab !== "home",
  });

  const latestMovies = useQuery({
    queryKey: ["latest-movies"],
    queryFn: () => tmdbApi.latestReleases("movie"),
    enabled: tab === "home" || tab === "movies",
    refetchInterval: 1000 * 60 * 30,
    staleTime: 1000 * 60 * 10,
  });
  const latestShows = useQuery({
    queryKey: ["latest-shows"],
    queryFn: () => tmdbApi.latestReleases("tv"),
    enabled: tab === "shows",
    refetchInterval: 1000 * 60 * 30,
    staleTime: 1000 * 60 * 10,
  });

  const genres = tab === "shows" ? TV_GENRES : tab === "movies" ? MOVIE_GENRES : [];

  // Netflix-style multi-search with type & language filters
  const search = useQuery({
    queryKey: ["search", searchType, searchLang, query],
    queryFn: async () => {
      const q = query.trim();
      if (searchType === "all") {
        const r = await tmdbApi.multiSearch(q);
        return r.filter((i) => i.media_type === "movie" || i.media_type === "tv");
      }
      return tmdbApi.search(searchType, q);
    },
    enabled: searchOpen && query.trim().length > 1,
  });

  const intlMovies = useQuery({
    queryKey: ["intl-movies", searchLang],
    queryFn: () => tmdbApi.international("movie", searchLang || "en"),
    enabled: searchOpen && query.trim().length < 2,
    staleTime: 1000 * 60 * 10,
  });

  const heroSource = tab === "home" ? trendingAll.data : trending.data;
  const heroItems = useMemo(() => (heroSource ?? []).slice(0, 5), [heroSource]);
  const myListForTab = list.filter((i) => i.kind === kind);

  const tabs: { id: Tab; label: string; icon: typeof Film }[] = [
    { id: "home", label: "Home", icon: HomeIcon },
    { id: "movies", label: "Movies", icon: Film },
    { id: "shows", label: "Shows", icon: Tv2 },
    { id: "anime", label: "Anime", icon: Sparkles },
    { id: "live", label: "Live TV", icon: Radio },
    { id: "roulette", label: "Roulette", icon: Shuffle },
  ];

  return (
    <>
      {splash && <PolarisFlixSplash onDone={() => setSplash(false)} />}

      <div className="relative min-h-screen pb-32">
        {/* Warm autumn overlay so the wallpaper feels cinematic */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(120% 60% at 50% 0%, rgba(255,150,55,0.26) 0%, rgba(200,70,25,0.14) 38%, rgba(0,0,0,0) 72%), radial-gradient(80% 50% at 100% 100%, rgba(255,90,40,0.18) 0%, rgba(0,0,0,0) 60%), linear-gradient(180deg, rgba(24,10,4,0.6) 0%, rgba(10,4,2,0.9) 100%)",
          }}
        />
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-3 px-4 pt-4 pb-3 sm:px-6">
          <div className="liquid-glass-themed flex w-full items-center gap-2 rounded-2xl px-3 py-2">
            <div className="flex items-center gap-2 pr-2">
              <span
                className="text-lg font-black tracking-tight"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(var(--polaris-accent)/1), #fff)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                PolarisFlix
              </span>
            </div>
            <span className="h-5 w-px bg-white/15" />
            <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
              {tabs.map((t) => {
                const Icon = t.icon;
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`relative flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm transition ${
                      active ? "text-white" : "text-white/60 hover:text-white"
                    }`}
                  >
                    {active && (
                      <span
                        className="absolute inset-0 rounded-xl"
                        style={{
                          background:
                            "linear-gradient(90deg, rgba(var(--polaris-accent)/0.25), rgba(var(--polaris-accent)/0.08))",
                          boxShadow:
                            "inset 0 0 0 1px rgba(var(--polaris-accent)/0.5)",
                        }}
                      />
                    )}
                    <Icon className="relative h-4 w-4" />
                    <span className="relative font-medium">{t.label}</span>
                  </button>
                );
              })}
            </nav>
            <button
              onClick={() => setSearchOpen((o) => !o)}
              className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20"
              aria-label="Search"
            >
              {searchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
              <span className="hidden sm:inline font-medium">{searchOpen ? "Close" : "Search"}</span>
            </button>
          </div>
        </header>

        {/* Netflix-style fullscreen search overlay */}
        {searchOpen && (
          <div className="fixed inset-0 z-40 overflow-y-auto bg-black/80 backdrop-blur-2xl animate-[fadeIn_180ms_ease]">
            <div className="mx-auto max-w-6xl px-4 pt-20 pb-32 sm:px-6">
              <button
                onClick={() => { setSearchOpen(false); setQuery(""); }}
                className="absolute right-5 top-5 liquid-glass rounded-full p-2 text-white"
                aria-label="Close search"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="liquid-glass-themed flex items-center gap-3 rounded-2xl px-5 py-4">
                <Search className="h-6 w-6 text-white/80" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Titles, genres, actors…"
                  className="flex-1 bg-transparent text-lg text-white placeholder:text-white/40 focus:outline-none"
                />
              </div>

              {/* Filters */}
              <div className="mt-4 flex flex-wrap gap-2">
                {(["all", "movie", "tv"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setSearchType(t)}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      searchType === t
                        ? "bg-white text-black"
                        : "liquid-glass text-white/85"
                    }`}
                  >
                    {t === "all" ? "All" : t === "movie" ? "Movies" : "Shows"}
                  </button>
                ))}
                <span className="mx-1 h-6 w-px self-center bg-white/15" />
                <select
                  value={searchLang}
                  onChange={(e) => setSearchLang(e.target.value)}
                  className="liquid-glass rounded-full bg-transparent px-3 py-1 text-xs text-white"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code} className="bg-black">{l.label}</option>
                  ))}
                </select>
              </div>

              {/* Results / International discovery when empty */}
              <div className="mt-6">
                {query.trim().length < 2 ? (
                  <>
                    <h3 className="mb-3 text-sm font-semibold text-white/80">
                      Popular {LANGUAGES.find((l) => l.code === (searchLang || "en"))?.label} cinema
                    </h3>
                    <Grid items={intlMovies.data ?? []} onSelect={(item) => setSelected({ item, kind: "movie" })} />
                  </>
                ) : search.data?.length ? (
                  <Grid
                    items={search.data}
                    onSelect={(item) =>
                      setSelected({ item, kind: searchType === "all" ? inferKind(item) : searchType })
                    }
                  />
                ) : (
                  <div className="py-12 text-center text-sm text-white/50">
                    {search.isFetching ? "Searching…" : "No results"}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!searchOpen && (
          <>
            {tab === "live" ? (
              <LiveTV />
            ) : tab === "roulette" ? (
              <Roulette embedded />
            ) : (
            <>
            {heroItems.length > 0 && (
              <Hero
                items={heroItems}
                onPlay={(it) => setPlaying({ item: it, kind: inferKind(it) })}
                onInfo={(it) => setSelected({ item: it, kind: inferKind(it) })}
              />
            )}

            {tab === "home" ? (
              <>
                <Row
                  title="Top 10 This Week"
                  items={trendingAll.data ?? []}
                  ranked
                  loading={trendingAll.isLoading}
                  onSelect={(item) => setSelected({ item, kind: inferKind(item) })}
                />
                <Row
                  title="Just Added"
                  items={latestMovies.data ?? []}
                  loading={latestMovies.isLoading}
                  onSelect={(item) => setSelected({ item, kind: "movie" })}
                />
                {myListForTab.length > 0 && (
                  <Row
                    title="My List"
                    items={list}
                    onSelect={(item) => setSelected({ item, kind: (item as any).kind || inferKind(item) })}
                  />
                )}
                <Row
                  title="Popular Movies"
                  items={homeMovies.data ?? []}
                  loading={homeMovies.isLoading}
                  onSelect={(item) => setSelected({ item, kind: "movie" })}
                />
                <Row
                  title="Popular Shows"
                  items={homeShows.data ?? []}
                  loading={homeShows.isLoading}
                  onSelect={(item) => setSelected({ item, kind: "tv" })}
                />
                <Row
                  title="Trending Anime"
                  items={homeAnime.data ?? []}
                  loading={homeAnime.isLoading}
                  onSelect={(item) => setSelected({ item, kind: "tv" })}
                />
                <Row
                  title="Hidden Gems"
                  items={hiddenGemsMovies.data ?? []}
                  loading={hiddenGemsMovies.isLoading}
                  onSelect={(item) => setSelected({ item, kind: "movie" })}
                />
                <Row
                  title="Indie & Cult"
                  items={indieCult.data ?? []}
                  loading={indieCult.isLoading}
                  onSelect={(item) => setSelected({ item, kind: "movie" })}
                />
                <Row
                  title="A24 Picks"
                  items={a24.data ?? []}
                  loading={a24.isLoading}
                  onSelect={(item) => setSelected({ item, kind: "movie" })}
                />
                <Row
                  title="Blockbuster Hits"
                  items={blockbustersMovies.data ?? []}
                  loading={blockbustersMovies.isLoading}
                  onSelect={(item) => setSelected({ item, kind: "movie" })}
                />
                <Row
                  title="Critically Acclaimed"
                  items={acclaimedMovies.data ?? []}
                  loading={acclaimedMovies.isLoading}
                  onSelect={(item) => setSelected({ item, kind: "movie" })}
                />
                <Row
                  title="Family Night"
                  items={familyMovies.data ?? []}
                  loading={familyMovies.isLoading}
                  onSelect={(item) => setSelected({ item, kind: "movie" })}
                />
                <Row
                  title={`New in ${new Date().getFullYear()}`}
                  items={thisYearMovies.data ?? []}
                  loading={thisYearMovies.isLoading}
                  onSelect={(item) => setSelected({ item, kind: "movie" })}
                />
              </>
            ) : (
            <>
            <Row
              title={`Top 10 ${tab === "movies" ? "Movies" : tab === "shows" ? "Shows" : "Anime"} Today`}
              items={trending.data ?? []}
              ranked
              loading={trending.isLoading}
              onSelect={(item) => setSelected({ item, kind })}
            />

            {tab !== "anime" && (
              <Row
                title="Just Added"
                items={(tab === "movies" ? latestMovies.data : latestShows.data) ?? []}
                loading={tab === "movies" ? latestMovies.isLoading : latestShows.isLoading}
                onSelect={(item) => setSelected({ item, kind })}
              />
            )}

            {myListForTab.length > 0 && (
              <Row
                title="My List"
                items={myListForTab}
                onSelect={(item) => setSelected({ item, kind })}
              />
            )}

            <Row
              title="Most Popular"
              items={popular.data ?? []}
              loading={popular.isLoading}
              onSelect={(item) => setSelected({ item, kind })}
            />
            <Row
              title={tab === "movies" ? "Now Playing" : tab === "shows" ? "On The Air" : "Anime Movies"}
              items={extra.data ?? []}
              loading={extra.isLoading}
              onSelect={(item) => setSelected({ item, kind })}
            />
            <Row
              title="Top Rated"
              items={topRated.data ?? []}
              loading={topRated.isLoading}
              onSelect={(item) => setSelected({ item, kind })}
            />
            {tab === "movies" && (
              <>
                <Row
                  title="Blockbuster Hits"
                  items={blockbustersMovies.data ?? []}
                  loading={blockbustersMovies.isLoading}
                  onSelect={(item) => setSelected({ item, kind: "movie" })}
                />
                <Row
                  title="Critically Acclaimed"
                  items={acclaimedMovies.data ?? []}
                  loading={acclaimedMovies.isLoading}
                  onSelect={(item) => setSelected({ item, kind: "movie" })}
                />
                <Row
                  title="Family Night"
                  items={familyMovies.data ?? []}
                  loading={familyMovies.isLoading}
                  onSelect={(item) => setSelected({ item, kind: "movie" })}
                />
                <Row
                  title={`New in ${new Date().getFullYear()}`}
                  items={thisYearMovies.data ?? []}
                  loading={thisYearMovies.isLoading}
                  onSelect={(item) => setSelected({ item, kind: "movie" })}
                />
                <Row
                  title="Hidden Gems"
                  items={hiddenGemsMovies.data ?? []}
                  loading={hiddenGemsMovies.isLoading}
                  onSelect={(item) => setSelected({ item, kind: "movie" })}
                />
                <Row
                  title="Indie & Cult"
                  items={indieCult.data ?? []}
                  loading={indieCult.isLoading}
                  onSelect={(item) => setSelected({ item, kind: "movie" })}
                />
                <Row
                  title="A24 Picks"
                  items={a24.data ?? []}
                  loading={a24.isLoading}
                  onSelect={(item) => setSelected({ item, kind: "movie" })}
                />
              </>
            )}
            {genres.map((g) => (
              <GenreRow
                key={g.id}
                kind={kind}
                genreId={g.id}
                label={g.label}
                onSelect={(item) => setSelected({ item, kind })}
              />
            ))}
            </>
            )}
            </>
            )}
          </>
        )}

        {/* Copyright disclaimer */}
        <div className="mx-4 sm:mx-6 mt-8 mb-4 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-center backdrop-blur-sm">
          <p className="text-[11px] text-white/50">
            We don't condone copyright infringement. Content is hosted by third-party streamers, not us.
          </p>
        </div>
      </div>

      {selected && (
        <MovieModal
          item={selected.item}
          kind={selected.kind}
          onClose={() => setSelected(null)}
          onPlay={() => {
            setPlaying(selected);
            setSelected(null);
          }}
        />
      )}

      {playing && (
        <Player
          kind={playing.kind}
          id={playing.item.id}
          title={playing.item.title || playing.item.name || "Now Playing"}
          onClose={() => setPlaying(null)}
        />
      )}
    </>
  );
}

export function PolarisFlix() {
  return <FlixInner />;
}

function Grid({ items, onSelect }: { items: TmdbItem[]; onSelect: (item: TmdbItem) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {items.slice(0, 30).map((item) => (
        <button
          key={`${item.media_type ?? ""}-${item.id}`}
          onClick={() => onSelect(item)}
          className="liquid-glass overflow-hidden rounded-xl text-left transition hover:scale-[1.04]"
        >
          {item.poster_path ? (
            <img src={IMG(item.poster_path, "w300")} alt="" className="aspect-[2/3] w-full object-cover" loading="lazy" />
          ) : (
            <div className="aspect-[2/3] w-full p-2 text-xs text-white/60">{item.title || item.name}</div>
          )}
          <div className="truncate px-2 py-1.5 text-[11px] font-medium text-white/90">{item.title || item.name}</div>
        </button>
      ))}
    </div>
  );
}

function GenreRow({
  kind,
  genreId,
  label,
  onSelect,
}: {
  kind: MediaKind;
  genreId: number;
  label: string;
  onSelect: (item: TmdbItem) => void;
}) {
  const q = useQuery({
    queryKey: ["genre", kind, genreId],
    queryFn: () => tmdbApi.byGenre(kind, genreId),
    staleTime: 1000 * 60 * 10,
  });
  return <Row title={label} items={q.data ?? []} loading={q.isLoading} onSelect={onSelect} />;
}