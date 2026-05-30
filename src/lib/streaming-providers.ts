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
  ...VIDFAST_HOSTS.map(vidfast),
  {
    id: "vidlink",
    label: "VidLink",
    build: (kind, id, s, e) =>
      kind === "movie"
        ? `https://vidlink.pro/movie/${id}`
        : `https://vidlink.pro/tv/${id}/${s ?? 1}/${e ?? 1}`,
  },
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