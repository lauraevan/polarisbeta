import { useWallpaper } from "@/lib/wallpaper-context";

export function WallpaperLayer() {
  const { wallpaper } = useWallpaper();
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#0a0910]">
      {wallpaper.type === "animated" ? (
        <video
          key={wallpaper.id}
          className="absolute inset-0 h-full w-full object-cover"
          src={wallpaper.src}
          poster={wallpaper.poster}
          autoPlay
          muted
          loop
          playsInline
        />
      ) : (
        <img
          key={wallpaper.id}
          className="absolute inset-0 h-full w-full object-cover"
          src={wallpaper.src}
          alt=""
        />
      )}
      {/* Cinematic darken + warm vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,rgba(0,0,0,0)_0%,rgba(0,0,0,0.55)_70%,rgba(0,0,0,0.85)_100%)]" />
      <div
        className="pointer-events-none absolute inset-0 mix-blend-soft-light opacity-60"
        style={{
          background: `radial-gradient(60% 40% at 80% 90%, rgba(var(--polaris-accent)/0.35), transparent 70%)`,
        }}
      />
    </div>
  );
}