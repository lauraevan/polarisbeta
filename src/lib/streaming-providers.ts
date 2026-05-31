export type StreamKind = "movie" | "tv";

export type Provider = {
  id: string;
  label: string;
  build: (kind: StreamKind, id: number, season?: number, episode?: number) => string;
};

// Vidfast rotating mirrors — pro primary, net secondary, then alternates listed on their site.
const VIDFAST_HOSTS = ["vidfast.pro", "vidfast.net", "vidfast.to", "vidfast.cc", "vidfast.io"];

const vidfast = (host: string): Provider => ({
  id: `vidfast-${host}`,
  label: `VidFast (${host})`,
  build: (kind, id, s, e) =>
    kind === "movie"
      ? `https://${host}/movie/${id}?autoPlay=true`
      : `https://${host}/tv/${id}/${s ?? 1}/${e ?? 1}?autoPlay=true`,
});

export const PROVIDERS: Provider[] = [
  {
    id: "vidlink",
    label: "VidLink",
    build: (kind, id, s, e) =>
      kind === "movie"
        ? `https://vidlink.pro/movie/${id}`
        : `https://vidlink.pro/tv/${id}/${s ?? 1}/${e ?? 1}`,
  },
  ...VIDFAST_HOSTS.map(vidfast),
  {
    id: "vidking",
    label: "VidKing",
    build: (kind, id, s, e) =>
      kind === "movie"
        ? `https://www.vidking.net/embed/movie/${id}`
        : `https://www.vidking.net/embed/tv/${id}/${s ?? 1}/${e ?? 1}`,
  },
  {
    id: "autoembed",
    label: "AutoEmbed",
    build: (kind, id, s, e) =>
      kind === "movie"
        ? `https://player.autoembed.cc/embed/movie/${id}`
        : `https://player.autoembed.cc/embed/tv/${id}/${s ?? 1}/${e ?? 1}`,
  },
  {
    id: "smashy",
    label: "SmashyStream",
    build: (kind, id, s, e) =>
      kind === "movie"
        ? `https://player.smashy.stream/movie/${id}`
        : `https://player.smashy.stream/tv/${id}?s=${s ?? 1}&e=${e ?? 1}`,
  },
  {
    id: "embedsu",
    label: "Embed.su",
    build: (kind, id, s, e) =>
      kind === "movie"
        ? `https://embed.su/embed/movie/${id}`
        : `https://embed.su/embed/tv/${id}/${s ?? 1}/${e ?? 1}`,
  },
  {
    id: "2embed",
    label: "2Embed",
    build: (kind, id, s, e) =>
      kind === "movie"
        ? `https://www.2embed.cc/embed/${id}`
        : `https://www.2embed.cc/embedtv/${id}&s=${s ?? 1}&e=${e ?? 1}`,
  },
];

// Additional mirrors / niche-friendly providers
PROVIDERS.push(
  {
    id: "vidsrc-to",
    label: "VidSrc.to",
    build: (kind, id, s, e) =>
      kind === "movie"
        ? `https://vidsrc.to/embed/movie/${id}`
        : `https://vidsrc.to/embed/tv/${id}/${s ?? 1}/${e ?? 1}`,
  },
  {
    id: "vidsrc-xyz",
    label: "VidSrc.xyz",
    build: (kind, id, s, e) =>
      kind === "movie"
        ? `https://vidsrc.xyz/embed/movie?tmdb=${id}`
        : `https://vidsrc.xyz/embed/tv?tmdb=${id}&season=${s ?? 1}&episode=${e ?? 1}`,
  },
  {
    id: "vidsrc-cc",
    label: "VidSrc.cc",
    build: (kind, id, s, e) =>
      kind === "movie"
        ? `https://vidsrc.cc/v2/embed/movie/${id}`
        : `https://vidsrc.cc/v2/embed/tv/${id}/${s ?? 1}/${e ?? 1}`,
  },
  {
    id: "moviesapi",
    label: "MoviesAPI",
    build: (kind, id, s, e) =>
      kind === "movie"
        ? `https://moviesapi.club/movie/${id}`
        : `https://moviesapi.club/tv/${id}-${s ?? 1}-${e ?? 1}`,
  },
  {
    id: "primewire",
    label: "Primewire",
    build: (kind, id, s, e) =>
      kind === "movie"
        ? `https://www.primewire.tf/embed/movie?tmdb=${id}`
        : `https://www.primewire.tf/embed/tv?tmdb=${id}&season=${s ?? 1}&episode=${e ?? 1}`,
  },
  {
    id: "rivestream",
    label: "RiveStream",
    build: (kind, id, s, e) =>
      kind === "movie"
        ? `https://rivestream.live/embed?type=movie&id=${id}`
        : `https://rivestream.live/embed?type=tv&id=${id}&season=${s ?? 1}&episode=${e ?? 1}`,
  },
  {
    id: "warezcdn",
    label: "WarezCDN",
    build: (kind, id, s, e) =>
      kind === "movie"
        ? `https://embed.warezcdn.com/filme/${id}`
        : `https://embed.warezcdn.com/serie/${id}/${s ?? 1}/${e ?? 1}`,
  },
);