import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Film, Tv2, Sparkles, X } from "lucide-react";
import { tmdbApi, IMG, type TmdbItem, type MediaKind } from "@/lib/tmdb";
import { Row } from "./Row";
import { MovieModal } from "./MovieModal";
import { Player } from "./Player";
import { PolarisFlixSplash } from "./Splash";
import { MyListProvider, useMyList } from "@/lib/mylist-context";

type Tab = "movies" | "shows" | "anime";

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

function Hero({ item, onPlay, onInfo }: { item: TmdbItem; onPlay: () => void; onInfo: () => void }) {
  return (
    <div className="relative mb-6 h-[42vh] min-h-[280px] overflow-hidden rounded-2xl mx-4 sm:mx-6">
      {item.backdrop_path && (
        <img
          src={IMG(item.backdrop_path, "original")}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent" />
      <div className="relative flex h-full max-w-2xl flex-col justify-end p-6">
        <h1 className="text-3xl font-black text-white drop-shadow md:text-5xl">
          {item.title || item.name}
        </h1>
        <p className="mt-2 line-clamp-2 text-sm text-white/80 md:text-base">{item.overview}</p>
        <div className="mt-4 flex gap-2">
          <button
            onClick={onPlay}
            className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-white/90"
          >
            ▶ Play
          </button>
          <button
            onClick={onInfo}
            className="liquid-glass rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
          >
            More info
          </button>
        </div>
      </div>
    </div>
  );
}

function FlixInner() {
  const [splash, setSplash] = useState(true);
  const [tab, setTab] = useState<Tab>("movies");
  const [selected, setSelected] = useState<{ item: TmdbItem; kind: MediaKind } | null>(null);
  const [playing, setPlaying] = useState<{ item: TmdbItem; kind: MediaKind } | null>(null);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const { list } = useMyList();

  const kind: MediaKind = tab === "movies" ? "movie" : "tv";

  const trending = useQuery({
    queryKey: ["trending", tab],
    queryFn: () =>
      tab === "anime" ? tmdbApi.animeTrending() : tmdbApi.trending(kind),
  });
  const popular = useQuery({
    queryKey: ["popular", tab],
    queryFn: () => (tab === "anime" ? tmdbApi.animeTrending() : tmdbApi.popular(kind)),
  });
  const topRated = useQuery({
    queryKey: ["top", tab],
    queryFn: () => (tab === "anime" ? tmdbApi.animeTop() : tmdbApi.topRated(kind)),
  });
  const extra = useQuery({
    queryKey: ["extra", tab],
    queryFn: () =>
      tab === "movies"
        ? tmdbApi.nowPlaying()
        : tab === "shows"
          ? tmdbApi.airing()
          : tmdbApi.animeMovies(),
  });

  const genres = tab === "shows" ? TV_GENRES : tab === "movies" ? MOVIE_GENRES : [];

  const search = useQuery({
    queryKey: ["search", tab, query],
    queryFn: () => tmdbApi.search(kind, query),
    enabled: searchOpen && query.trim().length > 1,
  });

  const hero = useMemo(() => trending.data?.[0], [trending.data]);
  const myListForTab = list.filter((i) => i.kind === kind);

  const tabs: { id: Tab; label: string; icon: typeof Film }[] = [
    { id: "movies", label: "Movies", icon: Film },
    { id: "shows", label: "Shows", icon: Tv2 },
    { id: "anime", label: "Anime", icon: Sparkles },
  ];

  return (
    <>
      {splash && <PolarisFlixSplash onDone={() => setSplash(false)} />}

      <div className="min-h-screen pb-32">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-3 px-4 pt-4 pb-3 sm:px-6">
          <div className="liquid-glass-strong flex w-full items-center gap-2 rounded-2xl px-3 py-2">
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
              className="rounded-xl p-2 text-white/85 hover:bg-white/10"
              aria-label="Search"
            >
              {searchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
            </button>
          </div>
        </header>

        {searchOpen && (
          <div className="px-4 sm:px-6">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${tab}...`}
              className="liquid-glass w-full rounded-xl bg-transparent px-4 py-3 text-white placeholder:text-white/40 focus:outline-none"
            />
            {search.data && (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {search.data.slice(0, 20).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelected({ item, kind })}
                    className="liquid-glass overflow-hidden rounded-xl transition hover:scale-[1.03]"
                  >
                    {item.poster_path ? (
                      <img src={IMG(item.poster_path, "w300")} alt="" className="aspect-[2/3] w-full object-cover" />
                    ) : (
                      <div className="aspect-[2/3] w-full p-2 text-xs text-white/60">{item.title || item.name}</div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {!searchOpen && (
          <>
            {hero && (
              <Hero
                item={hero}
                onPlay={() => setPlaying({ item: hero, kind })}
                onInfo={() => setSelected({ item: hero, kind })}
              />
            )}

            <Row
              title={`Top 10 ${tab === "movies" ? "Movies" : tab === "shows" ? "Shows" : "Anime"} Today`}
              items={trending.data ?? []}
              ranked
              loading={trending.isLoading}
              onSelect={(item) => setSelected({ item, kind })}
            />

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
  return (
    <MyListProvider>
      <FlixInner />
    </MyListProvider>
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