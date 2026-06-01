import { useState, memo, useEffect, useRef } from "react";
import { Play, Bookmark, BookmarkCheck } from "lucide-react";
import { gameIcon } from "@/lib/game-icon";
import { lookupCover } from "@/lib/game-cover-lookup";
import { useMyList } from "@/lib/mylist-context";

type Props = {
  title: string;
  cover?: string;
  /** When true, lazily look up a real cover image (Steam) when no `cover` is provided. */
  autoCover?: boolean;
  onPlay: () => void;
  size?: "md" | "lg";
  /** Stable id used for My List. Defaults to a slug of the title. */
  id?: string;
  source?: string;
  launchUrl?: string;
};

function TileInner({ title, cover, autoCover = true, onPlay, size = "md", id, source, launchUrl }: Props) {
  const [resolved, setResolved] = useState<string | undefined>(cover);
  const [imgOk, setImgOk] = useState(!!cover);
  const ref = useRef<HTMLButtonElement>(null);
  const h = size === "lg" ? "h-44" : "h-32";
  const icon = gameIcon(title);
  const gameId = id || title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const { hasGame, addGame, removeGame } = useMyList();
  const saved = hasGame(gameId);

  // Lazily fetch real cover when tile becomes visible
  useEffect(() => {
    if (cover || !autoCover) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      lookupCover(title).then((url) => {
        if (url) { setResolved(url); setImgOk(true); }
      });
      return;
    }
    let done = false;
    const io = new IntersectionObserver((entries) => {
      if (done) return;
      if (entries.some((e) => e.isIntersecting)) {
        done = true;
        io.disconnect();
        lookupCover(title).then((url) => {
          if (url) { setResolved(url); setImgOk(true); }
        });
      }
    }, { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, [title, cover, autoCover]);

  return (
    <button
      ref={ref}
      onClick={onPlay}
      className={`group relative ${h} w-full overflow-hidden rounded-lg border border-amber-100/10 bg-gradient-to-br from-stone-900 via-zinc-900 to-stone-950 text-left transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[rgb(var(--polaris-accent))]/70 hover:shadow-[0_16px_44px_-14px_rgba(var(--polaris-accent)/0.6)] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--polaris-accent))]/60 will-change-transform`}
    >
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          if (saved) removeGame(gameId);
          else addGame({ id: gameId, title, cover: resolved, source, launchUrl });
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.stopPropagation();
            e.preventDefault();
            if (saved) removeGame(gameId);
            else addGame({ id: gameId, title, cover: resolved, source, launchUrl });
          }
        }}
        aria-label={saved ? "Remove from My List" : "Add to My List"}
        className="absolute right-1.5 top-1.5 z-10 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white/85 opacity-0 backdrop-blur transition group-hover:opacity-100 hover:text-white"
      >
        {saved ? <BookmarkCheck className="h-3.5 w-3.5 text-[rgb(var(--polaris-accent))]" /> : <Bookmark className="h-3.5 w-3.5" />}
      </span>

      {/* Cover or generated icon */}
      {resolved && imgOk ? (
        <img
          src={resolved}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setImgOk(false)}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
        />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center text-xl font-black tracking-tight"
          style={{ background: icon.bg, color: icon.fg }}
          aria-hidden
        >
          <span className="drop-shadow-sm">{icon.mono}</span>
        </div>
      )}

      {/* Gradient overlay for legibility */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-amber-950/30 to-transparent" />
      {/* Cozy warm inner glow + soft frame */}
      <div className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-t from-transparent via-transparent to-amber-200/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="pointer-events-none absolute inset-0 rounded-lg shadow-[inset_0_0_24px_rgba(0,0,0,0.45),inset_0_0_0_1px_rgba(255,200,140,0.08)]" />

      <div className="relative flex h-full flex-col justify-end p-2.5">
        <span className="line-clamp-2 text-xs font-semibold leading-tight text-amber-50 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
          {title}
        </span>
        <span className="mt-1 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-amber-200/60 transition group-hover:text-[rgb(var(--polaris-accent))]">
          <Play className="h-2.5 w-2.5 fill-current" /> Play
        </span>
      </div>
    </button>
  );
}

export const GameTile = memo(TileInner);