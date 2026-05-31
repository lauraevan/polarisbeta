import { useMemo, useState } from "react";
import { ImageIcon, X, Play, Check } from "lucide-react";
import { useWallpaper } from "@/lib/wallpaper-context";
import { useRouterState } from "@tanstack/react-router";

export function WallpaperPicker({
  open: controlledOpen,
  onOpenChange,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { wallpaper, setWallpaperId, all } = useWallpaper();
  const [localOpen, setLocalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const open = controlledOpen ?? localOpen;
  const setOpen = onOpenChange ?? setLocalOpen;
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // Hide the floating launcher on routes with their own top-right controls
  // (e.g. PolarisFlix has a search button in that exact spot).
  const hideLauncher = pathname.startsWith("/media");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter((w) => w.name.toLowerCase().includes(q));
  }, [all, query]);

  return (
    <>
      {!hideLauncher && (
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
      )}

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
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search wallpapers…"
                  className="liquid-glass hidden w-48 rounded-full px-3 py-1.5 text-[11px] text-white placeholder:text-white/50 focus:outline-none sm:block"
                />
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-full p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Grid — auto-fit so tiles never overlap on any device */}
            <div
              className="grid flex-1 gap-4 overflow-y-auto overflow-x-hidden p-4"
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              }}
            >
              {visible.map((w) => {
                const active = w.id === wallpaper.id;
                return (
                  <button
                    key={w.id}
                    onClick={() => {
                      setWallpaperId(w.id);
                      setOpen(false);
                    }}
                    className="group flex flex-col gap-2 text-left"
                  >
                    <div
                      className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/10 transition-transform group-hover:-translate-y-0.5"
                      style={
                        active
                          ? {
                              boxShadow: `0 0 0 2px rgba(${w.accent}/0.95), 0 18px 50px -12px rgba(${w.accent}/0.6)`,
                            }
                          : undefined
                      }
                    >
                      {w.poster ? (
                        <img
                          src={w.poster}
                          alt={w.name}
                          loading="lazy"
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

                      {/* Top badges */}
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
                    </div>

                    {/* Label sits below tile — no overlap */}
                    <div className="flex items-center gap-2 px-0.5">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: `rgba(${w.accent}/0.95)` }}
                      />
                      <span className="line-clamp-1 text-[11px] font-medium text-white/90">{w.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="border-t border-white/10 px-5 py-2.5 text-[10px] text-white/45">
              {visible.length} wallpapers · Streamed live from motionbgs.com
            </div>
          </div>
        </div>
      )}
    </>
  );
}