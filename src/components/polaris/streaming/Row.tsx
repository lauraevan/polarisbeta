import { useRef } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { IMG, type TmdbItem } from "@/lib/tmdb";

type Props = {
  title: string;
  items: TmdbItem[];
  onSelect: (item: TmdbItem) => void;
  ranked?: boolean;
  loading?: boolean;
  size?: "sm" | "md" | "lg";
};

export function Row({ title, items, onSelect, ranked, loading, size = "md" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) =>
    ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.9, behavior: "smooth" });

  if (!items.length && !loading) return null;
  const list = ranked ? items.slice(0, 10) : items;
  // Smaller Top 10 per user request
  const base = size === "sm" ? 120 : size === "lg" ? 180 : 150;
  const w = ranked ? 160 : base;
  const h = w * 1.5;
  const numberSize = ranked ? 140 : 200;
  const innerLeft = ranked ? "ml-10 w-[110px]" : "w-full";

  return (
    <section
      className="group/row relative mb-8"
      style={{ contentVisibility: "auto", containIntrinsicSize: "380px" } as React.CSSProperties}
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
            ? Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="shrink-0 animate-pulse rounded-xl bg-white/5"
                  style={{ width: w, height: h }}
                />
              ))
            : list.map((item, idx) => (
            <div key={item.id} className="shrink-0" style={{ width: w }}>
              <button
                onClick={() => onSelect(item)}
                className={`group/card relative block w-full overflow-hidden rounded-xl liquid-glass transition-all duration-300 hover:scale-[1.05] hover:z-10 hover:shadow-[0_18px_50px_-12px_rgba(var(--polaris-accent)/0.55)] ring-1 ring-amber-100/10 hover:ring-[rgb(var(--polaris-accent))]/60 ${
                  ranked ? "flex items-end" : ""
                }`}
                style={{ height: h }}
              >
                {ranked && (
                  <span
                    className="absolute -left-2 bottom-0 z-0 font-black leading-[0.8] text-transparent select-none"
                    style={{
                      fontSize: numberSize,
                      WebkitTextStroke: "3px rgba(255,255,255,0.85)",
                    }}
                  >
                    {idx + 1}
                  </span>
                )}
                <div className={`relative h-full ${innerLeft} overflow-hidden rounded-xl`}>
                  {item.poster_path ? (
                    <img
                      src={IMG(item.poster_path, "w300")}
                      alt={item.title || item.name}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover opacity-0 transition-all duration-500 group-hover/card:brightness-110"
                      onLoad={(e) => e.currentTarget.classList.remove("opacity-0")}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-white/5 p-2 text-center text-xs text-white/60">
                      {item.title || item.name}
                    </div>
                  )}
                  {/* Cozy warm overlay — inner amber glow + film grain */}
                  <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-t from-amber-950/40 via-transparent to-amber-200/5 mix-blend-overlay opacity-70" />
                  <div className="pointer-events-none absolute inset-0 rounded-xl shadow-[inset_0_0_30px_rgba(0,0,0,0.45),inset_0_0_0_1px_rgba(255,200,140,0.08)]" />
                  {item.vote_average > 0 && (
                    <div className="absolute right-1.5 top-1.5 flex items-center gap-1 rounded-md bg-black/75 px-1.5 py-0.5 text-[11px] font-semibold text-amber-50 backdrop-blur ring-1 ring-amber-200/20">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {item.vote_average.toFixed(1)}
                    </div>
                  )}
                </div>
              </button>
              <div className="mt-2 px-0.5">
                <div className="truncate text-[13px] font-semibold text-white" title={item.title || item.name}>
                  {item.title || item.name}
                </div>
                <div
                  className="text-[11px] font-medium"
                  style={{ color: "rgb(var(--polaris-accent) / 0.85)" }}
                >
                  {(item.release_date || item.first_air_date || "").slice(0, 4) || "—"}
                </div>
              </div>
            </div>
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