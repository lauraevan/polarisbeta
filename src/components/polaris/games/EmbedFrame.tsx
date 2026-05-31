import { X, ExternalLink, RotateCw, Maximize2, Minimize2, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function EmbedFrame({
  src,
  title,
  onClose,
  mode = "src",
}: {
  src: string;
  title: string;
  onClose: () => void;
  /** "src" loads the URL directly. "srcdoc" fetches the HTML, rewrites it
   *  with a <base href> pointing at the original CDN folder, and serves it
   *  through a blob: URL with type text/html. This fixes CDNs that send
   *  .html as text/plain (jsdelivr) WITHOUT trapping the game in an
   *  opaque srcdoc origin — so localStorage, canvas, audio context, and
   *  fetch all work the way the game expects. */
  mode?: "src" | "srcdoc";
}) {
  const [key, setKey] = useState(0);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [fs, setFs] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !document.fullscreenElement && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const onFs = () => setFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  useEffect(() => {
    if (mode !== "srcdoc") return;
    let cancelled = false;
    let created: string | null = null;
    setBlobUrl(null);
    setErr(null);
    fetch(src)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((t) => {
        if (cancelled) return;
        // Inject <base href> so relative assets resolve against the source URL.
        const baseHref = src.replace(/[^/]+$/, "");
        let out = t;
        if (!/<base\s/i.test(out)) {
          if (/<head(\s[^>]*)?>/i.test(out)) {
            out = out.replace(/<head(\s[^>]*)?>/i, (m) => `${m}\n<base href="${baseHref}">`);
          } else {
            // No <head> at all — prepend one so the base tag still applies.
            out = `<!doctype html><head><base href="${baseHref}"></head>` + out;
          }
        }
        const blob = new Blob([out], { type: "text/html" });
        created = URL.createObjectURL(blob);
        setBlobUrl(created);
      })
      .catch((e) => !cancelled && setErr(String(e?.message ?? e)));
    return () => {
      cancelled = true;
      if (created) URL.revokeObjectURL(created);
    };
  }, [src, mode, key]);

  const toggleFs = async () => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await el.requestFullscreen?.();
  };

  return (
    <div
      ref={wrapRef}
      className="fixed inset-0 z-[80] flex flex-col bg-black"
    >
      <div className="flex items-center justify-between border-b border-white/10 bg-zinc-950/90 px-4 py-2 backdrop-blur">
        <div className="truncate text-sm font-medium text-white">{title}</div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setKey((k) => k + 1)}
            className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Reload"
          >
            <RotateCw className="h-4 w-4" />
          </button>
          <button
            onClick={toggleFs}
            className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Fullscreen"
          >
            {fs ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <a
            href={src}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Open in new tab"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      {mode === "srcdoc" ? (
        err ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-sm text-white/70">
            <div>Couldn't load this game.</div>
            <div className="text-xs text-white/50">{err}</div>
            <button
              onClick={() => setKey((k) => k + 1)}
              className="mt-2 rounded-full border border-white/20 px-4 py-1 text-xs hover:bg-white/10"
            >
              Retry
            </button>
          </div>
        ) : blobUrl == null ? (
          <div className="flex flex-1 items-center justify-center text-white/60">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <iframe
            key={key}
            src={blobUrl}
            title={title}
            className="flex-1 w-full border-0 bg-black"
            allow="autoplay; fullscreen; gamepad; cross-origin-isolated; clipboard-write"
            allowFullScreen
            referrerPolicy="no-referrer"
          />
        )
      ) : (
        <iframe
          key={key}
          src={src}
          title={title}
          className="flex-1 w-full border-0 bg-black"
          allow="autoplay; fullscreen; gamepad; cross-origin-isolated; clipboard-write"
          allowFullScreen
          referrerPolicy="no-referrer"
        />
      )}
    </div>
  );
}