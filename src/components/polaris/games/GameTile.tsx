import { useState, memo } from "react";
import { Play } from "lucide-react";
import { gameIcon } from "@/lib/game-icon";

type Props = {
  title: string;
  cover?: string;
  onPlay: () => void;
  size?: "md" | "lg";
};

function TileInner({ title, cover, onPlay, size = "md" }: Props) {
  const [imgOk, setImgOk] = useState(!!cover);
  const h = size === "lg" ? "h-48" : "h-36";
  const icon = gameIcon(title);

  return (
    <button
      onClick={onPlay}
      className={`group relative ${h} w-full overflow-hidden rounded-md border border-white/5 bg-zinc-900/80 text-left transition-transform duration-150 ease-out hover:-translate-y-0.5 hover:border-[rgb(var(--polaris-accent))]/60 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--polaris-accent))]/60 will-change-transform`}
    >
      {/* Cover or generated icon */}
      {cover && imgOk ? (
        <img
          src={cover}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setImgOk(false)}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
        />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center text-2xl font-black tracking-tight"
          style={{ background: icon.bg, color: icon.fg }}
          aria-hidden
        >
          <span className="drop-shadow-sm">{icon.mono}</span>
        </div>
      )}

      {/* Gradient overlay for legibility */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

      <div className="relative flex h-full flex-col justify-end p-2.5">
        <span className="line-clamp-2 text-xs font-semibold leading-tight text-white">
          {title}
        </span>
        <span className="mt-1 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-white/60 transition group-hover:text-[rgb(var(--polaris-accent))]">
          <Play className="h-2.5 w-2.5 fill-current" /> Play
        </span>
      </div>
    </button>
  );
}

export const GameTile = memo(TileInner);