import { useEffect, useMemo, useRef, useState } from "react";
import { POLARIS_GAMES } from "@/lib/polaris-games";

const CDN = "https://cdn.jsdelivr.net/npm/ugs-singlefiles@1.0.6/";
const PAGE = 60;
const RECENT_KEY = "lite:games:recent";
const MAX_RECENT = 8;

function loadRecent(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); } catch { return []; }
}

/** Fetches the HTML and rewrites with <base href> so games actually render
 *  instead of showing as raw source (jsdelivr serves .html as text/plain). */
function useBlobHtml(src: string | null) {
  const [blob, setBlob] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (!src) { setBlob(null); setErr(null); return; }
    let cancelled = false;
    let url: string | null = null;
    setBlob(null); setErr(null);
    fetch(src)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((t) => {
        if (cancelled) return;
        const baseHref = src.replace(/[^/]+$/, "");
        let out = t;
        if (!/<base\s/i.test(out)) {
          out = /<head[\s>]/i.test(out)
            ? out.replace(/<head(\s[^>]*)?>/i, (m) => `${m}\n<base href="${baseHref}">`)
            : `<!doctype html><head><base href="${baseHref}"></head>` + out;
        }
        url = URL.createObjectURL(new Blob([out], { type: "text/html" }));
        setBlob(url);
      })
      .catch((e) => !cancelled && setErr(String(e?.message ?? e)));
    return () => { cancelled = true; if (url) URL.revokeObjectURL(url); };
  }, [src]);
  return { blob, err };
}

export function LiteGames() {
  const [q, setQ] = useState("");
  const [count, setCount] = useState(PAGE);
  const [play, setPlay] = useState<{ src: string; title: string } | null>(null);
  const [recent, setRecent] = useState<string[]>(() => loadRecent());
  const sentinel = useRef<HTMLDivElement>(null);
  const { blob, err } = useBlobHtml(play?.src ?? null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return POLARIS_GAMES;
    return POLARIS_GAMES.filter((g) => g.t.toLowerCase().includes(s));
  }, [q]);

  useEffect(() => setCount(PAGE), [q]);

  useEffect(() => {
    if (!play) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setPlay(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [play]);

  useEffect(() => {
    const el = sentinel.current; if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && count < filtered.length) {
        setCount((c) => Math.min(c + PAGE, filtered.length));
      }
    }, { rootMargin: "400px" });
    io.observe(el);
    return () => io.disconnect();
  }, [count, filtered.length]);

  function launch(g: { f: string; t: string }) {
    setPlay({ src: CDN + encodeURI(g.f), title: g.t });
    const next = [g.f, ...recent.filter((x) => x !== g.f)].slice(0, MAX_RECENT);
    setRecent(next);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch {}
  }

  if (play) {
    return (
      <div className="fixed inset-0 z-40 flex flex-col bg-black">
        <div className="flex items-center justify-between border-b border-white/10 bg-zinc-950/90 px-3 py-2">
          <div className="truncate text-sm font-bold">{play.title}</div>
          <button onClick={() => setPlay(null)} className="rounded-full border border-white/15 px-3 py-1 text-xs hover:bg-white/10">Close</button>
        </div>
        {err ? (
          <div className="flex flex-1 flex-col items-center justify-center text-sm text-white/70">
            <div>Couldn't load this game.</div>
            <div className="mt-1 text-xs text-white/45">{err}</div>
          </div>
        ) : !blob ? (
          <div className="flex flex-1 items-center justify-center text-xs text-white/50">Loading game…</div>
        ) : (
          <iframe
            src={blob}
            title={play.title}
            className="flex-1 w-full border-0 bg-black"
            allow="autoplay; fullscreen; gamepad; clipboard-write"
            allowFullScreen
            referrerPolicy="no-referrer"
          />
        )}
      </div>
    );
  }

  return (
    <div className="px-4 pt-2">
      <h1 className="text-xl font-bold">Games</h1>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={`Search ${POLARIS_GAMES.length.toLocaleString()} games…`}
        className="mt-3 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-white/30"
      />
      {!q && recent.length > 0 && (
        <div className="mt-4">
          <div className="text-[10px] uppercase tracking-wider text-white/50">Recent</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {recent.map((f) => {
              const g = POLARIS_GAMES.find((x) => x.f === f);
              if (!g) return null;
              return (
                <button key={f} onClick={() => launch(g)} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs hover:bg-white/10">
                  {g.t}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <ul className="mt-4 grid grid-cols-1 gap-1 sm:grid-cols-2">
        {filtered.slice(0, count).map((g) => (
          <li key={g.f}>
            <button onClick={() => launch(g)} className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm text-white/85 hover:bg-white/5">
              <span className="truncate">{g.t}</span>
              <span className="text-xs text-white/40">Play →</span>
            </button>
          </li>
        ))}
      </ul>
      {count < filtered.length && (
        <div ref={sentinel} className="py-6 text-center text-xs text-white/45">Loading more…</div>
      )}
      {filtered.length === 0 && <div className="py-10 text-center text-sm text-white/50">No matches.</div>}
    </div>
  );
}
