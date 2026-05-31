import { useEffect, useMemo, useState } from "react";
import { Gamepad2, Globe, Calculator, Cloud, Library, Loader2 } from "lucide-react";
import { PolarisCollection } from "./PolarisCollection";
import { EmbedFrame } from "./EmbedFrame";
import { GnMathCollection } from "./GnMathCollection";
import { HydraCatalog } from "./HydraCatalog";
import { GameTile } from "./GameTile";
import { SteamSplash } from "./SteamSplash";
import { ProfileSplash } from "@/components/polaris/ProfileSplash";
import { POLARIS_GAMES } from "@/lib/polaris-games";
import { hydraSearch, steamHeader, type HydraEdge } from "@/lib/hydra-api";

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

  useEffect(() => {
    const ctrl = new AbortController();
    hydraSearch({ title: "", take: 12, skip: 0, signal: ctrl.signal })
      .then((r) => setHydra(r.edges))
      .catch(() => setHydra([]));
    fetch(GNMATH_ZONES, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((z: GnZone[]) =>
        setGn(z.filter((g) => g.id >= 0 && g.url.startsWith("{HTML_URL}")).slice(0, 12))
      )
      .catch(() => setGn([]));
    return () => ctrl.abort();
  }, []);

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
      <div className="relative overflow-hidden rounded-lg border border-white/10 bg-zinc-900">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(110deg, rgba(var(--polaris-accent)/0.32) 0%, rgba(var(--polaris-accent)/0.06) 45%, transparent 70%)",
          }}
        />
        <div className="relative space-y-3 p-6 sm:p-10">
          <div className="text-[10px] uppercase tracking-[0.35em] text-white/55">
            Polaris Steam
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-4xl">
            Every library, one launcher.
          </h1>
          <p className="max-w-xl text-sm text-white/65">
            HTML5 classics, the full Hydra PC catalogue, Gn-Math unblocked, and
            cloud streaming — all in one place. No installs.
          </p>
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
    <div className="min-h-screen bg-zinc-950">
      <SteamSplash />
      <ProfileSplash tag="games" />
      <div className="mx-auto flex max-w-[1600px] gap-6 px-4 py-6 pb-32 sm:px-6">
        {/* Sidebar nav (Steam-style) */}
        <aside className="sticky top-6 hidden h-fit w-56 shrink-0 self-start rounded-md border border-white/5 bg-zinc-900/60 p-2 backdrop-blur md:block">
          <div className="px-3 py-2 text-[10px] uppercase tracking-[0.25em] text-white/40">
            Sources
          </div>
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`group flex w-full items-center gap-3 rounded-sm px-3 py-2 text-left transition ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/65 hover:bg-white/5 hover:text-white"
                }`}
                style={
                  active
                    ? { boxShadow: "inset 3px 0 0 rgb(var(--polaris-accent))" }
                    : undefined
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">
                  <span className="block text-sm font-medium">{t.label}</span>
                  <span className="block text-[10px] text-white/40">{t.desc}</span>
                </span>
              </button>
            );
          })}
        </aside>

        {/* Mobile top tabs */}
        <div className="sticky top-0 z-10 -mx-4 mb-4 border-b border-white/5 bg-zinc-950/90 px-4 py-2 backdrop-blur md:hidden">
          <div className="flex items-center gap-1 overflow-x-auto">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-sm px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition ${
                    active ? "bg-white/10 text-white" : "text-white/55 hover:text-white"
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