import { useState } from "react";
import { ImageIcon, X } from "lucide-react";
import { useWallpaper } from "@/lib/wallpaper-context";

export function WallpaperPicker() {
  const { wallpaper, setWallpaperId, all } = useWallpaper();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="glass fixed bottom-5 right-5 z-30 flex items-center gap-2 rounded-full px-4 py-2.5 text-sm text-white/90 hover:text-white"
        style={{
          boxShadow: `0 10px 30px -10px rgba(var(--polaris-accent)/0.6), inset 0 0 0 1px rgba(var(--polaris-accent)/0.35)`,
        }}
      >
        <ImageIcon className="h-4 w-4" />
        Wallpaper
      </button>

      {open && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 backdrop-blur-sm md:items-center">
          <div className="glass relative max-h-[80vh] w-full max-w-5xl overflow-hidden rounded-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <div className="text-sm font-semibold text-white">Choose your wallpaper</div>
                <div className="text-xs text-white/50">
                  Theme tone shifts to match the scene
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid max-h-[68vh] grid-cols-2 gap-3 overflow-y-auto p-4 sm:grid-cols-3 md:grid-cols-4">
              {all.map((w) => {
                const active = w.id === wallpaper.id;
                return (
                  <button
                    key={w.id}
                    onClick={() => {
                      setWallpaperId(w.id);
                      setOpen(false);
                    }}
                    className="group relative aspect-video overflow-hidden rounded-xl border border-white/10 text-left"
                    style={
                      active
                        ? {
                            boxShadow: `0 0 0 2px rgba(${w.accent}/0.9), 0 10px 40px -10px rgba(${w.accent}/0.7)`,
                          }
                        : undefined
                    }
                  >
                    {w.type === "animated" ? (
                      <video
                        src={w.src}
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                        onMouseLeave={(e) => {
                          e.currentTarget.pause();
                          e.currentTarget.currentTime = 0;
                        }}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <img
                        src={w.src}
                        alt={w.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    )}
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.85) 100%)`,
                      }}
                    />
                    <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-2">
                      <span className="line-clamp-2 text-[11px] font-medium text-white">
                        {w.name}
                      </span>
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-white/80"
                        style={{ background: `rgba(${w.accent}/0.3)` }}
                      >
                        {w.type}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}