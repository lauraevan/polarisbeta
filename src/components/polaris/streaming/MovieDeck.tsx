import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Heart, X, Info, RotateCcw, Star, Play, Flame, Sparkles, Film, Tv2 } from "lucide-react";
import { tmdbApi, IMG, type TmdbItem, type MediaKind } from "@/lib/tmdb";
import { useMyList } from "@/lib/mylist-context";
import { Link } from "@tanstack/react-router";

type Mode = "all" | "movie" | "tv";
type Card = TmdbItem & { kind: MediaKind };

function useDeckCards(mode: Mode) {
  return useQuery({
    queryKey: ["movie-deck", mode],
    queryFn: async () => {
      const [tm, tt, pm, pt] = await Promise.all([
        tmdbApi.trending("movie").catch(() => []),
        tmdbApi.trending("tv").catch(() => []),
        tmdbApi.popular("movie").catch(() => []),
        tmdbApi.popular("tv").catch(() => []),
      ]);
      const mk = (arr: TmdbItem[], k: MediaKind): Card[] =>
        arr.filter((i) => i.poster_path && i.backdrop_path).map((i) => ({ ...i, kind: k }));
      let pool: Card[] = [];
      if (mode === "movie") pool = [...mk(tm, "movie"), ...mk(pm, "movie")];
      else if (mode === "tv") pool = [...mk(tt, "tv"), ...mk(pt, "tv")];
      else pool = [...mk(tm, "movie"), ...mk(tt, "tv"), ...mk(pm, "movie"), ...mk(pt, "tv")];
      // dedupe + shuffle
      const seen = new Set<string>();
      const dedup = pool.filter((c) => {
        const k = `${c.kind}-${c.id}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      for (let i = dedup.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [dedup[i], dedup[j]] = [dedup[j], dedup[i]];
      }
      return dedup.slice(0, 40);
    },
    staleTime: 5 * 60_000,
  });
}

export function MovieDeck() {
  const [mode, setMode] = useState<Mode>("all");
  const { data: cards = [], isLoading, refetch } = useDeckCards(mode);
  const [index, setIndex] = useState(0);
  const [history, setHistory] = useState<{ card: Card; dir: "like" | "skip" }[]>([]);
  const [liked, setLiked] = useState<Card[]>([]);
  const [details, setDetails] = useState<Card | null>(null);
  const { add, has } = useMyList();

  useEffect(() => {
    setIndex(0);
    setHistory([]);
    setLiked([]);
  }, [mode, cards.length]);

  const current = cards[index];
  const next = cards[index + 1];
  const after = cards[index + 2];

  const swipe = (dir: "like" | "skip") => {
    if (!current) return;
    if (dir === "like") {
      setLiked((l) => [current, ...l]);
      if (!has(current.kind, current.id)) add({ ...current, kind: current.kind });
    }
    setHistory((h) => [{ card: current, dir }, ...h].slice(0, 20));
    setIndex((i) => i + 1);
  };

  const undo = () => {
    if (history.length === 0 || index === 0) return;
    setHistory((h) => h.slice(1));
    setIndex((i) => Math.max(0, i - 1));
  };

  const done = !isLoading && index >= cards.length && cards.length > 0;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-8">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-white/40">
            <Sparkles className="h-3 w-3" /> Polaris Cinema
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Movie Deck</h1>
          <p className="mt-1 max-w-lg text-xs text-white/55">
            A curated stack of what's hot. Swipe right to save, left to pass. Built to help you decide
            what to watch in under sixty seconds.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="liquid-glass flex rounded-full p-1 text-[11px] font-semibold">
            {(["all", "movie", "tv"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition ${
                  mode === m ? "bg-white text-black" : "text-white/65 hover:text-white"
                }`}
              >
                {m === "movie" ? <Film className="h-3 w-3" /> : m === "tv" ? <Tv2 className="h-3 w-3" /> : <Flame className="h-3 w-3" />}
                {m === "all" ? "Mixed" : m === "movie" ? "Movies" : "Series"}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Deck */}
        <div className="liquid-glass-ghost relative flex h-[560px] flex-col items-center justify-center overflow-hidden rounded-3xl p-6">
          {/* Ambient backdrop blur of current card */}
          {current?.backdrop_path && (
            <img
              src={IMG(current.backdrop_path, "w780")}
              alt=""
              className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-30 blur-2xl"
            />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/70" />

          {isLoading && (
            <div className="relative text-sm text-white/60">Shuffling the deck…</div>
          )}

          {done && (
            <div className="relative flex flex-col items-center gap-4 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-white/10 text-white">
                <Sparkles className="h-7 w-7" />
              </div>
              <div>
                <div className="text-lg font-semibold text-white">That's the whole deck.</div>
                <div className="text-xs text-white/55">You saved {liked.length} title{liked.length === 1 ? "" : "s"}.</div>
              </div>
              <button
                onClick={() => refetch()}
                className="rounded-full bg-white px-5 py-2 text-xs font-semibold text-black hover:bg-white/90"
              >
                Reshuffle
              </button>
            </div>
          )}

          {!isLoading && !done && current && (
            <div className="relative h-full w-full max-w-[360px]">
              {after && <StackCard card={after} depth={2} />}
              {next && <StackCard card={next} depth={1} />}
              <SwipeCard
                key={`${current.kind}-${current.id}`}
                card={current}
                onSwipe={swipe}
                onInfo={() => setDetails(current)}
              />
            </div>
          )}

          {/* Controls */}
          {!isLoading && !done && current && (
            <div className="relative z-10 mt-5 flex items-center gap-3">
              <CtrlBtn label="Pass" onClick={() => swipe("skip")} tone="skip">
                <X className="h-5 w-5" />
              </CtrlBtn>
              <CtrlBtn label="Undo" onClick={undo} tone="ghost" disabled={history.length === 0}>
                <RotateCcw className="h-4 w-4" />
              </CtrlBtn>
              <CtrlBtn label="Details" onClick={() => setDetails(current)} tone="ghost">
                <Info className="h-4 w-4" />
              </CtrlBtn>
              <CtrlBtn label="Save" onClick={() => swipe("like")} tone="like">
                <Heart className="h-5 w-5 fill-current" />
              </CtrlBtn>
            </div>
          )}
        </div>

        {/* Side panel: saved + progress */}
        <aside className="flex flex-col gap-4">
          <div className="liquid-glass rounded-2xl p-4">
            <div className="mb-1 flex items-center justify-between">
              <div className="text-xs font-semibold text-white">Session</div>
              <div className="text-[10px] uppercase tracking-wider text-white/40">
                {Math.min(index, cards.length)}/{cards.length}
              </div>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full transition-all"
                style={{
                  width: `${cards.length ? (index / cards.length) * 100 : 0}%`,
                  background: "rgb(var(--polaris-accent))",
                }}
              />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-center">
              <Stat label="Saved" value={liked.length} />
              <Stat label="Passed" value={history.filter((h) => h.dir === "skip").length} />
            </div>
          </div>

          <div className="liquid-glass flex-1 rounded-2xl p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs font-semibold text-white">Your picks</div>
              <Link to="/mylist" className="text-[10px] uppercase tracking-wider text-white/45 hover:text-white">
                My List →
              </Link>
            </div>
            {liked.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-[11px] text-white/45">
                Swipe right or hit the heart to start your watchlist.
              </div>
            ) : (
              <div className="grid max-h-[360px] grid-cols-3 gap-2 overflow-y-auto pr-1">
                {liked.map((c) => (
                  <div key={`${c.kind}-${c.id}`} className="overflow-hidden rounded-lg border border-white/5">
                    {c.poster_path ? (
                      <img src={IMG(c.poster_path, "w300")} alt="" className="aspect-[2/3] w-full object-cover" />
                    ) : (
                      <div className="aspect-[2/3] w-full bg-white/5 p-1 text-[9px] text-white/60">{c.title || c.name}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {details && <DetailsSheet card={details} onClose={() => setDetails(null)} />}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white/[0.04] py-2">
      <div className="text-lg font-bold text-white">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-white/45">{label}</div>
    </div>
  );
}

function CtrlBtn({
  children,
  onClick,
  label,
  tone,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  tone: "like" | "skip" | "ghost";
  disabled?: boolean;
}) {
  const styles =
    tone === "like"
      ? "bg-rose-500 text-white hover:bg-rose-400 shadow-[0_10px_30px_-10px_rgba(244,63,94,0.7)]"
      : tone === "skip"
      ? "bg-white/10 text-white hover:bg-white/15"
      : "bg-white/[0.06] text-white/75 hover:text-white hover:bg-white/10";
  const size = tone === "ghost" ? "h-10 w-10" : "h-12 w-12";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`grid ${size} place-items-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-40 ${styles}`}
    >
      {children}
    </button>
  );
}

function StackCard({ card, depth }: { card: Card; depth: 1 | 2 }) {
  const scale = depth === 1 ? 0.94 : 0.88;
  const ty = depth === 1 ? 14 : 28;
  const opacity = depth === 1 ? 0.7 : 0.4;
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900"
      style={{ transform: `translateY(${ty}px) scale(${scale})`, opacity, zIndex: 10 - depth }}
    >
      {card.poster_path && (
        <img src={IMG(card.poster_path, "w500")} alt="" className="h-full w-full object-cover" />
      )}
    </div>
  );
}

function SwipeCard({
  card,
  onSwipe,
  onInfo,
}: {
  card: Card;
  onSwipe: (dir: "like" | "skip") => void;
  onInfo: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const [leaving, setLeaving] = useState<null | "like" | "skip">(null);

  const onDown = (e: React.PointerEvent) => {
    if (leaving) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    start.current = { x: e.clientX, y: e.clientY };
    setDrag({ x: 0, y: 0 });
  };
  const onMove = (e: React.PointerEvent) => {
    if (!start.current) return;
    setDrag({ x: e.clientX - start.current.x, y: e.clientY - start.current.y });
  };
  const onUp = () => {
    if (!drag) return;
    const threshold = 110;
    if (drag.x > threshold) flyOut("like");
    else if (drag.x < -threshold) flyOut("skip");
    else {
      setDrag(null);
      start.current = null;
    }
  };
  const flyOut = (dir: "like" | "skip") => {
    setLeaving(dir);
    setTimeout(() => onSwipe(dir), 240);
  };

  const x = leaving ? (leaving === "like" ? 600 : -600) : drag?.x ?? 0;
  const y = leaving ? 60 : drag?.y ?? 0;
  const rot = x / 18;
  const likeOpacity = Math.max(0, Math.min(1, x / 110));
  const skipOpacity = Math.max(0, Math.min(1, -x / 110));

  const title = card.title || card.name || "Untitled";
  const year = (card.release_date || card.first_air_date || "").slice(0, 4);

  return (
    <div
      ref={ref}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      className="absolute inset-0 z-20 cursor-grab touch-none select-none overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl active:cursor-grabbing"
      style={{
        transform: `translate(${x}px, ${y}px) rotate(${rot}deg)`,
        transition: drag && !leaving ? "none" : "transform 240ms cubic-bezier(.2,.8,.2,1)",
      }}
    >
      {card.poster_path && (
        <img
          src={IMG(card.poster_path, "w500")}
          alt={title}
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

      {/* Swipe indicators */}
      <div
        className="absolute left-4 top-4 rotate-[-12deg] rounded-md border-2 border-emerald-400 px-2 py-1 text-xs font-black uppercase tracking-widest text-emerald-400"
        style={{ opacity: likeOpacity }}
      >
        Save
      </div>
      <div
        className="absolute right-4 top-4 rotate-[12deg] rounded-md border-2 border-rose-400 px-2 py-1 text-xs font-black uppercase tracking-widest text-rose-400"
        style={{ opacity: skipOpacity }}
      >
        Pass
      </div>

      {/* Footer info */}
      <div className="absolute inset-x-0 bottom-0 p-4 text-white">
        <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-wider text-white/70">
          <span className="rounded-sm border border-white/30 px-1.5 py-0.5">
            {card.kind === "movie" ? "Movie" : "Series"}
          </span>
          {year && <span>{year}</span>}
          <span className="ml-auto inline-flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            {card.vote_average.toFixed(1)}
          </span>
        </div>
        <h3 className="text-lg font-bold leading-tight drop-shadow">{title}</h3>
        {card.overview && (
          <p className="mt-1 line-clamp-2 text-[11px] text-white/75">{card.overview}</p>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onInfo();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur hover:bg-white/20"
        >
          <Info className="h-3 w-3" /> More info
        </button>
      </div>
    </div>
  );
}

function DetailsSheet({ card, onClose }: { card: Card; onClose: () => void }) {
  const title = card.title || card.name || "";
  const year = (card.release_date || card.first_air_date || "").slice(0, 4);
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <div
        className="liquid-glass-strong relative z-10 w-full max-w-lg overflow-hidden rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {card.backdrop_path && (
          <div className="relative h-52">
            <img src={IMG(card.backdrop_path, "w780")} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
            <button
              onClick={onClose}
              className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="p-5 text-white">
          <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-wider text-white/55">
            <span className="rounded border border-white/20 px-1.5">{card.kind === "movie" ? "Movie" : "Series"}</span>
            {year && <span>{year}</span>}
            <span className="inline-flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {card.vote_average.toFixed(1)}
            </span>
          </div>
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/80">{card.overview || "No description available."}</p>
          <div className="mt-4 flex gap-2">
            <Link
              to="/media"
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90"
            >
              <Play className="h-4 w-4 fill-black" /> Open in Cinema
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
