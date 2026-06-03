import { useEffect, useRef, useState } from "react";
import { useDebounced } from "@/lib/lite-utils";
import { vaporSearch, vaporPlayback, type VaporItem } from "@/lib/vapor";

export function LiteMusic() {
  const [q, setQ] = useState("trending");
  const dq = useDebounced(q, 350);
  const [items, setItems] = useState<VaporItem[]>([]);
  const [current, setCurrent] = useState<VaporItem | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    vaporSearch(dq.trim() || "trending", "song")
      .then((r) => { if (!cancelled) setItems(r.filter((x) => x.type === "song")); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [dq]);

  async function play(t: VaporItem) {
    setCurrent(t);
    setStreamUrl(null);
    const u = await vaporPlayback(t.id);
    if (u) {
      setStreamUrl(u);
      setTimeout(() => audioRef.current?.play().catch(() => {}), 50);
    }
  }

  return (
    <div className="px-4 pt-2 pb-32">
      <h1 className="text-xl font-bold">Music</h1>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search songs, artists…"
        className="mt-3 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-white/30"
      />
      {loading && items.length === 0 && <div className="mt-6 text-xs text-white/40">Loading…</div>}
      <ul className="mt-4 divide-y divide-white/5">
        {items.map((t) => (
          <li key={t.id}>
            <button
              onClick={() => play(t)}
              className={`flex w-full items-center gap-3 px-1 py-2 text-left text-sm hover:bg-white/5 ${current?.id === t.id ? "bg-white/5" : ""}`}
            >
              {t.image ? (
                <img src={t.image} alt="" width={40} height={40} loading="lazy" className="h-10 w-10 rounded border border-white/10 object-cover" />
              ) : <div className="h-10 w-10 rounded bg-white/10" />}
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{t.title}</span>
                <span className="block truncate text-xs text-white/45">{t.artist}</span>
              </span>
              <span className="text-xs text-white/40">Play</span>
            </button>
          </li>
        ))}
      </ul>
      {current && (
        <div className="fixed inset-x-0 bottom-20 z-30 mx-auto max-w-3xl rounded-2xl border border-white/10 bg-zinc-950/90 px-3 py-2 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            {current.image && <img src={current.image} alt="" width={36} height={36} className="h-9 w-9 rounded border border-white/10" />}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold">{current.title}</div>
              <div className="truncate text-xs text-white/50">{current.artist}</div>
            </div>
            {streamUrl ? (
              <audio ref={audioRef} src={streamUrl} controls className="h-8 w-56 max-w-[45vw]" />
            ) : (
              <span className="text-xs text-white/40">Loading stream…</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
