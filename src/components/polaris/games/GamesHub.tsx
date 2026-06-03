import { useEffect, useMemo, useState } from "react";
import { useSearch } from "@tanstack/react-router";
import { Gamepad2, Calculator, Cloud, Library, Loader2, Play, Zap, MessageCircle, ExternalLink } from "lucide-react";
import { PolarisCollection } from "./PolarisCollection";
import { EmbedFrame } from "./EmbedFrame";
import { GnMathCollection } from "./GnMathCollection";
import { HydraNetwork } from "./HydraNetwork";
import { GameTile } from "./GameTile";
import { SteamSplash } from "./SteamSplash";
import { POLARIS_GAMES } from "@/lib/polaris-games";
import { hydraSearch, hydraFeatured, steamHeader, type HydraEdge, type HydraFeatured } from "@/lib/hydra-api";
import { useShowDiscord } from "@/lib/ui-prefs";

type TabId = "home" | "polaris" | "cine" | "hydra" | "gnmath" | "gfn";

const TABS: { id: TabId; label: string; icon: typeof Gamepad2; desc: string }[] = [
  { id: "home",    label: "Home",              icon: Library,    desc: "Mixed feed" },
  { id: "polaris", label: "Polaris Catalog",   icon: Gamepad2,   desc: "2,685 HTML5 games" },
  { id: "hydra",   label: "Hydra Network",     icon: Gamepad2,   desc: "HTML5 vault" },
  { id: "gnmath",  label: "Gn-Math",           icon: Calculator, desc: "Unblocked library" },
  { id: "cine",    label: "Cine Cloud",        icon: Cloud,      desc: "Cloud PC games" },
  { id: "gfn",     label: "GeForce Now",       icon: Zap,        desc: "NVIDIA cloud gaming" },
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
  const [showDiscord] = useShowDiscord();
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
      {showDiscord && <DiscordCallout />}
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

function GeForceNowLauncher() {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-white/65">
          <Zap className="h-3.5 w-3.5 text-[#76b900]" /> NVIDIA · GeForce Now
        </div>
        <a
          href="https://play.geforcenow.com/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full bg-[#76b900] px-3 py-1.5 text-xs font-bold text-black hover:brightness-110"
        >
          Open in new tab <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      <div className="overflow-hidden rounded-md border border-white/10 bg-black">
        <iframe
          src="https://play.geforcenow.com/"
          title="GeForce Now"
          className="h-[78vh] w-full border-0"
          allow="autoplay; fullscreen; gamepad; clipboard-read; clipboard-write; xr-spatial-tracking; microphone; camera"
          allowFullScreen
        />
      </div>
      <p className="text-[11px] text-white/50">
        If the frame stays blank, NVIDIA is blocking embedding on your network — use "Open in new tab" above.
      </p>
    </div>
  );
}

function RobloxEmulator() {
  const SERVERS: { id: string; label: string; src: string }[] = [
    { id: "nowgg",   label: "now.gg",        src: "https://now.gg/apps/roblox-corporation/5349/roblox.html" },
    { id: "stratus", label: "Stratus",       src: "https://stratus.us.kg/play/Roblox" },
    { id: "nowggio", label: "now.gg (alt)",  src: "https://nowgg.io/play/Roblox" },
  ];
  const [idx, setIdx] = useState(0);
  const [key, setKey] = useState(0);
  const server = SERVERS[idx];
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-white/65">
          <Gamepad2 className="h-3.5 w-3.5" /> Roblox · Browser Emulator
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {SERVERS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => { setIdx(i); setKey((k) => k + 1); }}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                i === idx ? "bg-white text-black" : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
              }`}
            >
              {s.label}
            </button>
          ))}
          <button
            onClick={() => setKey((k) => k + 1)}
            className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/80 hover:bg-white/20 hover:text-white"
            title="Reload server"
          >
            Reload
          </button>
          <a
            href={server.src}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-bold text-black hover:brightness-110"
          >
            New tab <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
      <div className="overflow-hidden rounded-md border border-white/10 bg-black">
        <iframe
          key={`${server.id}-${key}`}
          src={server.src}
          title={`Roblox · ${server.label}`}
          className="h-[78vh] w-full border-0"
          allow="autoplay; fullscreen; gamepad; clipboard-read; clipboard-write; microphone; camera"
          allowFullScreen
        />
      </div>
      <p className="text-[11px] text-white/50">
        If a server stays blank or fails to load, switch to another server above or open it in a new tab. Sign in with your Roblox account inside the emulator to play your own games.
      </p>
    </div>
  );
}

function DiscordCallout() {
  return (
    <a
      href="https://discord.gg/fUhccQjbT"
      target="_blank"
      rel="noreferrer"
      className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-white/10 px-4 py-3 sm:px-5 sm:py-4 transition hover:border-white/20"
      style={{
        background:
          "linear-gradient(135deg, rgba(88,101,242,0.25), rgba(88,101,242,0.05) 60%, transparent), rgba(255,255,255,0.03)",
      }}
    >
      <div
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white"
        style={{ background: "#5865F2" }}
      >
        <MessageCircle className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold text-white">Join the Polaris Discord</div>
        <div className="truncate text-xs text-white/65">
          News, game requests, support & community — discord.gg/fUhccQjbT
        </div>
      </div>
      <span className="hidden shrink-0 items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white sm:inline-flex">
        Join <ExternalLink className="h-3 w-3" />
      </span>
    </a>
  );
}

export function GamesHub() {
  const search = useSearch({ strict: false }) as { tab?: string };
  const initialTab: TabId =
    search.tab === "gfn" ? "gfn" :
    "home";
  const [tab, setTab] = useState<TabId>(initialTab);
  const [playing, setPlaying] = useState<Play | null>(null);

  useEffect(() => {
    if (search.tab === "gfn") setTab("gfn");
  }, [search.tab]);

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
      {/* Mobile horizontal tab bar — lives OUTSIDE the flex row so it doesn't squeeze beside main */}
      <div className="liquid-glass-themed sticky top-0 z-10 mb-2 px-3 py-2 md:hidden">
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
      <div className="mx-auto flex max-w-[1600px] gap-6 px-3 py-4 pb-32 sm:px-6 sm:py-6">
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

        <main className="min-w-0 flex-1">
          {tab === "home" && <HomeFeed onJump={setTab} onPlay={setPlaying} />}
          {tab === "polaris" && <PolarisCollection />}
          {tab === "hydra" && <HydraNetwork />}
          {tab === "gnmath" && <GnMathCollection />}
          {tab === "cine" && <CineLauncher />}
          {tab === "gfn" && <GeForceNowLauncher />}
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