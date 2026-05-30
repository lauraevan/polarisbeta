import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
    <section className="group/row relative mb-8">
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
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              className={`relative shrink-0 overflow-hidden rounded-xl liquid-glass transition hover:scale-[1.04] hover:z-10 ${
                ranked ? "flex items-end" : ""
              }`}
              style={{ width: w, height: h }}
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
              <div
                className={`relative h-full ${innerLeft} overflow-hidden rounded-xl`}
              >
                {item.poster_path ? (
                  <img
                    src={IMG(item.poster_path, "w300")}
                    alt={item.title || item.name}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover opacity-0 transition-opacity duration-500"
                    onLoad={(e) => e.currentTarget.classList.remove("opacity-0")}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-white/5 p-2 text-center text-xs text-white/60">
                    {item.title || item.name}
                  </div>
                )}
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