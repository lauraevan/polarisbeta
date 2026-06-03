import { useEffect, useRef, useState } from "react";

type Track = { id: number; name: string; artist_name: string; audio: string; image?: string; duration?: number };

export function LiteMusic() {
  const [q, setQ] = useState("lofi");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [current, setCurrent] = useState<Track | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    const url = `https://api.jamendo.com/v3.0/tracks/?client_id=b6747d04&format=json&limit=40&search=${encodeURIComponent(q)}`;
    fetch(url, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((j) => setTracks(j.results || []))
      .catch(() => {});
    return () => ctrl.abort();
  }, [q]);

  return (
    <div className="px-4 py-4 pb-32">
      <h1 className="text-xl font-bold">Music</h1>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search Jamendo…"
        className="mt-3 w-full rounded border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-600"
      />
      <ul className="mt-4 divide-y divide-neutral-900">
        {tracks.map((t) => (
          <li key={t.id}>
            <button
              onClick={() => { setCurrent(t); setTimeout(() => audioRef.current?.play(), 50); }}
              className={`flex w-full items-center justify-between gap-3 px-1 py-2 text-left text-sm hover:bg-neutral-900 ${
                current?.id === t.id ? "bg-neutral-900" : ""
              }`}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{t.name}</span>
                <span className="block truncate text-xs text-neutral-500">{t.artist_name}</span>
              </span>
              <span className="text-xs text-neutral-500">Play</span>
            </button>
          </li>
        ))}
      </ul>
      {current && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-800 bg-neutral-950 px-3 py-2">
          <div className="mx-auto flex max-w-6xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold">{current.name}</div>
              <div className="truncate text-xs text-neutral-500">{current.artist_name}</div>
            </div>
            <audio ref={audioRef} src={current.audio} controls className="h-8 w-72 max-w-[50vw]" />
          </div>
        </div>
      )}
    </div>
  );
}