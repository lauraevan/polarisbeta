import { useState } from "react";
import { Wand2, Loader2, ExternalLink } from "lucide-react";
import { tmdbApi, IMG, type TmdbItem, type MediaKind } from "@/lib/tmdb";
import { useNavigate } from "@tanstack/react-router";

type AiSuggestion = { title: string; type: "movie" | "tv"; reason?: string };

export function AiMatch() {
  const navigate = useNavigate();
  const [seed, setSeed] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reasonByKey, setReasonByKey] = useState<Record<string, string>>({});
  const [results, setResults] = useState<{ item: TmdbItem; kind: MediaKind; reason: string | undefined }[]>([]);

  async function suggest() {
    const q = seed.trim();
    if (!q || loading) return;
    setLoading(true);
    setError(null);
    setResults([]);
    setReasonByKey({});
    try {
      const system =
        `You are Polaris MatchMaker, an expert film/TV/anime recommender. ` +
        `Given a title or vibe the user likes, return 12 similar titles spanning movies, shows, and anime when relevant. ` +
        `Include both classics and recent releases. Respond ONLY with strict JSON of the form:\n` +
        `{"suggestions":[{"title":"<exact title>","type":"movie"|"tv","reason":"<short why>"}, ...]}\n` +
        `Use "tv" for shows AND anime. No prose, no markdown, no code fences.`;
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "groq/llama-3.3-70b-versatile",
          system,
          messages: [{ role: "user", content: `I like: ${q}. Recommend similar titles.` }],
        }),
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";
      let done = false;
      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line || line.startsWith(":") || !line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) acc += delta;
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
      const cleaned = acc.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      if (start < 0 || end < 0) throw new Error("AI did not return JSON");
      const json = JSON.parse(cleaned.slice(start, end + 1)) as { suggestions?: AiSuggestion[] };
      const sugg = (json.suggestions || []).slice(0, 12);
      if (sugg.length === 0) throw new Error("No suggestions returned");

      const resolved = await Promise.all(
        sugg.map(async (s) => {
          try {
            const kind: MediaKind = s.type === "movie" ? "movie" : "tv";
            const list = await tmdbApi.search(kind, s.title);
            const top = list[0];
            if (!top) return null;
            return { item: top, kind, reason: s.reason };
          } catch {
            return null;
          }
        }),
      );
      const final = resolved.filter(
        (x): x is { item: TmdbItem; kind: MediaKind; reason: string | undefined } => x !== null,
      );
      setResults(final);
      const reasons: Record<string, string> = {};
      for (const r of final) {
        if (r.reason) reasons[`${r.kind}-${r.item.id}`] = r.reason;
      }
      setReasonByKey(reasons);
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI matchmaker failed");
    } finally {
      setLoading(false);
    }
  }

  function openInFlix(r: { item: TmdbItem; kind: MediaKind }) {
    const title = r.item.title || r.item.name || "";
    navigate({ to: "/media", search: { q: title } as never });
  }

  return (
    <div className="px-3 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 rounded-2xl border border-white/10 bg-black/40 p-5 backdrop-blur-md sm:p-7">
          <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-white/65">
            <Wand2 className="h-3.5 w-3.5" /> Match Maker
          </div>
          <h2 className="text-2xl font-black text-white sm:text-3xl">
            Find your next watch — movies, shows, anime.
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-white/70">
            Name a title you love or describe a vibe. Polaris AI will surface similar movies, shows, and anime —
            and any sequels, prequels, or alternate versions of what you mentioned.
          </p>
          <div className="mt-4 flex flex-wrap items-stretch gap-2">
            <input
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") suggest(); }}
              placeholder="e.g. Attack on Titan, gritty space sci-fi, Studio Ghibli vibes…"
              className="min-w-[240px] flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
            />
            <button
              onClick={suggest}
              disabled={loading || !seed.trim()}
              className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-50"
              style={{ background: "rgb(var(--polaris-accent))" }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {loading ? "Matching…" : "Match"}
            </button>
          </div>
          {error && (
            <div className="mt-3 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {error}
            </div>
          )}
        </div>

        {results.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {results.map((r) => {
              const key = `${r.kind}-${r.item.id}`;
              const reason = reasonByKey[key];
              return (
                <button
                  key={key}
                  onClick={() => openInFlix(r)}
                  className="group liquid-glass overflow-hidden rounded-xl text-left transition hover:scale-[1.03]"
                  title="Open in PolarisFlix"
                >
                  {r.item.poster_path ? (
                    <img
                      src={IMG(r.item.poster_path, "w300")}
                      alt=""
                      className="aspect-[2/3] w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="aspect-[2/3] w-full bg-white/5 p-2 text-xs text-white/60">
                      {r.item.title || r.item.name}
                    </div>
                  )}
                  <div className="px-2 py-2">
                    <div className="truncate text-[12px] font-semibold text-white">
                      {r.item.title || r.item.name}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 text-[10px] uppercase tracking-wider text-white/55">
                      {r.kind === "movie" ? "Movie" : "Show"}
                      <ExternalLink className="h-3 w-3 opacity-60" />
                    </div>
                    {reason && (
                      <div className="mt-1 line-clamp-2 text-[11px] text-white/70">{reason}</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {!loading && results.length === 0 && !error && (
          <div className="rounded-xl border border-dashed border-white/10 px-4 py-12 text-center text-sm text-white/55">
            Drop a title or vibe above to see AI-matched picks.
          </div>
        )}
      </div>
    </div>
  );
}