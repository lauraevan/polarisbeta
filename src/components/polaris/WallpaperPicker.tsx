import { useEffect, useMemo, useState } from "react";
import {
  ImageIcon, X, Play, Check, Monitor, Upload, Heart, Flag, Trash2,
  Sparkles, Users, Library,
} from "lucide-react";
import { useWallpaper } from "@/lib/wallpaper-context";
import { useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import {
  listLocalCustomWallpapers, saveLocalCustomWallpaper, removeLocalCustomWallpaper,
  readWallpaperOverride, writeWallpaperOverride, pickAccentFromImage, uploadWallpaperFile,
  fetchCommunityWallpapers, insertCommunityWallpaper, toggleHeart, reportWallpaper, hideWallpaper,
  type CustomWallpaper, type CommunityWallpaper,
} from "@/lib/wallpaper-custom";

type Tab = "builtin" | "mine" | "community" | "upload";

export function WallpaperPicker({
  open: controlledOpen,
  onOpenChange,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { wallpaper, setWallpaperId, resolution, setResolution, all } = useWallpaper();
  const { user, profile } = useAuth();
  const [localOpen, setLocalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("builtin");
  const [override, setOverride] = useState<CustomWallpaper | null>(null);
  const [mine, setMine] = useState<CustomWallpaper[]>([]);
  const [community, setCommunity] = useState<CommunityWallpaper[]>([]);
  const [communityLoading, setCommunityLoading] = useState(false);

  const open = controlledOpen ?? localOpen;
  const setOpen = onOpenChange ?? setLocalOpen;
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hideLauncher = pathname.startsWith("/media");

  useEffect(() => {
    setOverride(readWallpaperOverride());
    setMine(listLocalCustomWallpapers());
    const onChange = () => {
      setOverride(readWallpaperOverride());
      setMine(listLocalCustomWallpapers());
    };
    window.addEventListener("polaris:wallpaper-override-changed", onChange);
    window.addEventListener("polaris:custom-wallpapers-changed", onChange);
    return () => {
      window.removeEventListener("polaris:wallpaper-override-changed", onChange);
      window.removeEventListener("polaris:custom-wallpapers-changed", onChange);
    };
  }, []);

  useEffect(() => {
    if (tab !== "community" || community.length) return;
    setCommunityLoading(true);
    fetchCommunityWallpapers().then((rows) => {
      setCommunity(rows);
      setCommunityLoading(false);
    });
  }, [tab, community.length]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter((w) => w.name.toLowerCase().includes(q));
  }, [all, query]);

  const pickCustom = (w: CustomWallpaper) => { writeWallpaperOverride(w); setOpen(false); };
  const pickBuiltin = (id: string) => { writeWallpaperOverride(null); setWallpaperId(id); setOpen(false); };

  const tabs: { id: Tab; label: string; icon: typeof Library }[] = [
    { id: "builtin",   label: "Built-in",    icon: Library },
    { id: "mine",      label: "My uploads",  icon: Sparkles },
    { id: "community", label: "Community",   icon: Users },
    { id: "upload",    label: "Upload",      icon: Upload },
  ];

  const isOwner = !!profile?.is_owner;

  return (
    <>
      {!hideLauncher && (
        <button
          onClick={() => setOpen(!open)}
          className="liquid-glass fixed right-5 top-5 z-30 flex items-center gap-2 rounded-full px-3.5 py-2 text-xs text-white/90 hover:text-white"
          style={{
            boxShadow: `0 10px 30px -10px rgba(var(--polaris-accent)/0.6), inset 0 0 0 1px rgba(var(--polaris-accent)/0.35)`,
          }}
        >
          <ImageIcon className="h-4 w-4" />
          Wallpaper
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/55 p-3 backdrop-blur-md md:items-center md:p-6"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="liquid-glass-strong relative flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl"
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
              <div>
                <div className="text-sm font-semibold text-white">Wallpaper Gallery</div>
                <div className="text-[11px] text-white/55">
                  Pick built-in scenes, upload your own, or browse community shares
                </div>
              </div>
              <div className="flex items-center gap-2">
                {tab === "builtin" && (
                  <div className="flex items-center gap-1 rounded-full liquid-glass px-1.5 py-1">
                    <Monitor className="h-3 w-3 text-white/60 ml-1" />
                    {(["540p", "1080p", "4k"] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setResolution(r)}
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold transition ${
                          resolution === r ? "bg-white/20 text-white" : "text-white/50 hover:text-white/80"
                        }`}
                      >
                        {r === "4k" ? "4K" : r}
                      </button>
                    ))}
                  </div>
                )}
                {tab === "builtin" && (
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search wallpapers…"
                    className="liquid-glass hidden w-48 rounded-full px-3 py-1.5 text-[11px] text-white placeholder:text-white/50 focus:outline-none sm:block"
                  />
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-full p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex gap-1 border-b border-white/10 px-3 py-2 overflow-x-auto scrollbar-none">
              {tabs.map((t) => {
                const Icon = t.icon;
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      active ? "bg-white text-black" : "text-white/65 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {t.label}
                  </button>
                );
              })}
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
              {tab === "builtin" && (
                <BuiltinGrid wallpapers={visible} activeId={!override ? wallpaper.id : null} onPick={pickBuiltin} />
              )}
              {tab === "mine" && (
                <MyUploadsGrid
                  items={mine}
                  activeId={override?.id ?? null}
                  onPick={pickCustom}
                  onRemove={(id) => removeLocalCustomWallpaper(id)}
                />
              )}
              {tab === "community" && (
                <CommunityGrid
                  items={community}
                  loading={communityLoading}
                  activeId={override?.id ?? null}
                  isOwner={isOwner}
                  onPick={(c) =>
                    pickCustom({ id: c.id, name: c.name, url: c.image_url, accent: c.accent, type: c.type })
                  }
                  onHeart={async (id) => {
                    if (!user) return;
                    await toggleHeart(id);
                    setCommunity(await fetchCommunityWallpapers());
                  }}
                  onReport={async (id) => {
                    if (!user) return;
                    const reason = window.prompt("Why are you reporting this wallpaper?");
                    if (!reason) return;
                    await reportWallpaper(id, user.id, reason);
                  }}
                  onHide={async (id) => {
                    if (!isOwner) return;
                    await hideWallpaper(id);
                    setCommunity(await fetchCommunityWallpapers());
                  }}
                />
              )}
              {tab === "upload" && (
                <UploadPanel
                  signedIn={!!user}
                  onSavedLocal={(w) => { setMine(listLocalCustomWallpapers()); pickCustom(w); }}
                  user={user ? { id: user.id } : null}
                  username={profile?.username ?? profile?.display_name ?? "anonymous"}
                  onShared={() => setCommunity([])}
                />
              )}
            </div>

            <div className="border-t border-white/10 px-5 py-2.5 text-[10px] text-white/45">
              {tab === "builtin"
                ? `${visible.length} built-in wallpapers · ${resolution === "4k" ? "4K" : resolution} mode`
                : tab === "mine"
                  ? `${mine.length} of 30 personal slots used · Stored on this device`
                  : tab === "community"
                    ? `${community.length} community wallpapers · sorted by hearts`
                    : "Images up to 8MB · stored on your account if shared"}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function BuiltinGrid({
  wallpapers, activeId, onPick,
}: {
  wallpapers: ReturnType<typeof useWallpaper>["all"];
  activeId: string | null;
  onPick: (id: string) => void;
}) {
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
      {wallpapers.map((w) => {
        const active = w.id === activeId;
        return (
          <button key={w.id} onClick={() => onPick(w.id)} className="group flex flex-col gap-2 text-left">
            <div
              className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/10 transition-transform group-hover:-translate-y-0.5"
              style={active ? { boxShadow: `0 0 0 2px rgba(${w.accent}/0.95), 0 18px 50px -12px rgba(${w.accent}/0.6)` } : undefined}
            >
              <img src={w.poster ?? w.src} alt={w.name} loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute right-2 top-2 flex items-center gap-1">
                {w.type === "animated" && (
                  <span className="flex items-center gap-1 rounded-full bg-black/55 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-white/90 backdrop-blur">
                    <Play className="h-2.5 w-2.5 fill-white" /> Live
                  </span>
                )}
                {active && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full text-black" style={{ background: `rgba(${w.accent}/0.95)` }}>
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 px-0.5">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: `rgba(${w.accent}/0.95)` }} />
              <span className="line-clamp-1 text-[11px] font-medium text-white/90">{w.name}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function MyUploadsGrid({
  items, activeId, onPick, onRemove,
}: {
  items: CustomWallpaper[];
  activeId: string | null;
  onPick: (w: CustomWallpaper) => void;
  onRemove: (id: string) => void;
}) {
  if (!items.length) {
    return (
      <div className="grid place-items-center py-16 text-center text-white/50">
        <Sparkles className="mx-auto mb-2 h-8 w-8 opacity-50" />
        <div className="text-sm font-semibold text-white/80">No personal wallpapers yet</div>
        <div className="mt-1 text-xs">Switch to the Upload tab to add one.</div>
      </div>
    );
  }
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
      {items.map((w) => {
        const active = w.id === activeId;
        return (
          <div key={w.id} className="group relative flex flex-col gap-2 text-left">
            <button onClick={() => onPick(w)} className="block">
              <div
                className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/10 transition-transform group-hover:-translate-y-0.5"
                style={active ? { boxShadow: `0 0 0 2px rgba(${w.accent}/0.95), 0 18px 50px -12px rgba(${w.accent}/0.6)` } : undefined}
              >
                <img src={w.url} alt={w.name} loading="lazy" className="h-full w-full object-cover" />
                {active && (
                  <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-black" style={{ background: `rgba(${w.accent}/0.95)` }}>
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </div>
            </button>
            <div className="flex items-center gap-2 px-0.5">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: `rgba(${w.accent}/0.95)` }} />
              <span className="line-clamp-1 flex-1 text-[11px] font-medium text-white/90">{w.name}</span>
              <button
                onClick={() => onRemove(w.id)}
                title="Remove"
                className="rounded p-1 text-white/40 hover:bg-white/10 hover:text-red-300"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CommunityGrid({
  items, loading, activeId, isOwner, onPick, onHeart, onReport, onHide,
}: {
  items: CommunityWallpaper[];
  loading: boolean;
  activeId: string | null;
  isOwner: boolean;
  onPick: (c: CommunityWallpaper) => void;
  onHeart: (id: string) => void;
  onReport: (id: string) => void;
  onHide: (id: string) => void;
}) {
  if (loading) return <div className="py-16 text-center text-xs text-white/50">Loading community wallpapers…</div>;
  if (!items.length) {
    return (
      <div className="grid place-items-center py-16 text-center text-white/50">
        <Users className="mx-auto mb-2 h-8 w-8 opacity-50" />
        <div className="text-sm font-semibold text-white/80">No community wallpapers yet</div>
        <div className="mt-1 text-xs">Be the first to share one from the Upload tab.</div>
      </div>
    );
  }
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
      {items.map((c) => {
        const active = c.id === activeId;
        return (
          <div key={c.id} className="group relative flex flex-col gap-2 text-left">
            <button onClick={() => onPick(c)} className="block">
              <div
                className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/10 transition-transform group-hover:-translate-y-0.5"
                style={active ? { boxShadow: `0 0 0 2px rgba(${c.accent}/0.95), 0 18px 50px -12px rgba(${c.accent}/0.6)` } : undefined}
              >
                <img src={c.image_url} alt={c.name} loading="lazy" className="h-full w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/80 to-transparent px-2 pb-1.5 pt-6 text-[10px] text-white/85">
                  <span className="truncate">by @{c.uploader_username}</span>
                  <span className="flex items-center gap-0.5"><Heart className="h-3 w-3" /> {c.hearts}</span>
                </div>
              </div>
            </button>
            <div className="flex items-center gap-1.5 px-0.5">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: `rgba(${c.accent}/0.95)` }} />
              <span className="line-clamp-1 flex-1 text-[11px] font-medium text-white/90">{c.name}</span>
              <button onClick={() => onHeart(c.id)} title="Heart" className="rounded p-1 text-white/40 hover:bg-white/10 hover:text-pink-300">
                <Heart className="h-3 w-3" />
              </button>
              <button onClick={() => onReport(c.id)} title="Report" className="rounded p-1 text-white/40 hover:bg-white/10 hover:text-amber-300">
                <Flag className="h-3 w-3" />
              </button>
              {isOwner && (
                <button onClick={() => onHide(c.id)} title="Hide (owner)" className="rounded p-1 text-white/40 hover:bg-white/10 hover:text-red-300">
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function UploadPanel({
  signedIn, onSavedLocal, user, username, onShared,
}: {
  signedIn: boolean;
  onSavedLocal: (w: CustomWallpaper) => void;
  user: { id: string } | null;
  username: string;
  onShared: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [share, setShare] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    if (!name) setName(file.name.replace(/\.[a-z0-9]+$/i, "").slice(0, 60));
    return () => URL.revokeObjectURL(url);
  }, [file, name]);

  async function save() {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { setErr("File must be 8 MB or smaller."); return; }
    setErr(null);
    setBusy(true);
    try {
      const accent = await pickAccentFromImage(file);
      const type: "static" | "animated" = file.type.startsWith("video/") ? "animated" : "static";
      if (share && user) {
        const url = await uploadWallpaperFile(file, user.id);
        const { data, error } = await insertCommunityWallpaper({
          uploader_id: user.id, uploader_username: username,
          name: name.trim() || "Untitled wallpaper",
          image_url: url, accent, type,
        });
        if (error) throw error;
        const cw: CustomWallpaper = { id: data!.id, name: data!.name, url, accent, type };
        saveLocalCustomWallpaper(cw);
        onSavedLocal(cw);
        onShared();
      } else {
        const dataUrl = await fileToDataUrl(file);
        const cw: CustomWallpaper = {
          id: crypto.randomUUID(),
          name: name.trim() || "Untitled wallpaper",
          url: dataUrl, accent, type,
        };
        saveLocalCustomWallpaper(cw);
        onSavedLocal(cw);
      }
      setFile(null); setName(""); setShare(false);
    } catch (e) {
      setErr((e as Error).message || "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-white/15 bg-white/5 p-8 text-center transition hover:border-white/30 hover:bg-white/10">
        <input
          type="file"
          accept="image/*,video/mp4,video/webm"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        {preview ? (
          file?.type.startsWith("video/") ? (
            <video src={preview} className="mx-auto max-h-48 rounded-lg" muted autoPlay loop playsInline />
          ) : (
            <img src={preview} alt="" className="mx-auto max-h-48 rounded-lg object-contain" />
          )
        ) : (
          <>
            <Upload className="mx-auto h-8 w-8 text-white/40" />
            <div className="mt-2 text-sm font-semibold text-white">Drop an image or video here</div>
            <div className="text-xs text-white/55">JPG, PNG, WebP, MP4, WebM · up to 8 MB</div>
          </>
        )}
      </label>

      {file && (
        <>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-white/55">Wallpaper name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 60))}
              placeholder="Sunset over Akihabara"
              className="mt-1 w-full rounded-xl bg-white/5 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-white/30"
            />
          </div>
          <label className={`flex items-center gap-3 rounded-xl border p-3 text-sm ${signedIn ? "border-white/10" : "border-white/5 opacity-60"}`}>
            <input
              type="checkbox" checked={share} disabled={!signedIn}
              onChange={(e) => setShare(e.target.checked)}
              className="h-4 w-4 accent-[rgb(var(--polaris-accent))]"
            />
            <div className="flex-1">
              <div className="font-semibold text-white">Share to Community</div>
              <div className="text-[11px] text-white/55">
                {signedIn ? "Anyone can see, heart, and apply your wallpaper." : "Sign in to share."}
              </div>
            </div>
          </label>
          {err && <div className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">{err}</div>}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => { setFile(null); setName(""); setShare(false); }}
              className="rounded-xl bg-white/5 px-4 py-2 text-sm font-semibold text-white/70 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={busy}
              className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-black hover:bg-white/90 disabled:opacity-50"
            >
              {busy ? "Saving…" : share ? "Share + apply" : "Save + apply"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function fileToDataUrl(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = reject;
    r.onload = () => resolve(r.result as string);
    r.readAsDataURL(f);
  });
}