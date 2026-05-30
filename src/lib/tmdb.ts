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
    tmdb<TmdbItem & { number_of_seasons?: number; seasons?: { season_number: number; episode_count: number; name: string }[] }>(
      `/${kind}/${id}`
    ),
};