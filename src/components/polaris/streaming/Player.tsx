import { useEffect, useMemo, useState } from "react";
import { X, ChevronLeft, ChevronRight, AlertCircle, MessageSquare } from "lucide-react";
import { PROVIDERS } from "@/lib/streaming-providers";
import { tmdbApi, type MediaKind } from "@/lib/tmdb";
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
  const episodes = currentSeason?.episode_count ?? 1;

  const provider = PROVIDERS[providerIdx];
  const src = provider.build(kind, id, season, episode);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
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
          <div className="truncate text-sm font-semibold text-white">{title}</div>
          <div className="text-[11px] text-white/55">via {provider.label}</div>
        </div>

        {kind === "tv" && seasons.length > 0 && (
          <>
            <select
              value={season}
              onChange={(e) => {
                setSeason(Number(e.target.value));
                setEpisode(1);
              }}
              className="liquid-glass rounded-lg bg-transparent px-2 py-1 text-xs text-white"
            >
              {seasons.map((s) => (
                <option key={s.season_number} value={s.season_number} className="bg-black">
                  {s.name}
                </option>
              ))}
            </select>
            <select
              value={episode}
              onChange={(e) => setEpisode(Number(e.target.value))}
              className="liquid-glass rounded-lg bg-transparent px-2 py-1 text-xs text-white"
            >
              {Array.from({ length: episodes }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n} className="bg-black">
                  Ep {n}
                </option>
              ))}
            </select>
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
        </div>
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