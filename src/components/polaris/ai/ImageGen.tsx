import { useState } from "react";
import { Image as ImageIcon, Loader2, Download, Sparkles } from "lucide-react";

const PRESETS = [
  "neon cyberpunk skyline at dusk, ultra detailed cinematic",
  "studio ghibli landscape, autumn forest, magical hour",
  "polaroid photo of a cat astronaut on the moon",
  "isometric tiny room, cozy, soft lighting, pastel palette",
];

export function ImageGen() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<{ prompt: string; dataUrl: string }[]>([]);

  async function generate() {
    const text = prompt.trim();
    if (!text || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || `HTTP ${res.status}`);
      setHistory((h) => [{ prompt: text, dataUrl: j.dataUrl }, ...h].slice(0, 8));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Image generation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-3 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 rounded-2xl border border-white/10 bg-black/40 p-5 backdrop-blur-md sm:p-7">
          <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-white/65">
            <ImageIcon className="h-3.5 w-3.5" /> Image Gen 2
          </div>
          <h2 className="text-2xl font-black text-white sm:text-3xl">
            Generate images from a prompt.
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-white/70">
            Powered by Polaris AI image models. Describe what you want — be specific about style, lighting, and subject.
          </p>
          <div className="mt-4 flex flex-wrap items-stretch gap-2">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) generate(); }}
              placeholder="A neon cyberpunk skyline at dusk, ultra detailed…"
              rows={3}
              className="min-w-[240px] flex-1 resize-none rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
            />
            <button
              onClick={generate}
              disabled={loading || !prompt.trim()}
              className="flex items-center gap-2 self-stretch rounded-xl px-5 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-50"
              style={{ background: "rgb(var(--polaris-accent))" }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? "Rendering…" : "Generate"}
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => setPrompt(p)}
                className="rounded-full bg-white/5 px-3 py-1 text-[11px] text-white/65 transition hover:bg-white/10 hover:text-white"
              >
                {p.slice(0, 42)}{p.length > 42 ? "…" : ""}
              </button>
            ))}
          </div>
          {error && (
            <div className="mt-3 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {error}
            </div>
          )}
        </div>

        {history.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 px-4 py-12 text-center text-sm text-white/55">
            Generated images appear here.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {history.map((h, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-white/10 bg-black/40">
                <img src={h.dataUrl} alt={h.prompt} className="w-full" />
                <div className="flex items-center gap-2 px-3 py-2 text-[12px] text-white/75">
                  <span className="line-clamp-1 flex-1">{h.prompt}</span>
                  <a
                    href={h.dataUrl}
                    download={`polaris-image-${i}.png`}
                    className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-[11px] font-semibold text-white hover:bg-white/20"
                  >
                    <Download className="h-3 w-3" /> Save
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}