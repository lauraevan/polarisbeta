import { useEffect, useRef, useState } from "react";
import { ExternalLink, AlertTriangle } from "lucide-react";

export function IframePane({
  url,
  banner,
  warning,
  label,
}: {
  url: string;
  banner: string;
  warning?: boolean;
  label: string;
}) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [blocked, setBlocked] = useState(false);

  // If the iframe never fires onLoad within 6s, assume X-Frame-Options blocked it.
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        // If we can't read anything from contentWindow (cross-origin throw is fine),
        // assume it loaded. If `src` is still about:blank, we never loaded.
        const w = ref.current;
        if (!w) return;
        // Heuristic: nothing visually rendered. We just expose the fallback button.
        // Show the fallback in case the host refuses framing.
        setBlocked(true);
      } catch {
        setBlocked(true);
      }
    }, 6000);
    return () => clearTimeout(t);
  }, [url]);

  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <div
        className={`liquid-glass-strong flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-xs ${
          warning ? "border-amber-400/40 text-amber-100" : "border-white/10 text-white/75"
        }`}
      >
        <div className="flex items-center gap-2">
          {warning && <AlertTriangle className="h-3.5 w-3.5" />}
          <span>{banner}</span>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-white/10"
        >
          <ExternalLink className="h-3 w-3" /> Open in new tab
        </a>
      </div>

      <div className="liquid-glass-strong relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/10">
        <iframe
          ref={ref}
          src={url}
          title={label}
          allow="gamepad; fullscreen; autoplay; clipboard-read; clipboard-write"
          className="h-full w-full"
          onLoad={() => setBlocked(false)}
        />
        {blocked && (
          <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/15 bg-black/70 px-4 py-2 text-[11px] text-white/80 backdrop-blur-xl">
            If the page stays blank, {label} blocked embedding — use "Open in new tab".
          </div>
        )}
      </div>
    </div>
  );
}