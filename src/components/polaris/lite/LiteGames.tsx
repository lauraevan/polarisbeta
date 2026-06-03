import { useEffect, useMemo, useRef, useState } from "react";
import { POLARIS_GAMES } from "@/lib/polaris-games";

const CDN = "https://cdn.jsdelivr.net/npm/ugs-singlefiles@1.0.6/";
const PAGE = 60;
const RECENT_KEY = "lite:games:recent";
const MAX_RECENT = 8;

function loadRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch { return []; }
}

export function LiteGames() {
  const [q, setQ] = useState("");
  const [count, setCount] = useState(PAGE);
  const [play, setPlay] = useState<{ src: string; title: string } | null>(null);
  const [recent, setRecent] = useState<string[]>(() => loadRecent());
  const sentinel = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return POLARIS_GAMES;
    return POLARIS_GAMES.filter((g) => g.t.toLowerCase().includes(s));
  }, [q]);

  useEffect(() => setCount(PAGE), [q]);

  // ESC closes the player.
  useEffect(() => {
    if (!play) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setPlay(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [play]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
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
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  }

  if (play) {
    return (
      <div className="fixed inset-0 z-40 flex flex-col bg-black">
        <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-950 px-3 py-2">
          <div className="truncate text-sm font-bold">{play.title}</div>
          <button
            onClick={() => setPlay(null)}
            className="rounded border border-neutral-700 px-3 py-1 text-xs hover:bg-neutral-800"
          >
            Close
          </button>
        </div>
        <iframe
          src={play.src}
          title={play.title}
          className="flex-1 w-full border-0 bg-black"
          allow="autoplay; fullscreen; gamepad; pointer-lock"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      <h1 className="text-xl font-bold">Games</h1>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={`Search ${POLARIS_GAMES.length} games…`}
        className="mt-3 w-full rounded border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-600"
      />
      {!q && recent.length > 0 && (
        <div className="mt-3">
          <div className="text-[10px] uppercase tracking-wider text-neutral-500">Recent</div>
          <div className="mt-1 flex flex-wrap gap-1">
            {recent.map((f) => {
              const g = POLARIS_GAMES.find((x) => x.f === f);
              if (!g) return null;
              return (
                <button
                  key={f}
                  onClick={() => launch(g)}
                  className="rounded border border-neutral-800 bg-neutral-900 px-2 py-1 text-xs hover:border-neutral-600"
                >
                  {g.t}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <ul className="mt-4 divide-y divide-neutral-900">
        {filtered.slice(0, count).map((g) => (
          <li key={g.f}>
            <button
              onClick={() => launch(g)}
              className="flex w-full items-center justify-between gap-2 px-1 py-2 text-left text-sm hover:bg-neutral-900"
            >
              <span className="truncate">{g.t}</span>
              <span className="text-xs text-neutral-500">Play →</span>
            </button>
          </li>
        ))}
      </ul>
      {count < filtered.length && (
        <div ref={sentinel} className="py-6 text-center text-xs text-neutral-500">
          Loading more…
        </div>
      )}
      {filtered.length === 0 && (
        <div className="py-10 text-center text-sm text-neutral-500">No matches.</div>
      )}
    </div>
  );
}