import { Play, Plus, Check, X, Star } from "lucide-react";
import { IMG, type TmdbItem, type MediaKind } from "@/lib/tmdb";
import { useMyList } from "@/lib/mylist-context";

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

  return (
    <div
      className="fixed inset-0 z-[50] flex items-center justify-center p-4 animate-[fadeIn_200ms_ease]"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <div
        className="liquid-glass-strong relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-56 sm:h-72">
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
          <div className="absolute bottom-3 left-4 right-4">
            <h2 className="text-2xl font-bold text-white drop-shadow">{title}</h2>
            <div className="mt-1 flex items-center gap-3 text-xs text-white/70">
              {year && <span>{year}</span>}
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                {item.vote_average.toFixed(1)}
              </span>
              <span className="rounded border border-white/20 px-1.5 py-0.5 text-[10px] uppercase">
                {kind === "movie" ? "Movie" : "Series"}
              </span>
            </div>
          </div>
        </div>
        <div className="p-5">
          <p className="line-clamp-4 text-sm text-white/75">{item.overview || "No description available."}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={onPlay}
              className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-white/90"
            >
              <Play className="h-4 w-4 fill-black" /> Play
            </button>
            <button
              onClick={() =>
                inList ? remove(kind, item.id) : add({ ...item, kind })
              }
              className="liquid-glass flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
            >
              {inList ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {inList ? "In My List" : "Add to My List"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}