import { X, ExternalLink, RotateCw } from "lucide-react";
import { useEffect, useState } from "react";

export function EmbedFrame({
  src,
  title,
  onClose,
}: {
  src: string;
  title: string;
  onClose: () => void;
}) {
  const [key, setKey] = useState(0);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-black">
      <div className="liquid-glass-themed flex items-center justify-between px-4 py-2">
        <div className="truncate text-sm font-medium text-white">{title}</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setKey((k) => k + 1)}
            className="rounded-lg p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
            aria-label="Reload"
          >
            <RotateCw className="h-4 w-4" />
          </button>
          <a
            href={src}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
            aria-label="Open in new tab"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <iframe
        key={key}
        src={src}
        title={title}
        className="flex-1 w-full border-0 bg-black"
        allow="autoplay; fullscreen; gamepad; cross-origin-isolated"
        allowFullScreen
        referrerPolicy="no-referrer"
      />
    </div>
  );
}