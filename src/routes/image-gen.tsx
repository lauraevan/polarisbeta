import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/polaris/AppShell";
import { Sparkles, ImageIcon, Loader2, Download } from "lucide-react";

export const Route = createFileRoute("/image-gen")({
  head: () => ({
    meta: [
      { title: "Polaris Image Gen 2" },
      { name: "description", content: "Generate images from text prompts inside Polaris." },
    ],
  }),
  component: ImageGenPage,
});

const PRESETS = [
  "A neon cyberpunk fox sitting on a Tokyo rooftop, vivid magenta and cyan lighting",
  "Studio Ghibli style landscape, floating sky islands, soft golden hour",
  "Minimalist isometric workspace with a glowing monitor and a sleeping cat",
  "A surreal portrait of an astronaut made of liquid mercury, dramatic lighting",
];

function ImageGenPage() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [imgs, setImgs] = useState<{ prompt: string; dataUrl: string }[]>([]);
  const [err, setErr] = useState<string | null>(null);

  async function generate() {
    const p = prompt.trim();
    if (!p || loading) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: p }),
      });
      const j = await res.json();
      if (!res.ok || !j.dataUrl) {
        setErr(j.error || "Generation failed");
      } else {
        setImgs((cur) => [{ prompt: p, dataUrl: j.dataUrl }, ...cur]);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 text-white">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-violet-600">
            <ImageIcon className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.32em] text-white/55">Polaris</div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Image Gen 2</h1>
            <div className="text-xs text-white/55">Text → image, powered by Lovable AI.</div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) generate();
            }}
            placeholder="Describe the image you want… (⌘/Ctrl + Enter to generate)"
            rows={3}
            className="w-full resize-none rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-fuchsia-400/40"
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              onClick={generate}
              disabled={loading || !prompt.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-fuchsia-500 px-5 py-2.5 text-sm font-bold text-black hover:bg-fuchsia-400 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? "Generating…" : "Generate"}
            </button>
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => setPrompt(p)}
                className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] text-white/70 hover:bg-white/10"
              >
                {p.slice(0, 36)}…
              </button>
            ))}
          </div>
          {err && <div className="mt-3 rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-200">{err}</div>}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {imgs.length === 0 && !loading && (
            <div className="col-span-full rounded-3xl border border-dashed border-white/10 p-10 text-center text-sm text-white/45">
              Your generated images will appear here.
            </div>
          )}
          {imgs.map((img, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
              <img src={img.dataUrl} alt={img.prompt} className="aspect-square w-full object-cover" />
              <div className="flex items-start justify-between gap-3 p-3">
                <div className="text-xs text-white/65 line-clamp-2">{img.prompt}</div>
                <a
                  href={img.dataUrl}
                  download={`polaris-${i + 1}.png`}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-[11px] font-semibold hover:bg-white/20"
                >
                  <Download className="h-3 w-3" /> Save
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}