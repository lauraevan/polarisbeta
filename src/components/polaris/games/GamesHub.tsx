import { useEffect, useMemo, useState } from "react";
import {
  Loader2, Play, MessageCircle, ExternalLink, ChevronLeft, ChevronRight,
  Clock, Sparkles, Gamepad2, Globe2, Cloud, Layers, Flame,
} from "lucide-react";
import { EmbedFrame } from "./EmbedFrame";
import { GameTile } from "./GameTile";
import { PolarisPlaySplash } from "./PolarisPlaySplash";
import { POLARIS_GAMES } from "@/lib/polaris-games";
import {
  hydraSearch, hydraFeatured, steamHeader,
  type HydraEdge, type HydraFeatured,
} from "@/lib/hydra-api";
import { fetchHydraNetwork, hydraNetAsset, type HydraNetGame } from "@/lib/hydra-network";
import { lumin, luminImage, type LuminGame } from "@/lib/lumin";
import { useShowDiscord } from "@/lib/ui-prefs";
import { recordPlay, useContinuePlaying, type RecentGame } from "@/lib/continue-playing";
import { AdsterraBanner } from "../ads/AdsterraBanner";

const POLARIS_CDN = "https://cdn.jsdelivr.net/npm/ugs-singlefiles@1.0.6/";
const GNMATH_HTML = "https://cdn.jsdelivr.net/gh/freebuisness/html@main";
const GNMATH_COVER = "https://cdn.jsdelivr.net/gh/freebuisness/covers@main";
const GNMATH_ZONES = "https://cdn.jsdelivr.net/gh/freebuisness/assets@latest/zones.json";

type GnZone = { id: number; name: string; cover: string; url: string };
type PlayItem = { src: string; title: string; mode: "src" | "srcdoc" };
type LaunchItem = PlayItem & { id?: string; cover?: string; source?: string };
type Filter = "all" | "continue" | "gnmath" | "hydra" | "lumin" | "polaris" | "cloud";

const SPOTLIGHT_SLUGS = ["hollow-knight", "silksong", "celeste", "undertale", "minecraft"];

const FILTERS: { id: Filter; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "all", label: "Home", Icon: Sparkles },
  { id: "continue", label: "Continue Playing", Icon: Clock },
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

/* ───────── Horizontal-scroll section row (premium, no title) ───────── */
function Row({
  loading,
  size = "md",
  children,
}: {
  loading: boolean;
  size?: "md" | "lg";
  children?: React.ReactNode;
}) {
  if (loading) {
    return (
      <section className="flex h-32 items-center justify-center text-white/40">
        <Loader2 className="h-5 w-5 animate-spin" />
      </section>
    );
  }
  const w = size === "lg" ? "w-44 sm:w-52" : "w-36 sm:w-40";
  return (
    <section className="-mx-3 px-3 sm:mx-0 sm:px-0">
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {Array.isArray(children)
          ? children.map((c, i) => (
              <div key={i} className={`shrink-0 snap-start ${w}`}>{c}</div>
            ))
          : <div className={`shrink-0 snap-start ${w}`}>{children}</div>}
      </div>
    </section>
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
function HeroBillboard({
  popular, idx, setIdx,
}: {
  popular: HydraFeatured[] | null;
  idx: number;
  setIdx: (n: number) => void;
}) {
  const len = popular?.length ?? 0;
  const prev = len ? popular![(idx - 1 + len) % len] : null;
  const next = len ? popular![(idx + 1) % len] : null;
  const cur = len ? popular![idx] : null;

  const Sliver = ({ item, side }: { item: HydraFeatured | null; side: "left" | "right" }) => (
    <button
      onClick={() => len && setIdx(side === "left" ? (idx - 1 + len) % len : (idx + 1) % len)}
      className="group relative hidden w-14 shrink-0 overflow-hidden rounded-2xl border border-white/10 sm:block lg:w-20"
      aria-label={side === "left" ? "Previous" : "Next"}
    >
      {item?.libraryHeroImageUrl && (
        <img src={item.libraryHeroImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60 transition group-hover:opacity-90" />
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
        {popular?.map((f, i) => (
          <div
            key={f.objectId}
            className={`absolute inset-0 transition-opacity duration-[900ms] ${i === idx ? "opacity-100" : "opacity-0"}`}
          >
            {f.libraryHeroImageUrl && (
              <img src={f.libraryHeroImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover scale-105" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent" />
          </div>
        ))}
        {!popular && (
          <div className="absolute inset-0 grid place-items-center" style={{ background: "linear-gradient(110deg, rgba(0,112,255,0.32), transparent 70%), #0a0d14" }}>
            <Loader2 className="h-6 w-6 animate-spin text-white/50" />
          </div>
        )}
        <div className="relative flex h-full flex-col justify-end p-5 sm:p-10">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.35em] text-white/70">
            <Flame className="h-3 w-3" /> Most Popular
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-white drop-shadow sm:text-5xl lg:text-6xl">
            {cur?.title ?? ""}
          </h1>
          {cur && (
            <div className="mt-4 flex items-center gap-3">
              <a
                href={`https://store.steampowered.com/app/${cur.objectId}/`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-bold text-black transition hover:bg-white/90 sm:px-6 sm:py-2.5"
              >
                <Play className="h-4 w-4 fill-black" /> Play
              </a>
              {len > 1 && (
                <div className="ml-1 flex gap-1.5">
                  {popular!.map((_, i) => (
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

/* ───────── Continue Playing — responsive, no title clutter ───────── */
function ContinueRow({
  items, onPlay,
}: {
  items: RecentGame[];
  onPlay: (p: LaunchItem) => void;
}) {
  if (!items.length) {
    return (
      <section className="rounded-2xl border border-dashed border-white/15 px-5 py-6 text-center text-sm text-white/55">
        Play a game and it'll show up here.
      </section>
    );
  }

  // Sliver bookends only on wide screens — they made mobile look broken.
  const left = items[0];
  const right = items[6];
  const main = items.length > 1 ? items.slice(1, 6) : items;

  const Card = ({ g }: { g: RecentGame }) => (
    <button
      onClick={() => onPlay({ src: g.src, title: g.title, mode: g.mode, id: g.id, cover: g.cover, source: g.source })}
      className="group relative h-24 overflow-hidden rounded-xl border border-white/10 bg-white/5 text-left transition hover:-translate-y-0.5 hover:border-white/30 sm:h-28"
    >
      {g.cover && <img src={g.cover} alt="" className="absolute inset-0 h-full w-full object-cover transition group-hover:scale-105" />}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
      <div className="relative flex h-full items-end p-2.5 sm:p-3">
        <div className="min-w-0">
          <div className="line-clamp-1 text-xs font-bold text-white drop-shadow sm:text-sm">{g.title}</div>
          {g.source && <div className="text-[9px] uppercase tracking-wider text-white/60 sm:text-[10px]">{g.source}</div>}
        </div>
      </div>
    </button>
  );

  const Sliver = ({ g }: { g: RecentGame }) => (
    <button
      onClick={() => onPlay({ src: g.src, title: g.title, mode: g.mode, id: g.id, cover: g.cover, source: g.source })}
      className="relative hidden h-28 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10 transition hover:border-white/30 lg:block"
      title={g.title}
    >
      {g.cover && <img src={g.cover} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80" />
    </button>
  );

  return (
    <section className="flex items-stretch gap-2 sm:gap-3">
      {left && <Sliver g={left} />}
      <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
        {main.map((g) => <Card key={g.id} g={g} />)}
      </div>
      {right && <Sliver g={right} />}
    </section>
  );
}

function HomeFeed({ onPlay }: { onPlay: (p: LaunchItem) => void }) {
  const [showDiscord] = useShowDiscord();
  const [filter, setFilter] = useState<Filter>("all");
  const [hydra, setHydra] = useState<HydraEdge[] | null>(null);
  const [gn, setGn] = useState<GnZone[] | null>(null);
  const [popular, setPopular] = useState<HydraFeatured[] | null>(null);
  const [hydraNet, setHydraNet] = useState<HydraNetGame[] | null>(null);
  const [luminGames, setLuminGames] = useState<LuminGame[] | null>(null);
  const [luminRandom, setLuminRandom] = useState<LuminGame[] | null>(null);
  const [heroIdx, setHeroIdx] = useState(0);
  const recent = useContinuePlaying();

  useEffect(() => {
    const ctrl = new AbortController();
    hydraSearch({ title: "", take: 12, signal: ctrl.signal }).then((r) => setHydra(r.edges)).catch(() => setHydra([]));
    hydraFeatured(ctrl.signal).then((f) => setPopular(f.slice(0, 6))).catch(() => setPopular([]));
    fetch(GNMATH_ZONES, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((z: GnZone[]) => setGn(z.filter((g) => g.id >= 0 && g.url?.startsWith("{HTML_URL}"))))
      .catch(() => setGn([]));
    fetchHydraNetwork(ctrl.signal).then((list) => setHydraNet(list.slice(0, 21))).catch(() => setHydraNet([]));
    lumin()
      .then((api) => Promise.all([
        api.getGames({ page: 1, limit: 21 }).then((r) => r.games),
        api.getRandomGames(14).then((r) => r.games),
      ]))
      .then(([a, b]) => { setLuminGames(a); setLuminRandom(b); })
      .catch(() => { setLuminGames([]); setLuminRandom([]); });
    return () => ctrl.abort();
  }, []);

  useEffect(() => {
    if (!popular || popular.length < 2) return;
    const t = setInterval(() => setHeroIdx((i) => (i + 1) % popular.length), 6500);
    return () => clearInterval(t);
  }, [popular]);

  const spotlight = useMemo<GnZone[]>(() => {
    if (!gn) return [];
    const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return SPOTLIGHT_SLUGS.map((needle) => gn.find((g) => slug(g.name).includes(needle))).filter(Boolean) as GnZone[];
  }, [gn]);

  const gnFeatured = useMemo(() => gn?.slice(0, 24) ?? [], [gn]);

  const polarisPicks = useMemo(() => {
    const picks = [
      "1v1lol","slope","retrobowl","driftboss","tunnelrush","crossyroad",
      "subwaysurfers","tombofthemask","tinyfishing","monkeymart","cookieclicker","2048",
      "geometrydash","amongus","minecraftclassic","papasfreezeria","awesometanks","bittlife",
    ];
    return picks.map((s) => POLARIS_GAMES.find((g) => g.f.toLowerCase().includes(s))).filter(Boolean) as typeof POLARIS_GAMES;
  }, []);

  const continueItems = useMemo<RecentGame[]>(() => {
    if (recent.length > 0) return recent.slice(0, 7);
    return spotlight.slice(0, 7).map((g) => ({
      id: `gn-${g.id}`,
      title: g.name,
      cover: g.cover.replace("{COVER_URL}", GNMATH_COVER),
      src: g.url.replace("{HTML_URL}", GNMATH_HTML),
      mode: "srcdoc" as const,
      source: "Gn-Math",
      ts: 0,
    }));
  }, [recent, spotlight]);

  const show = (k: Filter) => filter === "all" || filter === k;

  // —— Section primitives ——
  const HeroSection = (
    <HeroBillboard popular={popular} idx={heroIdx} setIdx={setHeroIdx} />
  );

  const ContinueSection = (
    <ContinueRow items={continueItems} onPlay={onPlay} />
  );

  const SpotlightSection = spotlight.length > 0 ? (
    <section>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
        {spotlight.map((g) => (
          <GameTile
            key={g.id}
            title={g.name}
            cover={g.cover.replace("{COVER_URL}", GNMATH_COVER)}
            autoCover={false}
            size="lg"
            onPlay={() => onPlay({
              src: g.url.replace("{HTML_URL}", GNMATH_HTML),
              title: g.name, mode: "srcdoc",
              id: `gn-${g.id}`, cover: g.cover.replace("{COVER_URL}", GNMATH_COVER), source: "Gn-Math",
            })}
          />
        ))}
      </div>
    </section>
  ) : null;

  const SteamSection = (
    <Row loading={hydra === null}>
      {hydra?.map((g) => (
        <GameTile
          key={g.id}
          title={g.title}
          cover={g.libraryImageUrl || steamHeader(g.objectId)}
          autoCover={false}
          onPlay={() => window.open(`https://store.steampowered.com/app/${g.objectId}/`, "_blank", "noopener")}
        />
      ))}
    </Row>
  );

  const LuminSection = (
    <Row loading={luminGames === null}>
      {luminGames?.map((g) => <LuminTile key={g.id} g={g} onLaunched={onPlay} />)}
      {luminRandom?.map((g) => <LuminTile key={`r-${g.id}`} g={g} onLaunched={onPlay} />)}
    </Row>
  );

  const GnSection = (
    <Row loading={gn === null}>
      {gnFeatured.map((g) => (
        <GameTile
          key={g.id}
          title={g.name}
          cover={g.cover.replace("{COVER_URL}", GNMATH_COVER)}
          autoCover={false}
          onPlay={() => onPlay({
            src: g.url.replace("{HTML_URL}", GNMATH_HTML),
            title: g.name, mode: "srcdoc",
            id: `gn-${g.id}`, cover: g.cover.replace("{COVER_URL}", GNMATH_COVER), source: "Gn-Math",
          })}
        />
      ))}
    </Row>
  );

  const HydraNetSection = (
    <Row loading={hydraNet === null}>
      {hydraNet?.map((g) => (
        <GameTile
          key={g.file_name}
          title={g.title}
          cover={hydraNetAsset(g.thumb)}
          autoCover={false}
          onPlay={() => onPlay({
            src: hydraNetAsset(g.file_name), title: g.title, mode: "src",
            id: `hn-${g.file_name}`, cover: hydraNetAsset(g.thumb), source: "Hydra Network",
          })}
        />
      ))}
    </Row>
  );

  const PolarisSection = (
    <Row loading={false}>
      {polarisPicks.map((g) => (
        <GameTile
          key={g.f}
          title={g.t}
          onPlay={() => onPlay({
            src: POLARIS_CDN + encodeURI(g.f), title: g.t, mode: "srcdoc",
            id: `pc-${g.f}`, source: "Polaris Catalog",
          })}
        />
      ))}
    </Row>
  );

  return (
    <div className="space-y-8">
      {showDiscord && <DiscordCallout />}

      <FilterTabs active={filter} onChange={setFilter} />

      {filter === "all" && HeroSection}
      {(filter === "all" || filter === "continue") && ContinueSection}
      {filter === "all" && SpotlightSection}

      {show("steam") && SteamSection}
      {show("lumin") && LuminSection}
      {show("gnmath") && GnSection}
      {show("hydra") && HydraNetSection}
      {show("polaris") && PolarisSection}
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