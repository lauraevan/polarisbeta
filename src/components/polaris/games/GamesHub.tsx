import { useEffect, useMemo, useState } from "react";
import { Gamepad2, Globe, Calculator, Cloud, Library, Loader2, Play } from "lucide-react";
import { PolarisCollection } from "./PolarisCollection";
import { EmbedFrame } from "./EmbedFrame";
import { GnMathCollection } from "./GnMathCollection";
import { HydraCatalog } from "./HydraCatalog";
import { GameTile } from "./GameTile";
import { SteamSplash } from "./SteamSplash";
import { POLARIS_GAMES } from "@/lib/polaris-games";
import { hydraSearch, hydraFeatured, steamHeader, type HydraEdge, type HydraFeatured } from "@/lib/hydra-api";

type TabId = "home" | "polaris" | "cine" | "hydra" | "gnmath";

const TABS: { id: TabId; label: string; icon: typeof Gamepad2; desc: string }[] = [
  { id: "home",    label: "Home",              icon: Library,    desc: "Mixed feed" },
  { id: "polaris", label: "Polaris Catalog",   icon: Gamepad2,   desc: "2,685 HTML5 games" },
  { id: "hydra",   label: "Hydra Network",     icon: Globe,      desc: "180k+ PC titles" },
  { id: "gnmath",  label: "Gn-Math",           icon: Calculator, desc: "Unblocked library" },
  { id: "cine",    label: "Cine Cloud",        icon: Cloud,      desc: "Cloud PC games" },
];

const POLARIS_CDN = "https://cdn.jsdelivr.net/npm/ugs-singlefiles@1.0.6/";
const GNMATH_HTML = "https://cdn.jsdelivr.net/gh/freebuisness/html@main";
const GNMATH_COVER = "https://cdn.jsdelivr.net/gh/freebuisness/covers@main";
const GNMATH_ZONES = "https://cdn.jsdelivr.net/gh/freebuisness/assets@latest/zones.json";

type GnZone = { id: number; name: string; cover: string; url: string };

type Play =
  | { src: string; title: string; mode: "src" | "srcdoc" };

function HomeFeed({
  onJump,
  onPlay,
}: {
  onJump: (id: TabId) => void;
  onPlay: (p: Play) => void;
}) {
  const [hydra, setHydra] = useState<HydraEdge[] | null>(null);
  const [gn, setGn] = useState<GnZone[] | null>(null);
  const [featured, setFeatured] = useState<HydraFeatured[] | null>(null);
  const [heroIdx, setHeroIdx] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    hydraSearch({ title: "", take: 12, skip: 0, signal: ctrl.signal })
      .then((r) => setHydra(r.edges))
      .catch(() => setHydra([]));
    hydraFeatured(ctrl.signal)
      .then((f) => setFeatured(f.slice(0, 5)))
      .catch(() => setFeatured([]));
    fetch(GNMATH_ZONES, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((z: GnZone[]) =>
        setGn(z.filter((g) => g.id >= 0 && g.url.startsWith("{HTML_URL}")).slice(0, 12))
      )
      .catch(() => setGn([]));
    return () => ctrl.abort();
  }, []);

  useEffect(() => {
    if (!featured || featured.length < 2) return;
    const t = setInterval(() => setHeroIdx((i) => (i + 1) % featured.length), 6500);
    return () => clearInterval(t);
  }, [featured]);

  const polarisPicks = useMemo(() => {
    const picks = [
      "1v1lol","slope","retrobowl","driftboss","tunnelrush","crossyroad",
      "subwaysurfers","tombofthemask","tinyfishing","monkeymart","cookieclicker","2048",
    ];
    return picks
      .map((s) => POLARIS_GAMES.find((g) => g.f.toLowerCase().includes(s)))
      .filter(Boolean) as typeof POLARIS_GAMES;
  }, []);

  return (
    <div className="space-y-10">
      {/* Rotating hero — cycles through Hydra featured titles */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 min-h-[280px] sm:min-h-[340px]">
        {featured?.map((f, i) => (
          <div
            key={f.objectId}
            className={`absolute inset-0 transition-opacity duration-1000 ${i === heroIdx ? "opacity-100" : "opacity-0"}`}
          >
            {f.libraryHeroImageUrl && (
              <img src={f.libraryHeroImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/10" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/20 to-transparent" />
          </div>
        ))}
        {!featured && (
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(110deg, rgba(var(--polaris-accent)/0.32), transparent 70%), #18171f" }}
          />
        )}
        <div className="relative flex h-full flex-col justify-end p-6 sm:p-10 min-h-[280px] sm:min-h-[340px]">
          <div className="text-[10px] uppercase tracking-[0.35em] text-white/70">Polaris Library</div>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-white drop-shadow sm:text-5xl">
            {featured?.[heroIdx]?.title ?? "Every library, one launcher."}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white/80 line-clamp-2">
            {featured?.[heroIdx]?.description ??
              "HTML5 classics, full Hydra PC catalogue, Gn-Math unblocked, and cloud streaming — no installs."}
          </p>
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => onJump("hydra")}
              className="flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-bold text-black hover:bg-white/90"
            >
              <Play className="h-4 w-4 fill-black" /> Browse
            </button>
            {featured && featured.length > 1 && (
              <div className="ml-2 flex gap-1.5">
                {featured.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setHeroIdx(i)}
                    className={`h-1.5 rounded-full transition-all ${i === heroIdx ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70"}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Row
        title="Hydra Network · Popular"
        onMore={() => onJump("hydra")}
        loading={hydra === null}
      >
        {hydra?.map((g) => (
          <GameTile
            key={g.id}
            title={g.title}
            cover={g.libraryImageUrl || steamHeader(g.objectId)}
            autoCover={false}
            onPlay={() => onJump("hydra")}
          />
        ))}
      </Row>

      <Row
        title="Polaris Catalog · Top Picks"
        onMore={() => onJump("polaris")}
        loading={false}
      >
        {polarisPicks.map((g) => (
          <GameTile
            key={g.f}
            title={g.t}
            onPlay={() =>
              onPlay({ src: POLARIS_CDN + encodeURI(g.f), title: g.t, mode: "srcdoc" })
            }
          />
        ))}
      </Row>

      <Row
        title="Gn-Math · Featured"
        onMore={() => onJump("gnmath")}
        loading={gn === null}
      >
        {gn?.map((g) => (
          <GameTile
            key={g.id}
            title={g.name}
            cover={g.cover.replace("{COVER_URL}", GNMATH_COVER)}
            autoCover={false}
            onPlay={() =>
              onPlay({
                src: g.url.replace("{HTML_URL}", GNMATH_HTML),
                title: g.name,
                mode: "srcdoc",
              })
            }
          />
        ))}
      </Row>
    </div>
  );
}

function Row({
  title,
  onMore,
  loading,
  children,
}: {
  title: string;
  onMore: () => void;
  loading: boolean;
  children?: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/55">
          {title}
        </h3>
        <button
          onClick={onMore}
          className="text-[11px] uppercase tracking-wider text-white/50 hover:text-white"
        >
          See all →
        </button>
      </div>
      {loading ? (
        <div className="flex h-32 items-center justify-center text-white/40">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {children}
        </div>
      )}
    </section>
  );
}

function CineLauncher() {
  return (
    <div className="overflow-hidden rounded-md border border-white/10 bg-black">
      <iframe
        src="https://cinesteam.cine-softwares.workers.dev/"
        title="Cine Cloud"
        className="h-[78vh] w-full border-0"
        allow="autoplay; fullscreen; gamepad; clipboard-write"
        allowFullScreen
      />
    </div>
  );
}

export function GamesHub() {
  const [tab, setTab] = useState<TabId>("home");
  const [playing, setPlaying] = useState<Play | null>(null);

  return (
    <div className="relative min-h-screen">
      {/* Warm cinematic overlay so the games hub matches PolarisFlix warmth */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(110% 55% at 20% 0%, rgba(255,150,60,0.20) 0%, rgba(180,60,20,0.10) 35%, rgba(0,0,0,0) 70%), radial-gradient(90% 50% at 90% 100%, rgba(255,90,40,0.16) 0%, rgba(0,0,0,0) 60%), linear-gradient(180deg, rgba(22,10,4,0.55) 0%, rgba(10,4,2,0.85) 100%)",
        }}
      />
      <SteamSplash />
      <div className="mx-auto flex max-w-[1600px] gap-6 px-4 py-6 pb-32 sm:px-6">
        {/* Icon rail — wallpaper bleeds behind */}
        <aside className="liquid-glass-themed sticky top-6 hidden h-fit w-16 shrink-0 self-start rounded-2xl p-2 md:block">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                title={`${t.label} — ${t.desc}`}
                className={`group relative my-1 grid h-12 w-12 place-items-center rounded-xl transition ${
                  active
                    ? "bg-white text-black"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5" />
                {active && (
                  <span
                    className="absolute -left-2 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full"
                    style={{ background: "rgb(var(--polaris-accent))" }}
                  />
                )}
                <span className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-md bg-black/85 px-2 py-1 text-[11px] font-semibold text-white shadow-lg backdrop-blur group-hover:block z-30">
                  {t.label}
                </span>
              </button>
            );
          })}
        </aside>

        {/* Mobile top tabs */}
        <div className="liquid-glass-themed sticky top-0 z-10 -mx-4 mb-4 px-4 py-2 md:hidden">
          <div className="flex items-center gap-1 overflow-x-auto">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    active ? "bg-white text-black" : "text-white/65 hover:text-white"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <main className="min-w-0 flex-1">
          {tab === "home" && <HomeFeed onJump={setTab} onPlay={setPlaying} />}
          {tab === "polaris" && <PolarisCollection />}
          {tab === "hydra" && <HydraCatalog />}
          {tab === "gnmath" && <GnMathCollection />}
          {tab === "cine" && <CineLauncher />}
        </main>
      </div>

      {playing && (
        <EmbedFrame
          src={playing.src}
          title={playing.title}
          mode={playing.mode}
          onClose={() => setPlaying(null)}
        />
      )}
    </div>
  );
}