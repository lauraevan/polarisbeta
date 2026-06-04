import { useCallback, useEffect, useRef, useState } from "react";
import {
  Cpu, Upload, ShieldCheck, Play, Trash2, X, Library, Cloud, Zap, Loader2,
} from "lucide-react";
import {
  CORES, MONOXIDE_LIBRARY, type FeaturedRom, type Homebrew,
} from "@/lib/homebrew-roms";
import { blobUrl, deleteBlob, getBlob, listBlobs, putBlob } from "@/lib/rom-store";
import { CatalogPane } from "./CatalogPane";
import { SwitchCloudPane } from "./SwitchCloudPane";
import { StratusCloudPane } from "./StratusCloudPane";

const EJS_DATA = "https://cdn.emulatorjs.org/stable/data/";
const ALL_EXTS = CORES.flatMap((c) => c.exts).join(",");

type Booted = { core: Homebrew["core"]; url: string; name: string; ownsUrl: boolean };
type UserEntry = { id: string; name: string; core?: string; size: number; addedAt: number };
type Overlay = null | "catalog" | "cloud" | "stratus";

declare global {
  interface Window {
    EJS_player?: string;
    EJS_core?: string;
    EJS_gameUrl?: string;
    EJS_gameName?: string;
    EJS_pathtodata?: string;
    EJS_startOnLoaded?: boolean;
    EJS_biosUrl?: string;
    EJS_emulator?: unknown;
  }
}

function inferCore(name: string): Homebrew["core"] | undefined {
  const lower = name.toLowerCase();
  for (const c of CORES) for (const ext of c.exts) if (lower.endsWith(ext)) return c.id;
  return undefined;
}

export function Emulator() {
  const [booted, setBooted] = useState<Booted | null>(null);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [userLib, setUserLib] = useState<UserEntry[]>([]);
  const [biosLoaded, setBiosLoaded] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const all = await listBlobs("rom:");
    setUserLib(all.map((e) => ({ id: e.id, name: e.name, core: e.core, size: e.size, addedAt: e.addedAt })));
    setBiosLoaded(!!(await getBlob("bios:ps1")));
  }, []);

  useEffect(() => { refresh().catch(() => {}); }, [refresh]);

  async function importFile(file: File, opts?: { featuredId?: string; coreOverride?: Homebrew["core"] }) {
    setBusy(`Importing ${file.name}…`);
    setError(null);
    try {
      const buf = await file.arrayBuffer();
      const core = opts?.coreOverride ?? inferCore(file.name);
      if (!core) throw new Error("Unknown ROM type — please pick a supported file extension.");
      const id = opts?.featuredId ? `rom:featured:${opts.featuredId}` : `rom:user:${Date.now()}:${file.name}`;
      await putBlob(id, file.name, core, buf);
      await refresh();
      // Auto-boot what was just imported.
      const url = blobUrl(buf);
      setBooted({ core, url, name: file.name, ownsUrl: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(null);
    }
  }

  async function bootStored(id: string) {
    setBusy("Loading…");
    setError(null);
    try {
      const entry = await getBlob(id);
      if (!entry) throw new Error("ROM not in your library yet.");
      const core = (entry.core as Homebrew["core"]) ?? inferCore(entry.name);
      if (!core) throw new Error("Unknown ROM type.");
      setBooted({ core, url: blobUrl(entry.data), name: entry.name, ownsUrl: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load ROM");
    } finally {
      setBusy(null);
    }
  }

  async function bootRemote(core: Homebrew["core"], url: string, name: string) {
    setBooted({ core, url, name, ownsUrl: false });
  }

  async function removeStored(id: string) {
    await deleteBlob(id);
    await refresh();
  }

  async function loadBios(file: File) {
    setBusy("Storing BIOS…");
    try {
      const buf = await file.arrayBuffer();
      await putBlob("bios:ps1", file.name, "psx", buf);
      await refresh();
    } finally {
      setBusy(null);
    }
  }

  // Featured library card: launch from IDB if cached, otherwise prompt for the file.
  const featuredInputRef = useRef<HTMLInputElement>(null);
  const [pendingFeatured, setPendingFeatured] = useState<FeaturedRom | null>(null);

  async function launchFeatured(f: FeaturedRom) {
    const cached = await getBlob(`rom:featured:${f.id}`);
    if (cached) {
      const core = (cached.core as Homebrew["core"]) ?? f.core;
      setBooted({ core, url: blobUrl(cached.data), name: cached.name, ownsUrl: true });
      return;
    }
    setPendingFeatured(f);
    featuredInputRef.current?.click();
  }

  function onFeaturedPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !pendingFeatured) return;
    importFile(file, { featuredId: pendingFeatured.id, coreOverride: pendingFeatured.core });
    setPendingFeatured(null);
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-3 pb-24 pt-4 text-white sm:px-6">
      {/* Header */}
      <header className="flex flex-col items-center gap-4 pb-6 sm:flex-row sm:items-start sm:gap-5">
        <div
          className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border"
          style={{
            background: "rgba(var(--polaris-accent)/0.18)",
            borderColor: "rgba(var(--polaris-accent)/0.45)",
            boxShadow: "0 8px 28px -10px rgba(var(--polaris-accent)/0.55)",
          }}
        >
          <Cpu className="h-7 w-7" style={{ color: "rgb(var(--polaris-accent))" }} />
        </div>
        <div className="liquid-glass-themed w-full rounded-2xl px-5 py-3 text-center sm:text-left">
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
            <span className="italic" style={{ color: "rgb(var(--polaris-accent))" }}>Monoxide</span>{" "}
            <span className="text-white/85">Emulator</span>
          </h1>
          <p className="mt-0.5 text-xs text-white/55 sm:text-sm">
            GBA · GBC · NES · SNES · PS1, save states synced to your account
          </p>
        </div>
      </header>

      {/* Quick links */}
      <div className="mb-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
        <PillButton icon={Library} label="Full catalog" onClick={() => setOverlay("catalog")} />
        <PillButton icon={Cloud}   label="Switch · Cloud" onClick={() => setOverlay("cloud")} />
        <PillButton icon={Zap}     label="Stratus Cloud" onClick={() => setOverlay("stratus")} />
      </div>

      {/* Drop zone */}
      <Dropzone onFile={(f) => importFile(f)} />

      {/* PS1 BIOS */}
      <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 transition hover:border-white/20 hover:bg-white/[0.06]">
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
          style={{ background: "rgba(var(--polaris-accent)/0.18)" }}
        >
          <ShieldCheck className="h-5 w-5" style={{ color: "rgb(var(--polaris-accent))" }} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold">PS1 BIOS</span>
          <span className="block truncate text-[11px] text-white/55">
            {biosLoaded ? "Loaded — PS1 games will boot" : "Not loaded — PS1 games may not boot without it"}
          </span>
        </span>
        <span
          className="rounded-full px-3 py-1.5 text-[11px] font-bold"
          style={{ background: "rgba(var(--polaris-accent)/0.22)", color: "rgb(var(--polaris-accent))" }}
        >
          {biosLoaded ? "Replace BIOS" : "Load BIOS"}
        </span>
        <input
          type="file"
          accept=".bin,.rom"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) loadBios(f); e.target.value = ""; }}
        />
      </label>

      {/* Monoxide library */}
      <SectionLabel>Monoxide Library ({MONOXIDE_LIBRARY.length})</SectionLabel>
      <div className="space-y-2">
        {MONOXIDE_LIBRARY.map((f) => (
          <FeaturedRow key={f.id} rom={f} onPlay={() => launchFeatured(f)} cached={userLib.some((u) => u.id === `rom:featured:${f.id}`)} />
        ))}
      </div>

      {/* Your library */}
      <SectionLabel>
        Your Library ({userLib.filter((u) => u.id.startsWith("rom:user:")).length})
      </SectionLabel>
      <div className="space-y-2">
        {userLib.filter((u) => u.id.startsWith("rom:user:")).length === 0 && (
          <p className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-xs text-white/45">
            Drop a ROM above to start your personal library.
          </p>
        )}
        {userLib
          .filter((u) => u.id.startsWith("rom:user:"))
          .sort((a, b) => b.addedAt - a.addedAt)
          .map((u) => (
            <UserRow
              key={u.id}
              entry={u}
              onPlay={() => bootStored(u.id)}
              onDelete={() => removeStored(u.id)}
            />
          ))}
      </div>

      {/* Hidden input used by featured rows */}
      <input
        ref={featuredInputRef}
        type="file"
        accept={ALL_EXTS}
        className="hidden"
        onChange={onFeaturedPicked}
      />

      {/* Toast row */}
      {(busy || error) && (
        <div className="fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4">
          <div className="liquid-glass-strong flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs">
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span className={error ? "text-red-300" : "text-white/85"}>{error ?? busy}</span>
            {error && (
              <button onClick={() => setError(null)} className="ml-2 text-white/60 hover:text-white">×</button>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen player */}
      {booted && (
        <PlayerOverlay
          booted={booted}
          onClose={() => {
            if (booted.ownsUrl) URL.revokeObjectURL(booted.url);
            setBooted(null);
          }}
          biosUrl={biosLoaded ? undefined : undefined}
        />
      )}

      {/* Overlays */}
      {overlay === "catalog" && (
        <FullOverlay title="ROM Catalog" onClose={() => setOverlay(null)}>
          <CatalogPane onLaunch={(rom) => { setOverlay(null); bootRemote(rom.core, rom.url, rom.name); }} />
        </FullOverlay>
      )}
      {overlay === "cloud" && (
        <FullOverlay title="Switch · Cloud" onClose={() => setOverlay(null)}><SwitchCloudPane /></FullOverlay>
      )}
      {overlay === "stratus" && (
        <FullOverlay title="Stratus Cloud" onClose={() => setOverlay(null)}><StratusCloudPane /></FullOverlay>
      )}
    </div>
  );
}

/* ───────────────────────────── sub-components ───────────────────────────── */

function PillButton({ icon: Icon, label, onClick }: { icon: typeof Library; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:border-white/25 hover:bg-white/[0.09] hover:text-white"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 mt-6 text-[11px] font-bold uppercase tracking-[0.2em] text-white/55">
      {children}
    </h2>
  );
}

function Dropzone({ onFile }: { onFile: (f: File) => void }) {
  const [hover, setHover] = useState(false);
  return (
    <label
      onDragOver={(e) => { e.preventDefault(); setHover(true); }}
      onDragLeave={() => setHover(false)}
      onDrop={(e) => {
        e.preventDefault(); setHover(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
      }}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-10 text-center transition ${
        hover ? "border-white/40 bg-white/[0.06]" : "border-white/15 bg-white/[0.03] hover:border-white/25"
      }`}
    >
      <Upload className="h-7 w-7 text-white/65" />
      <div className="text-sm font-bold sm:text-base">Drop ROM here or tap to upload</div>
      <div className="max-w-md text-[11px] text-white/55 sm:text-xs">
        GBA, GBC, NES, SNES, PS1, N64, Genesis. Stored locally in your browser.
      </div>
      <input
        type="file"
        accept={ALL_EXTS}
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }}
      />
    </label>
  );
}

function FeaturedRow({ rom, onPlay, cached }: { rom: FeaturedRom; onPlay: () => void; cached: boolean }) {
  return (
    <button
      onClick={onPlay}
      className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-left transition hover:border-white/25 hover:bg-white/[0.07]"
    >
      <div className="grid h-14 w-12 shrink-0 overflow-hidden rounded-lg bg-black/50">
        {rom.cover ? (
          <img src={rom.cover} alt="" loading="lazy" referrerPolicy="no-referrer"
               className="h-full w-full object-cover" />
        ) : (
          <div className="grid place-items-center text-[10px] font-bold text-white/60">{rom.core.toUpperCase()}</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold">{rom.name}</div>
        <div className="truncate text-[11px] uppercase tracking-widest text-white/45">
          {rom.core.toUpperCase()}{cached ? " · ready" : " · supply ROM"}
        </div>
      </div>
      <span
        className="flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold"
        style={{ background: "rgba(var(--polaris-accent)/0.22)", color: "rgb(var(--polaris-accent))" }}
      >
        <Play className="h-3 w-3 fill-current" /> Play
      </span>
    </button>
  );
}

function UserRow({ entry, onPlay, onDelete }: { entry: UserEntry; onPlay: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-white/[0.06] text-[10px] font-bold tracking-widest text-white/70">
        {(entry.core ?? "ROM").toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold">{entry.name}</div>
        <div className="truncate text-[11px] text-white/45">{(entry.size / 1024 / 1024).toFixed(1)} MB</div>
      </div>
      <button onClick={onPlay}
              className="flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold"
              style={{ background: "rgba(var(--polaris-accent)/0.22)", color: "rgb(var(--polaris-accent))" }}>
        <Play className="h-3 w-3 fill-current" /> Play
      </button>
      <button onClick={onDelete}
              className="grid h-8 w-8 place-items-center rounded-full text-white/45 transition hover:bg-white/10 hover:text-white"
              aria-label="Delete">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function FullOverlay({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[120] flex flex-col bg-black/95 text-white">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="text-sm font-bold uppercase tracking-widest">{title}</div>
        <button onClick={onClose}
                className="grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-white/20"
                aria-label="Close">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}

function PlayerOverlay({ booted, onClose }: { booted: Booted; onClose: () => void; biosUrl?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [booting, setBooting] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const host = mountRef.current;
    if (!host) return;
    host.innerHTML = "";
    const target = document.createElement("div");
    target.id = "polaris-ejs-target";
    target.className = "h-full w-full";
    host.appendChild(target);

    window.EJS_player = "#polaris-ejs-target";
    window.EJS_core = booted.core;
    window.EJS_gameUrl = booted.url;
    window.EJS_gameName = booted.name;
    window.EJS_pathtodata = EJS_DATA;
    window.EJS_startOnLoaded = true;

    const script = document.createElement("script");
    script.src = `${EJS_DATA}loader.js`;
    script.async = true;
    script.onload = () => setBooting(false);
    script.onerror = () => { setErr("Couldn't reach the EmulatorJS CDN."); setBooting(false); };
    document.body.appendChild(script);

    return () => {
      script.remove();
      host.innerHTML = "";
      delete window.EJS_player;
      delete window.EJS_core;
      delete window.EJS_gameUrl;
      delete window.EJS_gameName;
      delete window.EJS_emulator;
    };
  }, [booted.core, booted.url, booted.name]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[120] flex flex-col bg-black">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-white">
        <div className="truncate text-xs font-bold">{booted.name}</div>
        <button onClick={onClose}
                className="grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-white/20"
                aria-label="Stop">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="relative min-h-0 flex-1">
        {booting && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-black/60 text-xs text-white/80">
            <div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Booting {booted.core.toUpperCase()}…</div>
          </div>
        )}
        {err && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-black/70 px-4 text-center text-sm text-red-300">{err}</div>
        )}
        <div ref={mountRef} className="h-full w-full" />
      </div>
    </div>
  );
}