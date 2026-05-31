const TMDB_BEARER =
  "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJlMWVmNjUwNjI1OTUyYzBkMjAzNThlYzUwYjQ4MjY5NiIsIm5iZiI6MTc3OTUwMDA3OS4zODIwMDAyLCJzdWIiOiI2YTExMDQyZjFiZTVlMDcyNTE2YjU3NmUiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.G2S8E4lZ8xdk1GJzkknjh_Z0DaHgaUKmk7kEUe0oCEU";

const BASE = "https://api.themoviedb.org/3";
export const IMG = (path: string | null | undefined, size: "w200" | "w300" | "w500" | "w780" | "original" = "w500") =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : "";

export type TmdbItem = {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  media_type?: "movie" | "tv";
};

export type MediaKind = "movie" | "tv";

async function tmdb<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${TMDB_BEARER}`, accept: "application/json" },
  });
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  return res.json() as Promise<T>;
}

type ListResp = { results: TmdbItem[] };

export const tmdbApi = {
  trending: (kind: MediaKind) => tmdb<ListResp>(`/trending/${kind}/week`).then((r) => r.results),
  popular: (kind: MediaKind) => tmdb<ListResp>(`/${kind}/popular`).then((r) => r.results),
  topRated: (kind: MediaKind) => tmdb<ListResp>(`/${kind}/top_rated`).then((r) => r.results),
  nowPlaying: () => tmdb<ListResp>(`/movie/now_playing`).then((r) => r.results),
  airing: () => tmdb<ListResp>(`/tv/on_the_air`).then((r) => r.results),
  byGenre: (kind: MediaKind, genreId: number) =>
    tmdb<ListResp>(`/discover/${kind}`, {
      with_genres: genreId,
      sort_by: "popularity.desc",
      "vote_count.gte": 50,
    }).then((r) => r.results),
  // International (filter by spoken language). Pass ISO 639-1 codes (ko, ja, fr, es, hi, …).
  international: (kind: MediaKind, lang: string) =>
    tmdb<ListResp>(`/discover/${kind}`, {
      with_original_language: lang,
      sort_by: "popularity.desc",
      "vote_count.gte": 30,
    }).then((r) => r.results),
  trendingAll: () => tmdb<ListResp>(`/trending/all/week`).then((r) => r.results),
  multiSearch: (query: string) =>
    tmdb<ListResp>(`/search/multi`, { query, include_adult: "false" }).then((r) => r.results),
  // Anime via discover (genre 16 + Japanese)
  animeTrending: () =>
    tmdb<ListResp>(`/discover/tv`, {
      with_genres: 16,
      with_original_language: "ja",
      sort_by: "popularity.desc",
    }).then((r) => r.results),
  animeTop: () =>
    tmdb<ListResp>(`/discover/tv`, {
      with_genres: 16,
      with_original_language: "ja",
      sort_by: "vote_average.desc",
      "vote_count.gte": 200,
    }).then((r) => r.results),
  animeMovies: () =>
    tmdb<ListResp>(`/discover/movie`, {
      with_genres: 16,
      with_original_language: "ja",
      sort_by: "popularity.desc",
    }).then((r) => r.results),
  search: (kind: MediaKind, query: string) =>
    tmdb<ListResp>(`/search/${kind}`, { query }).then((r) => r.results),
  details: (kind: MediaKind, id: number) =>
    tmdb<TmdbItem & {
      runtime?: number;
      episode_run_time?: number[];
      genres?: { id: number; name: string }[];
      tagline?: string;
      status?: string;
      number_of_seasons?: number;
      number_of_episodes?: number;
      seasons?: { season_number: number; episode_count: number; name: string; poster_path: string | null }[];
    }>(`/${kind}/${id}`),
  credits: (kind: MediaKind, id: number) =>
    tmdb<{ cast: { id: number; name: string; character: string; profile_path: string | null }[] }>(
      `/${kind}/${id}/credits`
    ),
  season: (showId: number, seasonNumber: number) =>
    tmdb<{ episodes: { id: number; episode_number: number; name: string; overview: string; still_path: string | null; runtime: number | null; air_date: string | null; vote_average: number }[] }>(
      `/tv/${showId}/season/${seasonNumber}`
    ),
  hiddenGems: (kind: MediaKind) =>
    tmdb<ListResp>(`/discover/${kind}`, {
      sort_by: "vote_average.desc",
      "vote_count.gte": 80,
      "vote_count.lte": 1200,
      "vote_average.gte": 7,
    }).then((r) => r.results),
  indieCult: (kind: MediaKind) =>
    tmdb<ListResp>(`/discover/${kind}`, {
      with_genres: kind === "movie" ? 18 : 18,
      sort_by: "vote_average.desc",
      "vote_count.gte": 200,
      "vote_count.lte": 5000,
    }).then((r) => r.results),
  a24Style: () =>
    tmdb<ListResp>(`/discover/movie`, {
      with_companies: "41077", // A24
      sort_by: "popularity.desc",
    }).then((r) => r.results),
  blockbusters: (kind: MediaKind) =>
    tmdb<ListResp>(`/discover/${kind}`, {
      sort_by: "revenue.desc",
      "vote_count.gte": 500,
    }).then((r) => r.results),
  criticallyAcclaimed: (kind: MediaKind) =>
    tmdb<ListResp>(`/discover/${kind}`, {
      sort_by: "vote_average.desc",
      "vote_count.gte": 2000,
    }).then((r) => r.results),
  familyNight: () =>
    tmdb<ListResp>(`/discover/movie`, {
      with_genres: "10751",
      sort_by: "popularity.desc",
    }).then((r) => r.results),
  thisYear: (kind: MediaKind) => {
    const y = new Date().getFullYear();
    const dateKey = kind === "movie" ? "primary_release_year" : "first_air_date_year";
    return tmdb<ListResp>(`/discover/${kind}`, {
      [dateKey]: y,
      sort_by: "popularity.desc",
    }).then((r) => r.results);
  },
  // Newest releases — sorted by release date so new movies surface automatically
  latestReleases: (kind: MediaKind) => {
    const today = new Date().toISOString().slice(0, 10);
    const dateKey = kind === "movie" ? "primary_release_date.lte" : "first_air_date.lte";
    return tmdb<ListResp>(`/discover/${kind}`, {
      [dateKey]: today,
      sort_by: kind === "movie" ? "primary_release_date.desc" : "first_air_date.desc",
      "vote_count.gte": 25,
    }).then((r) => r.results);
  },
};