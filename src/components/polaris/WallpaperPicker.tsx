import { useMemo, useState } from "react";
import { ImageIcon, X, Play, Check } from "lucide-react";
import { useWallpaper } from "@/lib/wallpaper-context";

type Filter = "All" | "Animated" | "Static";

export function WallpaperPicker() {
  const { wallpaper, setWallpaperId, all } = useWallpaper();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("All");

  const visible = useMemo(() => {
    if (filter === "Animated") return all.filter((w) => w.type === "animated");
    if (filter === "Static") return all.filter((w) => w.type === "static");
    return all;
  }, [all, filter]);

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="liquid-glass fixed right-5 top-5 z-30 flex items-center gap-2 rounded-full px-3.5 py-2 text-xs text-white/90 hover:text-white"
        style={{
          boxShadow: `0 10px 30px -10px rgba(var(--polaris-accent)/0.6), inset 0 0 0 1px rgba(var(--polaris-accent)/0.35)`,
        }}
      >
        <ImageIcon className="h-4 w-4" />
        Wallpaper
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/55 p-3 backdrop-blur-md md:items-center md:p-6"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="liquid-glass-strong relative flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
              <div>
                <div className="text-sm font-semibold text-white">Wallpaper Gallery</div>
                <div className="text-[11px] text-white/55">
                  The interface tints itself to match the scene you pick
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="liquid-glass hidden items-center gap-0.5 rounded-full p-0.5 sm:flex">
                  {(["All", "Animated", "Static"] as Filter[]).map((f) => {
                    const on = filter === f;
                    return (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${
                          on ? "bg-white/15 text-white" : "text-white/65 hover:text-white"
                        }`}
                      >
                        {f}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-full p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Grid */}
            <div className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto p-4 sm:grid-cols-3 md:grid-cols-4">
              {visible.map((w) => {
                const active = w.id === wallpaper.id;
                return (
                  <button
                    key={w.id}
                    onClick={() => {
                      setWallpaperId(w.id);
                      setOpen(false);
                    }}
                    className="group relative aspect-video overflow-hidden rounded-xl border border-white/10 text-left transition-transform hover:-translate-y-0.5"
                    style={
                      active
                        ? {
                            boxShadow: `0 0 0 2px rgba(${w.accent}/0.95), 0 18px 50px -12px rgba(${w.accent}/0.6)`,
                          }
                        : undefined
                    }
                  >
                    {w.type === "animated" ? (
                      <video
                        src={w.src}
                        poster={w.poster}
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                        onMouseLeave={(e) => {
                          e.currentTarget.pause();
                          e.currentTarget.currentTime = 0;
                        }}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <img
                        src={w.src}
                        alt={w.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}

                    {/* Bottom gradient */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

                    {/* Top-right badge */}
                    <div className="absolute right-2 top-2 flex items-center gap-1">
                      {w.type === "animated" && (
                        <span className="flex items-center gap-1 rounded-full bg-black/55 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-white/90 backdrop-blur">
                          <Play className="h-2.5 w-2.5 fill-white" /> Live
                        </span>
                      )}
                      {active && (
                        <span
                          className="flex h-5 w-5 items-center justify-center rounded-full text-black"
                          style={{ background: `rgba(${w.accent}/0.95)` }}
                        >
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </div>

                    {/* Label */}
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="line-clamp-1 text-[11px] font-semibold text-white">{w.name}</div>
                      <div
                        className="mt-0.5 h-0.5 w-6 rounded-full"
                        style={{ background: `rgba(${w.accent}/0.9)` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="border-t border-white/10 px-5 py-2.5 text-[10px] text-white/45">
              {visible.length} wallpapers · Animated scenes hosted on the Pexels video CDN ·
              Motionbgs originals coming once a proxy worker is wired
            </div>
          </div>
        </div>
      )}
    </>
  );
}