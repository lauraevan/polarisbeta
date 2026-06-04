import { useEffect, useRef, useState } from "react";
import { Upload, Gamepad2, Sparkles, Play, X, Loader2 } from "lucide-react";
import { HOMEBREW, CORES, type Homebrew } from "@/lib/homebrew-roms";

type Loaded = {
  core: Homebrew["core"];
  gameUrl: string;
  name: string;
  /** Object URL when user-uploaded; revoke on unmount. */
  ownsUrl: boolean;
};

const EJS_DATA = "https://cdn.emulatorjs.org/stable/data/";

declare global {
  interface Window {
    EJS_player?: string;
    EJS_core?: string;
    EJS_gameUrl?: string;
    EJS_gameName?: string;
    EJS_pathtodata?: string;
    EJS_startOnLoaded?: boolean;
    EJS_Buttons?: Record<string, boolean>;
    EJS_emulator?: unknown;
  }
}

export function RetroPane({
  preloaded,
}: {
  /** Auto-boot this ROM when the pane mounts (from the Catalog tab). */
  preloaded?: { core: Homebrew["core"]; url: string; name: string } | null;
} = {}) {
  const [core, setCore] = useState<Homebrew["core"]>(preloaded?.core ?? "gb");
  const [loaded, setLoaded] = useState<Loaded | null>(
    preloaded
      ? { core: preloaded.core, gameUrl: preloaded.url, name: preloaded.name, ownsUrl: false }
      : null,
  );
  const [booting, setBooting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountRef = useRef<HTMLDivElement>(null);

  // When parent passes a new preloaded ROM (Catalog → Retro), boot it.
  useEffect(() => {
    if (!preloaded) return;
    setCore(preloaded.core);
    setLoaded({ core: preloaded.core, gameUrl: preloaded.url, name: preloaded.name, ownsUrl: false });
  }, [preloaded?.url, preloaded?.core, preloaded?.name]);

  // Mount EmulatorJS into our React DOM (no iframe) whenever a game is picked.
  useEffect(() => {
    if (!loaded || !mountRef.current) return;

    setBooting(true);
    setError(null);

    // Clear any previous instance.
    mountRef.current.innerHTML = "";
    const target = document.createElement("div");
    target.id = "polaris-ejs-target";
    target.className = "h-full w-full";
    mountRef.current.appendChild(target);

    window.EJS_player = "#polaris-ejs-target";
    window.EJS_core = loaded.core;
    window.EJS_gameUrl = loaded.gameUrl;
    window.EJS_gameName = loaded.name;
    window.EJS_pathtodata = EJS_DATA;
    window.EJS_startOnLoaded = true;

    const script = document.createElement("script");
    script.src = `${EJS_DATA}loader.js`;
    script.async = true;
    script.onload = () => setBooting(false);
    script.onerror = () => {
      setError("Couldn't reach the EmulatorJS CDN. Check your connection and try again.");
      setBooting(false);
    };
    document.body.appendChild(script);

    return () => {
      // Tear down: drop the script, clear mount, revoke object URL if ours.
      script.remove();
      if (mountRef.current) mountRef.current.innerHTML = "";
      try {
        if (loaded.ownsUrl) URL.revokeObjectURL(loaded.gameUrl);
      } catch {}
      // Reset EJS globals so the next boot starts fresh.
      delete window.EJS_player;
      delete window.EJS_core;
      delete window.EJS_gameUrl;
      delete window.EJS_gameName;
      delete window.EJS_emulator;
    };
  }, [loaded]);

  function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setLoaded({ core, gameUrl: url, name: file.name, ownsUrl: true });
  }

  function pickHomebrew(h: Homebrew) {
    setCore(h.core);
    setLoaded({ core: h.core, gameUrl: h.url, name: h.name, ownsUrl: false });
  }

  return (
    <div className="grid h-full grid-rows-[auto_1fr] gap-3 p-3 md:grid-cols-[280px_1fr] md:grid-rows-1">
      {/* Sidebar — fully custom UI, no iframe */}
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
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.03] px-3 py-3 text-xs text-white/70 transition hover:border-white/30 hover:bg-white/[0.06]">
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
            <Sparkles className="h-3.5 w-3.5" /> Homebrew · free to play
          </div>
          <div className="space-y-1.5">
            {HOMEBREW.map((h) => (
              <button
                key={h.url}
                onClick={() => pickHomebrew(h)}
                className="group w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-left transition hover:border-white/20 hover:bg-white/[0.07]"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-semibold text-white">{h.name}</div>
                    <div className="truncate text-[10px] text-white/45">{h.blurb}</div>
                  </div>
                  <Play className="h-3.5 w-3.5 shrink-0 text-white/40 transition group-hover:text-white" />
                </div>
              </button>
            ))}
          </div>
        </div>

        <p className="mt-auto text-[10px] leading-relaxed text-white/40">
          Powered by EmulatorJS running directly in this page — no iframe.
          Gamepad, save states, and fullscreen work in the player.
        </p>
      </aside>

      {/* Stage */}
      <div className="liquid-glass-strong relative min-h-0 overflow-hidden rounded-2xl border border-white/10 bg-black/60">
        {!loaded && (
          <div className="absolute inset-0 grid place-items-center p-6 text-center">
            <div>
              <Gamepad2 className="mx-auto h-10 w-10 text-white/30" />
              <div className="mt-3 text-sm font-semibold text-white">Pick a ROM to start</div>
              <p className="mt-1 max-w-xs text-xs text-white/50">
                Upload your own file or boot a homebrew title from the sidebar.
              </p>
            </div>
          </div>
        )}

        {loaded && (
          <>
            <div className="absolute left-3 top-3 z-10 flex items-center gap-2">
              <button
                onClick={() => setLoaded(null)}
                className="rounded-full border border-white/15 bg-black/55 px-3 py-1 text-[11px] text-white/85 backdrop-blur hover:bg-black/75"
              >
                <X className="mr-1 inline h-3 w-3" /> Stop
              </button>
              <span className="rounded-full border border-white/10 bg-black/55 px-3 py-1 text-[11px] text-white/65 backdrop-blur">
                {loaded.name}
              </span>
            </div>

            {booting && (
              <div className="absolute inset-0 grid place-items-center bg-black/40 backdrop-blur-sm">
                <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/70 px-4 py-2 text-xs text-white/80">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Booting {loaded.core.toUpperCase()}…
                </div>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 grid place-items-center p-6 text-center">
                <div>
                  <div className="text-sm font-semibold text-red-300">{error}</div>
                  <button
                    onClick={() => setLoaded({ ...loaded })}
                    className="mt-3 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white hover:bg-white/10"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            <div ref={mountRef} className="h-full w-full" />
          </>
        )}
      </div>
    </div>
  );
}