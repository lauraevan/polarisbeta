import { useWallpaper } from "@/lib/wallpaper-context";
import { useEffect, useState } from "react";
import { useTheme } from "@/lib/theme-context";

export function WallpaperLayer() {
  const { wallpaper } = useWallpaper();
  const { mode, outlineColor } = useTheme();
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    setVideoFailed(false);
  }, [wallpaper.id]);

  // Outline-only mode: pure black with a colored vignette outline.
  if (mode === "outline") {
    return (
      <div className="fixed inset-0 -z-10 overflow-hidden bg-black">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            boxShadow: `inset 0 0 220px 40px ${outlineColor}55, inset 0 0 0 2px ${outlineColor}88`,
          }}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#0a0910]">
      {/* Accent-tinted fallback paints instantly */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(160deg, rgba(${wallpaper.accent}/0.35), rgba(10,9,16,0.95))`,
          transition: "background 600ms ease",
        }}
      />
      {wallpaper.type === "animated" && !videoFailed ? (
        <video
          key={wallpaper.id}
          className="absolute inset-0 h-full w-full object-cover animate-[fadeIn_700ms_ease]"
          src={wallpaper.src}
          poster={wallpaper.poster}
          autoPlay
          muted
          loop
          playsInline
          onError={() => setVideoFailed(true)}
        />
      ) : wallpaper.poster ? (
        <img
          key={`${wallpaper.id}-poster`}
          className="absolute inset-0 h-full w-full object-cover animate-[fadeIn_700ms_ease]"
          src={wallpaper.poster}
          alt=""
          loading="eager"
          onError={(e) => ((e.currentTarget as HTMLImageElement).style.opacity = "0")}
        />
      ) : (
        <img
          key={wallpaper.id}
          className="absolute inset-0 h-full w-full object-cover animate-[fadeIn_700ms_ease]"
          src={wallpaper.src}
          alt=""
          loading="eager"
          onError={(e) => ((e.currentTarget as HTMLImageElement).style.opacity = "0")}
        />
      )}
      {/* Cinematic darken + vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,rgba(0,0,0,0.05)_0%,rgba(0,0,0,0.25)_70%,rgba(0,0,0,0.55)_100%)]" />
      <div
        className="pointer-events-none absolute inset-0 mix-blend-soft-light opacity-60"
        style={{
          background: `radial-gradient(60% 40% at 80% 90%, rgba(var(--polaris-accent)/0.35), transparent 70%)`,
        }}
      />
    </div>
  );
}