import { useEffect, useMemo, useState } from "react";
import { X, ChevronLeft, ChevronRight, AlertCircle, MessageSquare, List, Play, SkipForward } from "lucide-react";
import { PROVIDERS } from "@/lib/streaming-providers";
import { tmdbApi, IMG, type MediaKind } from "@/lib/tmdb";
import { useQuery } from "@tanstack/react-query";
import { MovieChat } from "./MovieChat";

type Props = {
  kind: MediaKind;
  id: number;
  title: string;
  onClose: () => void;
};

export function Player({ kind, id, title, onClose }: Props) {
  const [providerIdx, setProviderIdx] = useState(0);
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [chatOpen, setChatOpen] = useState(false);
  const [episodesOpen, setEpisodesOpen] = useState(false);

  const { data: details } = useQuery({
    queryKey: ["details", kind, id],
    queryFn: () => tmdbApi.details(kind, id),
    enabled: kind === "tv",
  });

  const seasons = useMemo(
    () => (details?.seasons ?? []).filter((s) => s.season_number > 0),
    [details]
  );
  const currentSeason = seasons.find((s) => s.season_number === season);
  const episodeCount = currentSeason?.episode_count ?? 1;

  // Episode metadata (titles, stills, descriptions) for the current season
  const { data: seasonData } = useQuery({
    queryKey: ["season", id, season],
    queryFn: () => tmdbApi.season(id, season),
    enabled: kind === "tv" && seasons.length > 0,
  });

  const goToEpisode = (s: number, e: number) => {
    setSeason(s);
    setEpisode(e);
    setEpisodesOpen(false);
  };

  const nextEpisode = () => {
    if (kind !== "tv") return;
    if (episode < episodeCount) {
      setEpisode((e) => e + 1);
      return;
    }
    // Move to next season
    const idx = seasons.findIndex((s) => s.season_number === season);
    const next = seasons[idx + 1];
    if (next) {
      setSeason(next.season_number);
      setEpisode(1);
    }
  };

  const provider = PROVIDERS[providerIdx];
  const src = provider.build(kind, id, season, episode);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[55] flex flex-col bg-black/95 backdrop-blur-xl">
      <div className="liquid-glass-strong flex flex-wrap items-center gap-3 rounded-none border-x-0 border-t-0 px-4 py-3">
        <button onClick={onClose} className="rounded-lg p-2 text-white/85 hover:bg-white/10" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-white">
            {title}
            {kind === "tv" && (
              <span className="ml-2 text-white/55 font-normal">· S{season} E{episode}</span>
            )}
          </div>
          <div className="text-[11px] text-white/55">via {provider.label}</div>
        </div>

        {kind === "tv" && seasons.length > 0 && (
          <>
            <button
              onClick={() => setEpisodesOpen((o) => !o)}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs ${
                episodesOpen ? "bg-white/15 text-white" : "liquid-glass text-white/85"
              }`}
            >
              <List className="h-4 w-4" /> Episodes
            </button>
            <button
              onClick={nextEpisode}
              className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs text-white hover:bg-white/20"
            >
              <SkipForward className="h-4 w-4" /> Next
            </button>
          </>
        )}

        <div className="flex items-center gap-1">
          <button
            onClick={() => setProviderIdx((i) => (i - 1 + PROVIDERS.length) % PROVIDERS.length)}
            className="rounded-lg p-1.5 text-white/80 hover:bg-white/10"
            aria-label="Previous source"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <select
            value={providerIdx}
            onChange={(e) => setProviderIdx(Number(e.target.value))}
            className="liquid-glass rounded-lg bg-transparent px-2 py-1 text-xs text-white"
          >
            {PROVIDERS.map((p, i) => (
              <option key={p.id} value={i} className="bg-black">
                {p.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => setProviderIdx((i) => (i + 1) % PROVIDERS.length)}
            className="rounded-lg p-1.5 text-white/80 hover:bg-white/10"
            aria-label="Next source"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <button
          onClick={() => setChatOpen((o) => !o)}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition ${
            chatOpen ? "bg-[rgb(var(--polaris-accent))]/30 text-white" : "text-white/85 hover:bg-white/10"
          }`}
          aria-label="Toggle chat"
        >
          <MessageSquare className="h-4 w-4" />
          <span className="hidden sm:inline">Chat</span>
        </button>

      </div>

      <div className="relative flex flex-1 overflow-hidden bg-black">
        <div className="relative flex-1 bg-black">
          <iframe
            key={src}
            src={src}
            className="absolute inset-0 h-full w-full"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="no-referrer"
          />
          <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-[10px] text-white/60 backdrop-blur">
            <AlertCircle className="mr-1 inline h-3 w-3" /> Source blocked? Try the next one →
          </div>
          {/* Copyright disclaimer */}
          <div className="pointer-events-none absolute bottom-10 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-[9px] text-white/40 backdrop-blur">
            We don't condone copyright. 3rd party streamers host this content, not us.
          </div>
        </div>

        {/* Netflix-style episode panel */}
        {episodesOpen && kind === "tv" && (
          <aside className="absolute inset-y-0 right-0 z-20 w-full max-w-md overflow-y-auto border-l border-white/10 bg-black/85 backdrop-blur-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-white/10 bg-black/70 px-4 py-3 backdrop-blur">
              <select
                value={season}
                onChange={(e) => { setSeason(Number(e.target.value)); setEpisode(1); }}
                className="liquid-glass rounded-lg bg-transparent px-3 py-1.5 text-sm text-white"
              >
                {seasons.map((s) => (
                  <option key={s.season_number} value={s.season_number} className="bg-black">
                    {s.name}
                  </option>
                ))}
              </select>
              <button onClick={() => setEpisodesOpen(false)} className="rounded-md p-1.5 text-white/75 hover:bg-white/10" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2 p-3">
              {(seasonData?.episodes ?? Array.from({ length: episodeCount }, (_, i) => ({
                id: i, episode_number: i + 1, name: `Episode ${i + 1}`, overview: "", still_path: null, runtime: null, air_date: null, vote_average: 0,
              }))).map((ep) => {
                const active = ep.episode_number === episode;
                return (
                  <button
                    key={ep.id}
                    onClick={() => goToEpisode(season, ep.episode_number)}
                    className={`group flex w-full gap-3 rounded-xl p-2 text-left transition ${
                      active ? "bg-white/15 ring-1 ring-white/30" : "hover:bg-white/10"
                    }`}
                  >
                    <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-white/5">
                      {ep.still_path ? (
                        <img src={IMG(ep.still_path, "w300")} alt="" className="h-full w-full object-cover" loading="lazy" />
                      ) : null}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                        <Play className="h-5 w-5 fill-white text-white" />
                      </div>
                      <div className="absolute left-1 top-1 rounded bg-black/70 px-1 text-[10px] text-white">{ep.episode_number}</div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="truncate text-sm font-semibold text-white">{ep.name}</div>
                        {ep.runtime ? <div className="shrink-0 text-[10px] text-white/55">{ep.runtime}m</div> : null}
                      </div>
                      <div className="mt-0.5 line-clamp-2 text-[11px] text-white/65">{ep.overview || "No description."}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>
        )}

        {chatOpen && (
          <aside className="absolute inset-y-0 right-0 z-10 w-full max-w-sm border-l border-white/10 bg-black/80 backdrop-blur-xl md:static md:w-[340px] md:max-w-none md:bg-transparent md:backdrop-blur-0">
            <MovieChat
              room={`${kind}-${id}${kind === "tv" ? `-s${season}e${episode}` : ""}`}
              title={title}
              onClose={() => setChatOpen(false)}
            />
          </aside>
        )}
      </div>
    </div>
  );
}