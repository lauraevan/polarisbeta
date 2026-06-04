import { useRef } from "react";
import { ChevronLeft, ChevronRight, Play, Star } from "lucide-react";
import { IMG, type TmdbItem } from "@/lib/tmdb";

type Props = {
  title: string;
  items: TmdbItem[];
  onSelect: (item: TmdbItem) => void;
  loading?: boolean;
  /** "wide" = 16:9 backdrop cards (default). "tall" = backdrop hero strip. */
  variant?: "wide" | "hero";
};

/**
 * Horizontal row of LANDSCAPE backdrop cards — visual break from the
 * standard portrait poster rows so the cinema doesn't feel repetitive.
 */
export function BillboardRow({ title, items, onSelect, loading, variant = "wide" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) =>
    ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.9, behavior: "smooth" });

  if (!items.length && !loading) return null;
  const withBackdrop = items.filter((i) => i.backdrop_path);
  const list = withBackdrop.length ? withBackdrop : items;
  const w = variant === "hero" ? 520 : 360;
  const h = Math.round(w * (9 / 16));

  return (
    <section
      className="group/row relative mb-8"
      style={{ contentVisibility: "auto", containIntrinsicSize: "320px" } as React.CSSProperties}
    >
      <h2 className="mb-3 px-4 text-lg font-bold text-white sm:px-6 md:text-xl">{title}</h2>
      <div className="relative">
        <button
          onClick={() => scroll(-1)}
          className="liquid-glass absolute left-1 top-1/2 z-10 hidden -translate-y-1/2 rounded-full p-2 text-white opacity-0 transition group-hover/row:opacity-100 md:block"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div
          ref={ref}
          className="flex gap-3 overflow-x-auto scroll-smooth px-4 pb-2 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {loading && !items.length
            ? Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="shrink-0 animate-pulse rounded-xl bg-white/5"
                  style={{ width: w, height: h }}
                />
              ))
            : list.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSelect(item)}
                  className="group/card relative shrink-0 overflow-hidden rounded-xl liquid-glass ring-1 ring-amber-100/10 transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:ring-[rgb(var(--polaris-accent))]/60 hover:shadow-[0_18px_50px_-12px_rgba(var(--polaris-accent)/0.55)]"
                  style={{ width: w, height: h }}
                >
                  {item.backdrop_path ? (
                    <img
                      src={IMG(item.backdrop_path, "w780")}
                      alt={item.title || item.name}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover opacity-0 transition-all duration-500 group-hover/card:scale-105 group-hover/card:brightness-110"
                      onLoad={(e) => e.currentTarget.classList.remove("opacity-0")}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-white/5 p-2 text-center text-xs text-white/60">
                      {item.title || item.name}
                    </div>
                  )}
                  {/* Warm overlay + film grain */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/55 via-transparent to-transparent" />
                  <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.45),inset_0_0_0_1px_rgba(255,200,140,0.08)]" />

                  {/* Bottom-left title block */}
                  <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
                    <div className="line-clamp-1 text-sm font-bold text-white drop-shadow sm:text-base">
                      {item.title || item.name}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-white/70">
                      <span
                        className="font-semibold"
                        style={{ color: "rgb(var(--polaris-accent) / 0.9)" }}
                      >
                        {(item.release_date || item.first_air_date || "").slice(0, 4) || "—"}
                      </span>
                      {item.vote_average > 0 && (
                        <span className="inline-flex items-center gap-1 text-amber-50/85">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {item.vote_average.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Play badge on hover */}
                  <div className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white opacity-0 backdrop-blur transition group-hover/card:opacity-100">
                    <Play className="h-4 w-4 fill-white" />
                  </div>
                </button>
              ))}
        </div>
        <button
          onClick={() => scroll(1)}
          className="liquid-glass absolute right-1 top-1/2 z-10 hidden -translate-y-1/2 rounded-full p-2 text-white opacity-0 transition group-hover/row:opacity-100 md:block"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
}