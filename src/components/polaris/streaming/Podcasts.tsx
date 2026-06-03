import { useEffect, useRef, useState } from "react";
import { Search, Play, Pause, X, Mic2, RotateCw } from "lucide-react";
import { searchPodcasts, topPodcasts, fetchEpisodes, type Podcast, type Episode } from "@/lib/podcasts";

export function PodcastsTab() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Podcast[]>([]);
  const [top, setTop] = useState<Podcast[]>([]);
  const [topLoading, setTopLoading] = useState(true);
  const [topErr, setTopErr] = useState<string | null>(null);
  const [open, setOpen] = useState<Podcast | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loadingEps, setLoadingEps] = useState(false);
  const [now, setNow] = useState<{ ep: Episode; podcast: Podcast } | null>(null);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const loadTop = () => {
    setTopLoading(true); setTopErr(null);
    topPodcasts(40)
      .then((r) => { setTop(r); if (r.length === 0) setTopErr("No podcasts returned. Try search."); })
      .catch((e) => setTopErr(String(e?.message ?? e)))
      .finally(() => setTopLoading(false));
  };
  useEffect(loadTop, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!q.trim()) { setResults([]); return; }
      searchPodcasts(q).then(setResults).catch(() => setResults([]));
    }, 350);
    return () => clearTimeout(t);
  }, [q]);

  async function openPodcast(p: Podcast) {
    setOpen(p);
    setEpisodes([]);
    setLoadingEps(true);
    try {
      setEpisodes(await fetchEpisodes(p.feedUrl));
    } finally { setLoadingEps(false); }
  }

  function play(ep: Episode, p: Podcast) {
    setNow({ ep, podcast: p });
    setTimeout(() => {
      const a = audioRef.current;
      if (a) { a.src = ep.audioUrl; a.play().then(() => setPlaying(true)).catch(() => setPlaying(false)); }
    }, 30);
  }

  const shown = q.trim() ? results : top;

  return (
    <div className="px-3 sm:px-6 pb-40">
      <div className="mb-5 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg">
          <Mic2 className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black">Podcasts</h1>
          <p className="text-xs text-white/55">Powered by Apple Podcasts · Joe Rogan, Lex Fridman, and millions more</p>
        </div>
      </div>

      <div className="liquid-glass-themed mb-6 flex items-center gap-3 rounded-2xl px-4 py-3">
        <Search className="h-5 w-5 text-white/60" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search podcasts — Joe Rogan, NPR, Huberman…"
          className="w-full bg-transparent text-sm focus:outline-none"
        />
      </div>

      <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-white/70">
        {q.trim() ? `Results for “${q}”` : "Top Podcasts"}
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {shown.map((p) => (
          <button
            key={p.id}
            onClick={() => openPodcast(p)}
            className="group text-left transition hover:scale-[1.02]"
          >
            <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 aspect-square">
              <img src={p.artwork} alt={p.title} loading="lazy" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
              <div className="absolute bottom-2 right-2 grid h-9 w-9 place-items-center rounded-full bg-purple-600 opacity-0 shadow-xl transition group-hover:opacity-100">
                <Play className="h-4 w-4 fill-white text-white" />
              </div>
            </div>
            <div className="mt-2 truncate text-sm font-semibold">{p.title}</div>
            <div className="truncate text-xs text-white/55">{p.artist}</div>
          </button>
        ))}
      </div>
      {shown.length === 0 && <div className="mt-10 text-center text-sm text-white/40">Loading…</div>}
      {!q.trim() && top.length === 0 && !topLoading && (
        <div className="mt-10 flex flex-col items-center gap-3 text-center">
          <div className="text-sm text-white/55">{topErr ?? "Couldn't reach Apple Podcasts."}</div>
          <button onClick={loadTop} className="flex items-center gap-2 rounded-full bg-purple-600 px-4 py-2 text-sm font-bold">
            <RotateCw className="h-4 w-4" /> Retry
          </button>
        </div>
      )}

      {/* Podcast detail drawer */}
      {open && (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-black/85 backdrop-blur-2xl">
          <div className="mx-auto max-w-4xl p-4 sm:p-8">
            <button onClick={() => setOpen(null)} className="mb-4 flex items-center gap-2 rounded-full liquid-glass px-3 py-1.5 text-sm">
              <X className="h-4 w-4" /> Close
            </button>
            <div className="flex flex-col gap-5 sm:flex-row">
              <img src={open.artwork} alt={open.title} className="h-44 w-44 flex-shrink-0 rounded-2xl border border-white/10 shadow-2xl" />
              <div className="flex flex-col justify-end">
                <div className="text-[10px] uppercase tracking-[0.3em] text-purple-300">Podcast</div>
                <h2 className="mt-1 text-3xl font-black">{open.title}</h2>
                <div className="mt-1 text-sm text-white/65">{open.artist}</div>
                <div className="mt-2 text-xs text-white/45">{open.genre}</div>
              </div>
            </div>
            <h3 className="mt-8 mb-3 text-sm font-bold uppercase tracking-wider text-white/70">Episodes</h3>
            {loadingEps && <div className="text-sm text-white/45">Loading episodes…</div>}
            <ul className="divide-y divide-white/5">
              {episodes.map((ep) => (
                <li key={ep.guid}>
                  <button onClick={() => play(ep, open)} className="flex w-full items-start gap-3 py-3 text-left hover:bg-white/5">
                    <div className="mt-1 grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-purple-600">
                      <Play className="h-4 w-4 fill-white text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">{ep.title}</div>
                      <div className="line-clamp-2 text-xs text-white/55">{ep.description}</div>
                      <div className="mt-1 text-[11px] text-white/40">
                        {ep.pubDate && new Date(ep.pubDate).toLocaleDateString()} {ep.duration && `· ${ep.duration}`}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Now playing bar */}
      {now && (
        <div className="fixed inset-x-0 bottom-20 z-30 mx-auto max-w-4xl rounded-2xl border border-white/10 bg-zinc-950/95 px-3 py-2 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <img src={now.podcast.artwork} alt="" className="h-12 w-12 rounded-md border border-white/10" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold">{now.ep.title}</div>
              <div className="truncate text-xs text-white/55">{now.podcast.title}</div>
            </div>
            <button onClick={() => {
              const a = audioRef.current; if (!a) return;
              if (a.paused) { a.play(); setPlaying(true); } else { a.pause(); setPlaying(false); }
            }} className="grid h-10 w-10 place-items-center rounded-full bg-purple-600">
              {playing ? <Pause className="h-4 w-4 fill-white" /> : <Play className="h-4 w-4 fill-white" />}
            </button>
            <audio ref={audioRef} controls className="hidden sm:block h-9 w-72" />
            <button onClick={() => { audioRef.current?.pause(); setNow(null); setPlaying(false); }} className="rounded-full p-2 hover:bg-white/10">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}