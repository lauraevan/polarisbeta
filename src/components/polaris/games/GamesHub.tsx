import { useEffect, useMemo, useState } from "react";
import { Loader2, Play, MessageCircle, ExternalLink, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { EmbedFrame } from "./EmbedFrame";
import { GameTile } from "./GameTile";
import { PolarisPlaySplash } from "./PolarisPlaySplash";
import { POLARIS_GAMES } from "@/lib/polaris-games";
import {
  hydraSearch,
  hydraFeatured,
  steamHeader,
  type HydraEdge,
  type HydraFeatured,
} from "@/lib/hydra-api";
import { fetchHydraNetwork, hydraNetAsset, type HydraNetGame } from "@/lib/hydra-network";
import { lumin, luminImage, type LuminGame } from "@/lib/lumin";
import { useShowDiscord } from "@/lib/ui-prefs";
import { recordPlay, useContinuePlaying, type RecentGame } from "@/lib/continue-playing";

const POLARIS_CDN = "https://cdn.jsdelivr.net/npm/ugs-singlefiles@1.0.6/";
const GNMATH_HTML = "https://cdn.jsdelivr.net/gh/freebuisness/html@main";
const GNMATH_COVER = "https://cdn.jsdelivr.net/gh/freebuisness/covers@main";
const GNMATH_ZONES = "https://cdn.jsdelivr.net/gh/freebuisness/assets@latest/zones.json";

type GnZone = { id: number; name: string; cover: string; url: string };
type PlayItem = { src: string; title: string; mode: "src" | "srcdoc" };
type LaunchItem = PlayItem & { id?: string; cover?: string; source?: string };

const SPOTLIGHT_SLUGS = ["hollow-knight", "silksong", "celeste", "undertale", "minecraft"];

function LuminTile({ g, onPlay }: { g: LuminGame; onPlay: (p: LaunchItem) => void }) {
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
        try {
          const api = await lumin();
          const { url } = await api.getGameUrl(g.id);
          onPlay({ src: url, title: g.name, mode: "src", id: `lumin-${g.id}`, cover, source: "LuminSDK" });
        } catch {/* ignore */}
      }}
    />
  );
}

function Row({ title, loading, children }: { title: string; loading: boolean; children?: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/55">{title}</h3>
      {loading ? (
        <div className="flex h-32 items-center justify-center text-white/40">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">{children}</div>
      )}
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
        <div className="truncate text-xs text-white/65">News, game requests, support & community — discord.gg/fUhccQjbT</div>
      </div>
      <span className="hidden shrink-0 items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white sm:inline-flex">
        Join <ExternalLink className="h-3 w-3" />
      </span>
    </a>
  );
}

/* Template row 1 — sliver | huge rotating PolarisFlix-style billboard | sliver */
function HeroBillboard({
  featured,
  heroIdx,
  setHeroIdx,
}: {
  featured: HydraFeatured[] | null;
  heroIdx: number;
  setHeroIdx: (n: number) => void;
}) {
  const len = featured?.length ?? 0;
  const prev = len ? featured![(heroIdx - 1 + len) % len] : null;
  const next = len ? featured![(heroIdx + 1) % len] : null;
  const cur = len ? featured![heroIdx] : null;

  const Sliver = ({ item, side }: { item: HydraFeatured | null; side: "left" | "right" }) => (
    <button
      onClick={() => len && setHeroIdx(side === "left" ? (heroIdx - 1 + len) % len : (heroIdx + 1) % len)}
      className="group relative hidden w-16 shrink-0 overflow-hidden rounded-2xl border border-white/10 sm:block lg:w-20"
      aria-label={side === "left" ? "Previous featured" : "Next featured"}
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
    <div className="flex h-[300px] gap-3 sm:h-[400px] lg:h-[460px]">
      <Sliver item={prev} side="left" />
      <div className="relative flex-1 overflow-hidden rounded-3xl border border-white/10 shadow-[0_30px_80px_-30px_rgba(0,112,255,0.55)]">
        {featured?.map((f, i) => (
          <div key={f.objectId} className={`absolute inset-0 transition-opacity duration-[900ms] ${i === heroIdx ? "opacity-100" : "opacity-0"}`}>
            {f.libraryHeroImageUrl && (
              <img src={f.libraryHeroImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover scale-105" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/10" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/20 to-transparent" />
          </div>
        ))}
        {!featured && (
          <div className="absolute inset-0" style={{ background: "linear-gradient(110deg, rgba(0,112,255,0.32), transparent 70%), #0a0d14" }} />
        )}
        <div className="relative flex h-full flex-col justify-end p-6 sm:p-10">
          <div className="text-[10px] uppercase tracking-[0.35em] text-white/70">Polaris Play · Featured</div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white drop-shadow sm:text-5xl lg:text-6xl">
            {cur?.title ?? "The next generation of browser gaming."}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/80 line-clamp-2 sm:text-base">
            {cur?.description ?? "Hydra Network · LuminSDK · Gn-Math · Polaris Catalog — one ultimate library."}
          </p>
          <div className="mt-4 flex items-center gap-3">
            <a href="#continue" className="flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-black transition hover:bg-white/90">
              <Play className="h-4 w-4 fill-black" /> Explore
            </a>
            {len > 1 && (
              <div className="ml-2 flex gap-1.5">
                {featured!.map((_, i) => (
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
      <Sliver item={next} side="right" />
    </div>
  );
}

/* Template row 2 — Continue Playing with sliver bookends */
function BookendRow({
  title,
  icon,
  items,
  onPlay,
  emptyHint,
}: {
  title: string;
  icon?: React.ReactNode;
  items: { id: string; title: string; cover?: string; src: string; mode: "src" | "srcdoc"; source?: string }[];
  onPlay: (p: LaunchItem) => void;
  emptyHint?: string;
}) {
  const Sliver = ({ g }: { g: (typeof items)[number] }) => (
    <button
      onClick={() => onPlay({ src: g.src, title: g.title, mode: g.mode, id: g.id, cover: g.cover, source: g.source })}
      className="relative hidden h-28 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10 transition hover:border-white/30 sm:block"
      title={g.title}
    >
      {g.cover && <img src={g.cover} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80" />
    </button>
  );

  const left = items[0];
  const right = items[6];
  const main = items.length > 1 ? items.slice(1, 6) : items;

  return (
    <section id="continue">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h3 className="text-lg font-bold tracking-tight text-white">{title}</h3>
      </div>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 px-5 py-8 text-center text-sm text-white/55">
          {emptyHint}
        </div>
      ) : (
        <div className="flex items-stretch gap-3">
          {left && <Sliver g={left} />}
          <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {main.map((g) => (
              <button
                key={g.id}
                onClick={() => onPlay({ src: g.src, title: g.title, mode: g.mode, id: g.id, cover: g.cover, source: g.source })}
                className="group relative h-28 overflow-hidden rounded-xl border border-white/10 bg-white/5 text-left transition hover:-translate-y-0.5 hover:border-white/30"
              >
                {g.cover && <img src={g.cover} alt="" className="absolute inset-0 h-full w-full object-cover transition group-hover:scale-105" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <div className="relative flex h-full items-end p-3">
                  <div className="min-w-0">
                    <div className="line-clamp-1 text-sm font-bold text-white drop-shadow">{g.title}</div>
                    {g.source && <div className="text-[10px] uppercase tracking-wider text-white/60">{g.source}</div>}
                  </div>
                </div>
              </button>
            ))}
          </div>
          {right && <Sliver g={right} />}
        </div>
      )}
    </section>
  );
}

function HomeFeed({ onPlay }: { onPlay: (p: LaunchItem) => void }) {
  const [showDiscord] = useShowDiscord();
  const [hydra, setHydra] = useState<HydraEdge[] | null>(null);
  const [gn, setGn] = useState<GnZone[] | null>(null);
  const [featured, setFeatured] = useState<HydraFeatured[] | null>(null);
  const [hydraNet, setHydraNet] = useState<HydraNetGame[] | null>(null);
  const [luminGames, setLuminGames] = useState<LuminGame[] | null>(null);
  const [luminRandom, setLuminRandom] = useState<LuminGame[] | null>(null);
  const [heroIdx, setHeroIdx] = useState(0);
  const recent = useContinuePlaying();

  useEffect(() => {
    const ctrl = new AbortController();
    hydraSearch({ title: "", take: 12, skip: 0, signal: ctrl.signal }).then((r) => setHydra(r.edges)).catch(() => setHydra([]));
    hydraFeatured(ctrl.signal).then((f) => setFeatured(f.slice(0, 5))).catch(() => setFeatured([]));
    fetch(GNMATH_ZONES, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((z: GnZone[]) => setGn(z.filter((g) => g.id >= 0 && g.url?.startsWith("{HTML_URL}"))))
      .catch(() => setGn([]));
    fetchHydraNetwork(ctrl.signal).then((list) => setHydraNet(list.slice(0, 18))).catch(() => setHydraNet([]));
    lumin()
      .then((api) => Promise.all([api.getGames({ page: 1, limit: 18 }).then((r) => r.games), api.getRandomGames(12).then((r) => r.games)]))
      .then(([a, b]) => { setLuminGames(a); setLuminRandom(b); })
      .catch(() => { setLuminGames([]); setLuminRandom([]); });
    return () => ctrl.abort();
  }, []);

  useEffect(() => {
    if (!featured || featured.length < 2) return;
    const t = setInterval(() => setHeroIdx((i) => (i + 1) % featured.length), 6500);
    return () => clearInterval(t);
  }, [featured]);

  const spotlight = useMemo<GnZone[]>(() => {
    if (!gn) return [];
    const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return SPOTLIGHT_SLUGS.map((needle) => gn.find((g) => slug(g.name).includes(needle))).filter(Boolean) as GnZone[];
  }, [gn]);

  const gnFeatured = useMemo(() => gn?.slice(0, 18) ?? [], [gn]);

  const polarisPicks = useMemo(() => {
    const picks = [
      "1v1lol","slope","retrobowl","driftboss","tunnelrush","crossyroad",
      "subwaysurfers","tombofthemask","tinyfishing","monkeymart","cookieclicker","2048",
      "geometrydash","amongus","minecraftclassic","papasfreezeria","awesometanks","bittlife",
    ];
    return picks.map((s) => POLARIS_GAMES.find((g) => g.f.toLowerCase().includes(s))).filter(Boolean) as typeof POLARIS_GAMES;
  }, []);

  const continueItems = useMemo(() => {
    if (recent.length > 0) return recent.slice(0, 7) as RecentGame[];
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

  const banner = featured?.[0] ?? null;

  return (
    <div className="space-y-10">
      {showDiscord && <DiscordCallout />}

      <HeroBillboard featured={featured} heroIdx={heroIdx} setHeroIdx={setHeroIdx} />

      <BookendRow
        title={recent.length ? "Continue Playing" : "Jump Back In"}
        icon={<Clock className="h-4 w-4 text-white/70" />}
        items={continueItems}
        onPlay={onPlay}
        emptyHint="Play a game and it'll show up here."
      />

      {spotlight.length > 0 && (
        <section>
          <div className="mb-3">
            <h3 className="text-xl font-black tracking-tight text-white">Spotlight</h3>
            <div className="text-[11px] uppercase tracking-[0.2em] text-white/45">Hand-picked · Gn-Math</div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {spotlight.map((g) => (
              <GameTile
                key={g.id}
                title={g.name}
                cover={g.cover.replace("{COVER_URL}", GNMATH_COVER)}
                autoCover={false}
                size="lg"
                onPlay={() => onPlay({
                  src: g.url.replace("{HTML_URL}", GNMATH_HTML),
                  title: g.name,
                  mode: "srcdoc",
                  id: `gn-${g.id}`,
                  cover: g.cover.replace("{COVER_URL}", GNMATH_COVER),
                  source: "Gn-Math",
                })}
              />
            ))}
          </div>
        </section>
      )}

      {banner && (
        <button
          onClick={() => window.open(`https://store.steampowered.com/app/${banner.objectId}/`, "_blank", "noopener")}
          className="relative block h-32 w-full overflow-hidden rounded-2xl border border-white/10 text-left sm:h-44"
        >
          {banner.libraryHeroImageUrl && (
            <img src={banner.libraryHeroImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-black/10" />
          <div className="relative flex h-full flex-col justify-center px-6 sm:px-10">
            <div className="text-[10px] uppercase tracking-[0.3em] text-white/70">Editor's Pick</div>
            <div className="mt-1 text-2xl font-black text-white sm:text-3xl">{banner.title}</div>
            <div className="mt-1 line-clamp-1 max-w-xl text-xs text-white/70 sm:text-sm">{banner.description}</div>
          </div>
        </button>
      )}

      <Row title="Hydra Network · PC Vault" loading={hydra === null}>
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

      <Row title="LuminSDK · Trending" loading={luminGames === null}>
        {luminGames?.map((g) => (<LuminTile key={g.id} g={g} onPlay={onPlay} />))}
      </Row>

      <Row title="Gn-Math · Featured" loading={gn === null}>
        {gnFeatured.map((g) => (
          <GameTile
            key={g.id}
            title={g.name}
            cover={g.cover.replace("{COVER_URL}", GNMATH_COVER)}
            autoCover={false}
            onPlay={() => onPlay({
              src: g.url.replace("{HTML_URL}", GNMATH_HTML),
              title: g.name,
              mode: "srcdoc",
              id: `gn-${g.id}`,
              cover: g.cover.replace("{COVER_URL}", GNMATH_COVER),
              source: "Gn-Math",
            })}
          />
        ))}
      </Row>

      <Row title="Hydra Network · HTML5 Arcade" loading={hydraNet === null}>
        {hydraNet?.map((g) => (
          <GameTile
            key={g.file_name}
            title={g.title}
            cover={hydraNetAsset(g.thumb)}
            autoCover={false}
            onPlay={() => onPlay({
              src: hydraNetAsset(g.file_name),
              title: g.title,
              mode: "src",
              id: `hn-${g.file_name}`,
              cover: hydraNetAsset(g.thumb),
              source: "Hydra Network",
            })}
          />
        ))}
      </Row>

      <Row title="Polaris Catalog · Top Picks" loading={false}>
        {polarisPicks.map((g) => (
          <GameTile
            key={g.f}
            title={g.t}
            onPlay={() => onPlay({ src: POLARIS_CDN + encodeURI(g.f), title: g.t, mode: "srcdoc", id: `pc-${g.f}`, source: "Polaris Catalog" })}
          />
        ))}
      </Row>

      <Row title="LuminSDK · Surprise Me" loading={luminRandom === null}>
        {luminRandom?.map((g) => (<LuminTile key={g.id} g={g} onPlay={onPlay} />))}
      </Row>
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