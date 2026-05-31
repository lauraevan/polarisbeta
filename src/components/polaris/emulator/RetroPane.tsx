import { useEffect, useRef, useState } from "react";
import { Upload, Gamepad2, Sparkles } from "lucide-react";
import { HOMEBREW, CORES, type Homebrew } from "@/lib/homebrew-roms";

type Loaded =
  | { kind: "url"; core: Homebrew["core"]; url: string; name: string }
  | { kind: "blob"; core: Homebrew["core"]; file: File; name: string }
  | null;

export function RetroPane() {
  const [core, setCore] = useState<Homebrew["core"]>("snes");
  const [loaded, setLoaded] = useState<Loaded>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // For blob mode, wait for emujs.html to signal it's ready, then post the File.
  useEffect(() => {
    if (!loaded || loaded.kind !== "blob") return;
    function onMsg(e: MessageEvent) {
      if (e.data?.type === "polaris-rom-ready" && iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          { type: "polaris-rom", file: (loaded as { file: File }).file },
          "*",
        );
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [loaded]);

  function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoaded({ kind: "blob", core, file, name: file.name });
  }

  const src =
    loaded?.kind === "url"
      ? `/emujs.html?core=${loaded.core}&rom=${encodeURIComponent(loaded.url)}&name=${encodeURIComponent(loaded.name)}`
      : loaded?.kind === "blob"
        ? `/emujs.html?core=${loaded.core}&blob=1&name=${encodeURIComponent(loaded.name)}`
        : "/emujs.html";

  return (
    <div className="grid h-full grid-rows-[auto_1fr] gap-3 p-3 md:grid-cols-[280px_1fr] md:grid-rows-1">
      {/* Sidebar */}
      <aside className="liquid-glass-strong flex flex-col gap-4 overflow-y-auto rounded-2xl border border-white/10 p-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/55">
            <Gamepad2 className="h-3.5 w-3.5" /> Console
          </div>
          <select
            value={core}
            onChange={(e) => setCore(e.target.value as Homebrew["core"])}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none"
          >
            {CORES.map((c) => (
              <option key={c.id} value={c.id} className="bg-black">
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/55">
            <Upload className="h-3.5 w-3.5" /> Upload ROM
          </div>
          <label
            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.03] px-3 py-3 text-xs text-white/70 transition hover:border-white/30 hover:bg-white/[0.06]"
          >
            <input
              type="file"
              accept={CORES.find((c) => c.id === core)?.exts.join(",")}
              onChange={onUpload}
              className="hidden"
            />
            Drop or pick a ROM
          </label>
          <p className="mt-1.5 text-[10px] text-white/40">
            Stays in your browser. Nothing is uploaded.
          </p>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/55">
            <Sparkles className="h-3.5 w-3.5" /> Homebrew library
          </div>
          <div className="space-y-1.5">
            {HOMEBREW.map((h) => (
              <button
                key={h.url}
                onClick={() => {
                  setCore(h.core);
                  setLoaded({ kind: "url", core: h.core, url: h.url, name: h.name });
                }}
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-left transition hover:border-white/20 hover:bg-white/[0.07]"
              >
                <div className="text-[13px] font-semibold text-white">{h.name}</div>
                <div className="text-[10px] text-white/45">{h.blurb}</div>
              </button>
            ))}
          </div>
        </div>

        <p className="mt-auto text-[10px] leading-relaxed text-white/40">
          Powered by EmulatorJS. Gamepad, save states, and fullscreen all
          work in-game.
        </p>
      </aside>

      {/* Stage */}
      <div className="liquid-glass-strong relative min-h-0 overflow-hidden rounded-2xl border border-white/10">
        <iframe
          ref={iframeRef}
          key={src}
          src={src}
          title="Polaris Retro Emulator"
          allow="gamepad; fullscreen; autoplay"
          className="h-full w-full"
        />
      </div>
    </div>
  );
}