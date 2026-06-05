import { useEffect, useMemo, useRef, useState } from "react";
import {
  Loader2, Play, MessageCircle, ExternalLink, ChevronLeft, ChevronRight, Crown,
  Sparkles, Gamepad2, Globe2, Cloud, Layers,
} from "lucide-react";
import { EmbedFrame } from "./EmbedFrame";
import { GameTile } from "./GameTile";
import { PolarisPlaySplash } from "./PolarisPlaySplash";
import { POLARIS_GAMES } from "@/lib/polaris-games";
import {
  hydraSearch, steamHeader,
  type HydraEdge,
} from "@/lib/hydra-api";
import { fetchHydraNetwork, hydraNetAsset, type HydraNetGame } from "@/lib/hydra-network";
import { lumin, luminImage, type LuminGame } from "@/lib/lumin";
import { useShowDiscord } from "@/lib/ui-prefs";
import { recordPlay, useContinuePlaying } from "@/lib/continue-playing";

const POLARIS_CDN = "https://cdn.jsdelivr.net/npm/ugs-singlefiles@1.0.6/";
const GNMATH_HTML = "https://cdn.jsdelivr.net/gh/freebuisness/html@main";
const GNMATH_COVER = "https://cdn.jsdelivr.net/gh/freebuisness/covers@main";
const GNMATH_ZONES = "https://cdn.jsdelivr.net/gh/freebuisness/assets@latest/zones.json";

type GnZone = { id: number; name: string; cover: string; url: string };
type PlayItem = { src: string; title: string; mode: "src" | "srcdoc" };
type LaunchItem = PlayItem & { id?: string; cover?: string; source?: string };
type Filter = "all" | "gnmath" | "hydra" | "lumin" | "polaris" | "cloud";

const FILTERS: { id: Filter; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "all", label: "All Games", Icon: Sparkles },
  { id: "gnmath", label: "Gn-Math", Icon: Flame },
  { id: "hydra", label: "Hydra Network", Icon: Globe2 },
  { id: "lumin", label: "LuminSDK", Icon: Layers },
  { id: "polaris", label: "Polaris Collection", Icon: Gamepad2 },
  { id: "cloud", label: "Cine Cloud Gaming", Icon: Cloud },
];

/* ───────── Lumin — open in new tab to luminsdk.com so their SDK runs on its own origin ───────── */
function LuminTile({ g, onLaunched }: { g: LuminGame; onLaunched: (p: LaunchItem) => void }) {
  const [cover, setCover] = useState<string | undefined>();
  useEffect(() => {
    let alive = true;
    luminImage(g.image_token).then((u) => { if (alive && u) setCover(u); });
    return () => { alive = false; };
  }, [g.image_token]);
  return (
    <GameTile
      title={g.name}
      cover={cover}
      autoCover={false}
      onPlay={async () => {
        let url = `https://luminsdk.com/?game=${encodeURIComponent(g.id)}`;
        try {
          const api = await lumin();
          const r = await api.getGameUrl(g.id);
          if (r?.url) url = r.url;
        } catch {/* fall back to luminsdk.com */}
        window.open(url, "_blank", "noopener,noreferrer");
        onLaunched({ src: url, title: g.name, mode: "src", id: `lumin-${g.id}`, cover, source: "LuminSDK" });
      }}
    />
  );
}

function DiscordCallout() {
  return (
    <a
      href="https://discord.gg/fUhccQjbT"
      target="_blank"
      rel="noreferrer"
      className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-white/10 px-4 py-3 sm:px-5 sm:py-4 transition hover:border-white/20"
      style={{ background: "linear-gradient(135deg, rgba(88,101,242,0.25), rgba(88,101,242,0.05) 60%, transparent), rgba(255,255,255,0.03)" }}
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white" style={{ background: "#5865F2" }}>
        <MessageCircle className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold text-white">Join the Polaris Discord</div>
        <div className="truncate text-xs text-white/65">News, game requests, support & community</div>
      </div>
      <span className="hidden shrink-0 items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white sm:inline-flex">
        Join <ExternalLink className="h-3 w-3" />
      </span>
    </a>
  );
}

/* ───────── Filter tab bar — icon only, tooltip on hover ───────── */
function FilterTabs({ active, onChange }: { active: Filter; onChange: (f: Filter) => void }) {
  return (
    <div className="-mx-3 overflow-x-auto px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0">
      <div className="flex w-max items-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.03] p-1.5 backdrop-blur">
        {FILTERS.map(({ id, label, Icon }) => {
          const on = active === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              title={label}
              aria-label={label}
              className={`grid h-10 w-10 place-items-center rounded-xl transition sm:h-11 sm:w-11 ${
                on
                  ? "bg-white text-black shadow-[0_6px_24px_-8px_rgba(255,255,255,0.55)]"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ───────── PolarisFlix-style rotating hero (game cover + name only, no copy) ───────── */
type HeroItem = { key: string; title: string; cover?: string; sourceLabel: string; onPlay: () => void };

function HeroBillboard({
  items, idx, setIdx,
}: {
  items: HeroItem[] | null;
  idx: number;
  setIdx: (n: number) => void;
}) {
  const len = items?.length ?? 0;
  const prev = len ? items![(idx - 1 + len) % len] : null;
  const next = len ? items![(idx + 1) % len] : null;
  const cur = len ? items![idx] : null;

  const Sliver = ({ item, side }: { item: HeroItem | null; side: "left" | "right" }) => (
    <button
      onClick={() => len && setIdx(side === "left" ? (idx - 1 + len) % len : (idx + 1) % len)}
      className="group relative hidden w-14 shrink-0 overflow-hidden rounded-2xl border border-white/10 sm:block lg:w-20"
      aria-label={side === "left" ? "Previous" : "Next"}
    >
      {item?.cover && (
        <img src={item.cover} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover opacity-60 transition group-hover:opacity-90" />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/70" />
      <div className="absolute inset-0 grid place-items-center text-white/70 group-hover:text-white">
        {side === "left" ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
      </div>
    </button>
  );

  return (
    <div className="flex h-[260px] gap-2 sm:h-[400px] sm:gap-3 lg:h-[480px]">
      <Sliver item={prev} side="left" />
      <div className="relative flex-1 overflow-hidden rounded-3xl border border-white/10 shadow-[0_30px_80px_-30px_rgba(0,112,255,0.55)]">
        {items?.map((f, i) => (
          <div
            key={f.key}
            className={`absolute inset-0 transition-opacity duration-[900ms] ${i === idx ? "opacity-100" : "opacity-0"}`}
          >
            {f.cover && (
              <img src={f.cover} alt="" loading={i === idx ? "eager" : "lazy"} decoding="async" className="absolute inset-0 h-full w-full object-cover scale-105" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent" />
          </div>
        ))}
        {!items && (
          <div className="absolute inset-0 grid place-items-center" style={{ background: "linear-gradient(110deg, rgba(0,112,255,0.32), transparent 70%), #0a0d14" }}>
            <Loader2 className="h-6 w-6 animate-spin text-white/50" />
          </div>
        )}
        <div className="relative flex h-full flex-col justify-end p-5 sm:p-10">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.35em] text-white/80">
            <Crown className="h-3 w-3 text-amber-300" /> Most Popular on Polaris Play
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-white drop-shadow sm:text-5xl lg:text-6xl">
            {cur?.title ?? ""}
          </h1>
          {cur && (
            <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/55">
              {cur.sourceLabel}
            </div>
          )}
          {cur && (
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={cur.onPlay}
                className="flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-bold text-black transition hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98] sm:px-6 sm:py-2.5"
              >
                <Play className="h-4 w-4 fill-black" /> Play Now
              </button>
              {len > 1 && (
                <div className="ml-1 flex gap-1.5">
                  {items!.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setIdx(i)}
                      className={`h-1.5 rounded-full transition-all ${i === idx ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70"}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Sliver item={next} side="right" />
    </div>
  );
}

type CatalogItem = {
  key: string;
  title: string;
  cover?: string;
  source: Exclude<Filter, "all">;
  sourceLabel: string;
  onPlay: () => void;
  // Lumin tiles need async cover resolution + their own launch flow
  lumin?: LuminGame;
};

function HomeFeed({ onPlay }: { onPlay: (p: LaunchItem) => void }) {
  const [showDiscord] = useShowDiscord();
  const [filter, setFilter] = useState<Filter>("all");
  const [hydra, setHydra] = useState<HydraEdge[] | null>(null);
  const [gn, setGn] = useState<GnZone[] | null>(null);
  const [hydraNet, setHydraNet] = useState<HydraNetGame[] | null>(null);
  const [luminGames, setLuminGames] = useState<LuminGame[] | null>(null);
  const [luminRandom, setLuminRandom] = useState<LuminGame[] | null>(null);
  const [heroIdx, setHeroIdx] = useState(0);
  const recent = useContinuePlaying();
  const [visible, setVisible] = useState(36);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    hydraSearch({ title: "", take: 30, signal: ctrl.signal })
      .then((r) => setHydra(r.edges))
      .catch(() => setHydra([]));
    fetch(GNMATH_ZONES, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((z: GnZone[]) => setGn(z.filter((g) => g.id >= 0 && g.url?.startsWith("{HTML_URL}"))))
      .catch(() => setGn([]));
    fetchHydraNetwork(ctrl.signal).then((list) => setHydraNet(list.slice(0, 40))).catch(() => setHydraNet([]));
    lumin()
      .then((api) => Promise.all([
        api.getGames({ page: 1, limit: 30 }).then((r) => r.games),
        api.getRandomGames(20).then((r) => r.games),
      ]))
      .then(([a, b]) => { setLuminGames(a); setLuminRandom(b); })
      .catch(() => { setLuminGames([]); setLuminRandom([]); });
    return () => ctrl.abort();
  }, []);

  // Unified catalog — combine everything into one vertical, scrollable grid.
  const catalog = useMemo<CatalogItem[]>(() => {
    const items: CatalogItem[] = [];

    (gn ?? []).forEach((g) => {
      const cover = g.cover.replace("{COVER_URL}", GNMATH_COVER);
      const src = g.url.replace("{HTML_URL}", GNMATH_HTML);
      items.push({
        key: `gn-${g.id}`,
        title: g.name,
        cover,
        source: "gnmath",
        sourceLabel: "Gn-Math",
        onPlay: () => onPlay({ src, title: g.name, mode: "srcdoc", id: `gn-${g.id}`, cover, source: "Gn-Math" }),
      });
    });

    (hydraNet ?? []).forEach((g) => {
      items.push({
        key: `hn-${g.file_name}`,
        title: g.title,
        cover: hydraNetAsset(g.thumb),
        source: "hydra",
        sourceLabel: "Hydra Network",
        onPlay: () => onPlay({
          src: hydraNetAsset(g.file_name), title: g.title, mode: "src",
          id: `hn-${g.file_name}`, cover: hydraNetAsset(g.thumb), source: "Hydra Network",
        }),
      });
    });

    POLARIS_GAMES.forEach((g) => {
      items.push({
        key: `pc-${g.f}`,
        title: g.t,
        source: "polaris",
        sourceLabel: "Polaris Catalog",
        onPlay: () => onPlay({
          src: POLARIS_CDN + encodeURI(g.f), title: g.t, mode: "srcdoc",
          id: `pc-${g.f}`, source: "Polaris Catalog",
        }),
      });
    });

    (hydra ?? []).forEach((g) => {
      items.push({
        key: `cloud-${g.id}`,
        title: g.title,
        cover: g.libraryImageUrl || steamHeader(g.objectId),
        source: "cloud",
        sourceLabel: "Cine Cloud Gaming",
        onPlay: () => window.open(`https://store.steampowered.com/app/${g.objectId}/`, "_blank", "noopener"),
      });
    });

    const luminAll = [...(luminGames ?? []), ...(luminRandom ?? [])];
    const seenLumin = new Set<string>();
    luminAll.forEach((g) => {
      if (seenLumin.has(g.id)) return;
      seenLumin.add(g.id);
      items.push({
        key: `lumin-${g.id}`,
        title: g.name,
        source: "lumin",
        sourceLabel: "LuminSDK",
        onPlay: () => {},
        lumin: g,
      });
    });

    return items;
  }, [gn, hydraNet, hydra, luminGames, luminRandom, onPlay]);

  // Hero items — pick from playable sources (Hydra Network HTML5 + Gn-Math), so
  // "Play Now" actually launches a game instead of opening Steam.
  const heroItems = useMemo<HeroItem[]>(() => {
    const playable = catalog.filter(
      (c) => (c.source === "hydra" || c.source === "gnmath") && c.cover,
    );
    return playable.slice(0, 8).map((c) => ({
      key: c.key,
      title: c.title,
      cover: c.cover,
      sourceLabel: c.sourceLabel,
      onPlay: c.onPlay,
    }));
  }, [catalog]);

  useEffect(() => {
    if (heroItems.length < 2) return;
    const t = setInterval(() => setHeroIdx((i) => (i + 1) % heroItems.length), 6500);
    return () => clearInterval(t);
  }, [heroItems.length]);

  const filtered = useMemo(
    () => (filter === "all" ? catalog : catalog.filter((c) => c.source === filter)),
    [catalog, filter],
  );

  // Reset pagination on filter change
  useEffect(() => { setVisible(36); }, [filter]);

  // Infinite scroll via IntersectionObserver sentinel — no scroll-event spam.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible((v) => (v < filtered.length ? Math.min(v + 36, filtered.length) : v));
        }
      },
      { rootMargin: "1200px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [filtered.length]);

  const loadingAll = gn === null && hydra === null && hydraNet === null && luminGames === null;

  return (
    <div className="space-y-6">
      {showDiscord && <DiscordCallout />}

      {filter === "all" && (
        <HeroBillboard items={heroItems.length ? heroItems : null} idx={heroIdx} setIdx={setHeroIdx} />
      )}

      {recent.length > 0 && filter === "all" && (
        <section>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-white/60">Continue Playing</h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 md:grid-cols-5 lg:grid-cols-7">
            {recent.slice(0, 7).map((g) => (
              <GameTile
                key={g.id}
                id={g.id}
                title={g.title}
                cover={g.cover}
                autoCover={!g.cover}
                source={g.source}
                onPlay={() => onPlay({ src: g.src, title: g.title, mode: g.mode, id: g.id, cover: g.cover, source: g.source })}
              />
            ))}
          </div>
        </section>
      )}

      <FilterTabs active={filter} onChange={setFilter} />

      {loadingAll ? (
        <div className="flex h-40 items-center justify-center text-white/40">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : (
        <section>
          <div
            className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
            style={{ contentVisibility: "auto", containIntrinsicSize: "1px 220px" } as React.CSSProperties}
          >
            {filtered.slice(0, visible).map((c) =>
              c.lumin ? (
                <LuminTile key={c.key} g={c.lumin} onLaunched={onPlay} />
              ) : (
                <GameTile
                  key={c.key}
                  title={c.title}
                  cover={c.cover}
                  autoCover={!c.cover}
                  source={c.sourceLabel}
                  onPlay={c.onPlay}
                />
              ),
            )}
          </div>
          <div ref={sentinelRef} className="h-10" />
          {visible < filtered.length && (
            <div className="mt-2 flex justify-center text-white/40">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}
          {filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/15 px-5 py-10 text-center text-sm text-white/55">
              No games in this category yet.
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export function GamesHub() {
  const [playing, setPlaying] = useState<PlayItem | null>(null);

  const launch = (p: LaunchItem) => {
    setPlaying({ src: p.src, title: p.title, mode: p.mode });
    if (p.id) recordPlay({ id: p.id, title: p.title, cover: p.cover, src: p.src, mode: p.mode, source: p.source });
  };

  return (
    <div className="relative min-h-screen">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(110% 55% at 20% 0%, rgba(0,112,255,0.22) 0%, rgba(20,40,90,0.10) 35%, rgba(0,0,0,0) 70%), radial-gradient(90% 50% at 90% 100%, rgba(60,120,255,0.18) 0%, rgba(0,0,0,0) 60%), linear-gradient(180deg, rgba(6,10,20,0.55) 0%, rgba(2,4,10,0.92) 100%)",
        }}
      />
      <PolarisPlaySplash />
      <div className="mx-auto max-w-[1600px] px-3 py-5 pb-32 sm:px-6 sm:py-8">
        <HomeFeed onPlay={launch} />
      </div>

      {playing && (
        <EmbedFrame src={playing.src} title={playing.title} mode={playing.mode} onClose={() => setPlaying(null)} />
      )}
    </div>
  );
}