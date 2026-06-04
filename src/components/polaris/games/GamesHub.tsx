import { useEffect, useMemo, useState } from "react";
import { Loader2, Play, MessageCircle, ExternalLink } from "lucide-react";
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

const POLARIS_CDN = "https://cdn.jsdelivr.net/npm/ugs-singlefiles@1.0.6/";
const GNMATH_HTML = "https://cdn.jsdelivr.net/gh/freebuisness/html@main";
const GNMATH_COVER = "https://cdn.jsdelivr.net/gh/freebuisness/covers@main";
const GNMATH_ZONES = "https://cdn.jsdelivr.net/gh/freebuisness/assets@latest/zones.json";

type GnZone = { id: number; name: string; cover: string; url: string };
type PlayItem = { src: string; title: string; mode: "src" | "srcdoc" };

const SPOTLIGHT_SLUGS = ["hollow-knight", "silksong", "celeste", "undertale", "minecraft"];

function LuminTile({ g, onPlay }: { g: LuminGame; onPlay: (p: PlayItem) => void }) {
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
          onPlay({ src: url, title: g.name, mode: "src" });
        } catch {/* ignore */}
      }}
    />
  );
}

function Row({
  title,
  loading,
  children,
}: {
  title: string;
  loading: boolean;
  children?: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/55">
        {title}
      </h3>
      {loading ? (
        <div className="flex h-32 items-center justify-center text-white/40">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {children}
        </div>
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
      style={{
        background:
          "linear-gradient(135deg, rgba(88,101,242,0.25), rgba(88,101,242,0.05) 60%, transparent), rgba(255,255,255,0.03)",
      }}
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white" style={{ background: "#5865F2" }}>
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

function HomeFeed({ onPlay }: { onPlay: (p: PlayItem) => void }) {
  const [showDiscord] = useShowDiscord();
  const [hydra, setHydra] = useState<HydraEdge[] | null>(null);
  const [gn, setGn] = useState<GnZone[] | null>(null);
  const [featured, setFeatured] = useState<HydraFeatured[] | null>(null);
  const [hydraNet, setHydraNet] = useState<HydraNetGame[] | null>(null);
  const [luminGames, setLuminGames] = useState<LuminGame[] | null>(null);
  const [luminRandom, setLuminRandom] = useState<LuminGame[] | null>(null);
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
        setGn(z.filter((g) => g.id >= 0 && g.url?.startsWith("{HTML_URL}")))
      )
      .catch(() => setGn([]));
    fetchHydraNetwork(ctrl.signal)
      .then((list) => setHydraNet(list.slice(0, 18)))
      .catch(() => setHydraNet([]));
    lumin()
      .then((api) =>
        Promise.all([
          api.getGames({ page: 1, limit: 18 }).then((r) => r.games),
          api.getRandomGames(12).then((r) => r.games),
        ]),
      )
      .then(([a, b]) => {
        setLuminGames(a);
        setLuminRandom(b);
      })
      .catch(() => {
        setLuminGames([]);
        setLuminRandom([]);
      });
    return () => ctrl.abort();
  }, []);

  useEffect(() => {
    if (!featured || featured.length < 2) return;
    const t = setInterval(() => setHeroIdx((i) => (i + 1) % featured.length), 6500);
    return () => clearInterval(t);
  }, [featured]);

  const spotlight = useMemo(() => {
    if (!gn) return [];
    const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return SPOTLIGHT_SLUGS
      .map((needle) => gn.find((g) => slug(g.name).includes(needle)))
      .filter(Boolean) as GnZone[];
  }, [gn]);

  const gnFeatured = useMemo(() => gn?.slice(0, 18) ?? [], [gn]);

  const polarisPicks = useMemo(() => {
    const picks = [
      "1v1lol","slope","retrobowl","driftboss","tunnelrush","crossyroad",
      "subwaysurfers","tombofthemask","tinyfishing","monkeymart","cookieclicker","2048",
      "geometrydash","amongus","minecraftclassic","papasfreezeria","awesometanks","bittlife",
    ];
    return picks
      .map((s) => POLARIS_GAMES.find((g) => g.f.toLowerCase().includes(s)))
      .filter(Boolean) as typeof POLARIS_GAMES;
  }, []);

  return (
    <div className="space-y-12">
      {showDiscord && <DiscordCallout />}

      {/* Cinematic rotating hero */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 min-h-[300px] sm:min-h-[440px] shadow-[0_30px_80px_-30px_rgba(0,112,255,0.45)]">
        {featured?.map((f, i) => (
          <div
            key={f.objectId}
            className={`absolute inset-0 transition-opacity duration-1000 ${i === heroIdx ? "opacity-100" : "opacity-0"}`}
          >
            {f.libraryHeroImageUrl && (
              <img src={f.libraryHeroImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover scale-105" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/10" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/20 to-transparent" />
          </div>
        ))}
        {!featured && (
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(110deg, rgba(0,112,255,0.32), transparent 70%), #0a0d14" }}
          />
        )}
        <div className="relative flex h-full flex-col justify-end p-6 sm:p-10 min-h-[300px] sm:min-h-[440px]">
          <div className="text-[10px] uppercase tracking-[0.35em] text-white/70">Polaris Play · Featured</div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white drop-shadow sm:text-6xl">
            {featured?.[heroIdx]?.title ?? "The next generation of browser gaming."}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-white/80 line-clamp-2 sm:text-base">
            {featured?.[heroIdx]?.description ??
              "Hydra Network · LuminSDK · Gn-Math · Polaris Catalog — one ultimate library."}
          </p>
          <div className="mt-5 flex items-center gap-3">
            <a
              href="#spotlight"
              className="flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-black transition hover:bg-white/90"
            >
              <Play className="h-4 w-4 fill-black" /> Explore
            </a>
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

      {spotlight.length > 0 && (
        <section id="spotlight">
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
                onPlay={() =>
                  onPlay({
                    src: g.url.replace("{HTML_URL}", GNMATH_HTML),
                    title: g.name,
                    mode: "srcdoc",
                  })
                }
              />
            ))}
          </div>
        </section>
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
        {luminGames?.map((g) => (
          <LuminTile key={g.id} g={g} onPlay={onPlay} />
        ))}
      </Row>

      <Row title="Gn-Math · Featured" loading={gn === null}>
        {gnFeatured.map((g) => (
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

      <Row title="Hydra Network · HTML5 Arcade" loading={hydraNet === null}>
        {hydraNet?.map((g) => (
          <GameTile
            key={g.file_name}
            title={g.title}
            cover={hydraNetAsset(g.thumb)}
            autoCover={false}
            onPlay={() =>
              onPlay({
                src: hydraNetAsset(g.file_name),
                title: g.title,
                mode: "src",
              })
            }
          />
        ))}
      </Row>

      <Row title="Polaris Catalog · Top Picks" loading={false}>
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

      <Row title="LuminSDK · Surprise Me" loading={luminRandom === null}>
        {luminRandom?.map((g) => (
          <LuminTile key={g.id} g={g} onPlay={onPlay} />
        ))}
      </Row>
    </div>
  );
}

export function GamesHub() {
  const [playing, setPlaying] = useState<PlayItem | null>(null);

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
        <HomeFeed onPlay={setPlaying} />
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