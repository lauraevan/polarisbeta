import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Search, Sparkles, Loader2 } from "lucide-react";
import { EmbedFrame } from "./EmbedFrame";
import { GameTile } from "./GameTile";
import { getProxyUrl, registerStaticProxies } from "@/lib/proxy-utils";

const ZONES_URL = "https://cdn.jsdelivr.net/gh/freebuisness/assets@latest/zones.json";
const COVER_URL = "https://cdn.jsdelivr.net/gh/freebuisness/covers@main";
const HTML_URL = "https://cdn.jsdelivr.net/gh/freebuisness/html@main";
const PAGE = 60;

type Zone = {
  id: number;
  name: string;
  cover: string;
  url: string;
  author?: string;
  authorLink?: string;
};

function resolve(s: string) {
  return s.replace("{COVER_URL}", COVER_URL).replace("{HTML_URL}", HTML_URL);
}

export function GnMathCollection() {
  const [games, setGames] = useState<Zone[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [playing, setPlaying] = useState<{ src: string; title: string } | null>(null);
  const dq = useDeferredValue(q.trim().toLowerCase());
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Spin up the UV service worker + wisp transport so games can stream
    // through the proxy instead of jsdelivr's raw HTML (which a lot of
    // school filters now block).
    registerStaticProxies("uv").catch(() => {/* fallback handled inside */});
    fetch(ZONES_URL)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data: Zone[]) => {
        if (cancelled) return;
        setGames(data.filter((g) => g.id >= 0 && g.url?.startsWith("{HTML_URL}")));
      })
      .catch((e) => !cancelled && setErr(String(e?.message ?? e)));
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!games) return [];
    if (!dq) return games;
    return games.filter((g) => g.name.toLowerCase().includes(dq));
  }, [games, dq]);

  const visible = filtered.slice(0, page * PAGE);
  const featured = useMemo(() => (games ? games.slice(0, 12) : []), [games]);

  // Route each game through the UV proxy so the iframe loads inside the
  // service-worker scope. EmbedFrame uses mode="src" for proxied URLs.
  const play = (g: Zone) =>
    setPlaying({ src: getProxyUrl("uv", resolve(g.url)), title: g.name });

  // Auto-load more rows as the user scrolls toward the bottom.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && visible.length < filtered.length) {
          setPage((p) => p + 1);
        }
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible.length, filtered.length]);

  if (err) {
    return (
      <div className="rounded-md border border-white/10 bg-zinc-900/80 p-6 text-sm text-white/70">
        Couldn't load Gn-Math catalog: {err}
      </div>
    );
  }

  if (!games) {
    return (
      <div className="flex h-64 items-center justify-center text-white/60">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 rounded-md border border-white/10 bg-zinc-900/80 px-4 py-3">
        <Search className="h-4 w-4 text-white/50" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder={`Search ${games.length.toLocaleString()} Gn-Math games…`}
          className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
        />
        <span className="text-xs text-white/40 tabular-nums">
          {filtered.length.toLocaleString()}
        </span>
      </div>

      {!dq && featured.length > 0 && (
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/55">
            <Sparkles className="h-3.5 w-3.5" /> Featured
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {featured.map((g) => (
              <GameTile
                key={g.id}
                title={g.name}
                cover={resolve(g.cover)}
                onPlay={() => play(g)}
                size="lg"
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/55">
          {dq ? "Results" : "All Games"}
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {visible.map((g) => (
            <GameTile
              key={g.id}
              title={g.name}
              cover={resolve(g.cover)}
              onPlay={() => play(g)}
            />
          ))}
        </div>
        {visible.length < filtered.length && (
          <div ref={sentinelRef} className="mt-6 flex justify-center py-8 text-white/40" aria-hidden>
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}
      </section>

      {playing && (
        <EmbedFrame
          src={playing.src}
          title={playing.title}
          mode="src"
          onClose={() => setPlaying(null)}
        />
      )}
    </div>
  );
}