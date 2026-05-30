import { Play, Plus, Check, X, Star, Clock, Calendar, Globe2 } from "lucide-react";
import { IMG, tmdbApi, type TmdbItem, type MediaKind } from "@/lib/tmdb";
import { useMyList } from "@/lib/mylist-context";
import { useQuery } from "@tanstack/react-query";

type Props = {
  item: TmdbItem;
  kind: MediaKind;
  onClose: () => void;
  onPlay: () => void;
};

export function MovieModal({ item, kind, onClose, onPlay }: Props) {
  const { has, add, remove } = useMyList();
  const inList = has(kind, item.id);
  const title = item.title || item.name || "Untitled";
  const year = (item.release_date || item.first_air_date || "").slice(0, 4);
  const details = useQuery({
    queryKey: ["details-modal", kind, item.id],
    queryFn: () => tmdbApi.details(kind, item.id),
  });
  const credits = useQuery({
    queryKey: ["credits-modal", kind, item.id],
    queryFn: () => tmdbApi.credits(kind, item.id),
  });
  const runtime =
    details.data?.runtime ?? details.data?.episode_run_time?.[0] ?? null;
  const genres = details.data?.genres ?? [];
  const seasons = details.data?.number_of_seasons;
  const episodes = details.data?.number_of_episodes;
  const cast = credits.data?.cast?.slice(0, 8) ?? [];

  return (
    <div
      className="fixed inset-0 z-[50] flex items-center justify-center p-4 animate-[fadeIn_200ms_ease]"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <div
        className="liquid-glass-strong relative z-10 max-h-[90vh] w-full max-w-3xl overflow-y-auto overflow-x-hidden rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-60 sm:h-80">
          {item.backdrop_path && (
            <img
              src={IMG(item.backdrop_path, "w780")}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <button
            onClick={onClose}
            className="liquid-glass absolute right-3 top-3 rounded-full p-1.5 text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="absolute bottom-4 left-5 right-5">
            <h2 className="text-2xl font-bold text-white drop-shadow">{title}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-white/80">
              {year && <span>{year}</span>}
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                {item.vote_average.toFixed(1)}
              </span>
              {runtime && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {runtime}m
                </span>
              )}
              {kind === "tv" && seasons && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {seasons} season{seasons > 1 ? "s" : ""}
                  {episodes ? ` · ${episodes} eps` : ""}
                </span>
              )}
              <span className="rounded border border-white/20 px-1.5 py-0.5 text-[10px] uppercase">
                {kind === "movie" ? "Movie" : "Series"}
              </span>
            </div>
          </div>
        </div>
        <div className="p-5">
          <div className="mb-4 flex flex-wrap gap-2">
            {genres.map((g) => (
              <span
                key={g.id}
                className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[11px] text-white/80"
              >
                {g.name}
              </span>
            ))}
          </div>
          <p className="text-sm leading-relaxed text-white/80">{item.overview || "No description available."}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={onPlay}
              className="flex items-center gap-2 rounded-xl bg-white px-7 py-3 text-base font-bold text-black shadow-lg hover:bg-white/90"
            >
              <Play className="h-5 w-5 fill-black" /> Play
            </button>
            <button
              onClick={() =>
                inList ? remove(kind, item.id) : add({ ...item, kind })
              }
              className="liquid-glass flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white"
            >
              {inList ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {inList ? "In My List" : "Add to My List"}
            </button>
          </div>

          {/* Cast */}
          {cast.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/60">Cast</h3>
              <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {cast.map((p) => (
                  <div key={p.id} className="w-20 shrink-0 text-center">
                    <div className="h-20 w-20 overflow-hidden rounded-full border border-white/10 bg-white/5">
                      {p.profile_path ? (
                        <img src={IMG(p.profile_path, "w200")} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-white/40">{p.name[0]}</div>
                      )}
                    </div>
                    <div className="mt-1.5 truncate text-[11px] font-medium text-white">{p.name}</div>
                    <div className="truncate text-[10px] text-white/55">{p.character}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          {details.data && (
            <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat label="Rating" value={item.vote_average.toFixed(1) + " / 10"} />
              <Stat label={kind === "movie" ? "Runtime" : "Episode"} value={runtime ? `${runtime} min` : "—"} />
              <Stat label="Status" value={details.data.status || "—"} />
              <Stat
                label="Language"
                value={(item as any).original_language?.toUpperCase() || "—"}
                icon={<Globe2 className="h-3 w-3" />}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="liquid-glass rounded-xl px-3 py-2">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-white/55">
        {icon}
        {label}
      </div>
      <div className="mt-0.5 text-sm font-semibold text-white">{value}</div>
    </div>
  );
}