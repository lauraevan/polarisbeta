import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Save, LogOut, Loader2, Upload, Trash2 } from "lucide-react";
import { useAuth, type Profile } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

const PRESET_COLORS: { label: string; rgb: string }[] = [
  { label: "Ember",     rgb: "255 140 80" },
  { label: "Sunset",    rgb: "240 110 110" },
  { label: "Peach",     rgb: "255 180 130" },
  { label: "Gold",      rgb: "240 200 100" },
  { label: "Sakura",    rgb: "240 150 200" },
  { label: "Aurora",    rgb: "140 220 200" },
  { label: "Indigo",    rgb: "140 150 240" },
  { label: "Lilac",     rgb: "200 160 240" },
];

const PRESET_EMOJI = ["✨","🔥","🌙","🌸","🍂","☕️","🎮","🎬","🦊","🐉","💎","🌊"];
// Lightweight roles the user can self-toggle. Real "official" roles are admin-only.
const PRESET_ROLES = ["Cinephile","Gamer","Night Owl","Explorer","Cozy","Lurker","Caffeinated","Bookworm"];

export function ProfileSheet({ open, onClose, viewUserId }: { open: boolean; onClose: () => void; viewUserId?: string | null }) {
  const { profile, updateProfile, signOut } = useAuth();
  const [draft, setDraft] = useState<Partial<Profile>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Profile | null>(null);
  const [loadingView, setLoadingView] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (open && profile) setDraft({});
  }, [open, profile]);

  // Load other user profile when viewing
  useEffect(() => {
    if (!open || !viewUserId) { setViewing(null); return; }
    setLoadingView(true);
    supabase.from("profiles").select("*").eq("id", viewUserId).maybeSingle().then(({ data }) => {
      setViewing((data as unknown as Profile) ?? null);
      setLoadingView(false);
    });
  }, [open, viewUserId]);

  if (!open || typeof document === "undefined") return null;

  const isView = !!viewUserId && (!profile || viewUserId !== profile.id);
  const base = isView ? viewing : profile;
  if (!base && !loadingView) return null;

  const merged = { ...(base as Profile), ...(isView ? {} : draft) };

  async function save() {
    setErr(null);
    setBusy(true);
    const { error } = await updateProfile(draft);
    setBusy(false);
    if (error) setErr(error);
    else {
      // Apply accent color globally right away.
      if (draft.accent_color && typeof document !== "undefined") {
        document.documentElement.style.setProperty("--polaris-accent", draft.accent_color);
      }
      setDraft({});
    }
  }

  function toggleRole(role: string) {
    const current = merged.roles ?? [];
    const next = current.includes(role)
      ? current.filter((r) => r !== role)
      : [...current, role];
    setDraft({ ...draft, roles: next });
  }

  async function uploadAvatar(file: File) {
    if (!profile) return;
    if (file.size > 4 * 1024 * 1024) { setErr("Image must be under 4MB."); return; }
    setUploadingAvatar(true);
    setErr(null);
    const ext = (file.name.split(".").pop() || "png").toLowerCase();
    const path = `${profile.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) { setErr("Upload failed: " + upErr.message); setUploadingAvatar(false); return; }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setDraft({ ...draft, avatar_url: data.publicUrl });
    setUploadingAvatar(false);
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[500] overflow-y-auto bg-black/85 text-white backdrop-blur-2xl animate-[fadeIn_180ms_ease]"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="fixed right-4 top-4 z-10 rounded-full bg-white/10 p-3 text-white/70 hover:bg-white/20 hover:text-white"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>
      <div className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-4 py-12 sm:px-6">
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full overflow-hidden rounded-3xl border border-white/15 bg-zinc-950/95 text-white shadow-2xl"
      >
        {loadingView && !base ? (
          <div className="grid h-64 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-white/60" /></div>
        ) : (
        <>
        {/* Banner — Discord style */}
        <div
          className="h-32 w-full"
          style={{
            background: `linear-gradient(135deg, rgba(${merged.banner_color}/0.95), rgba(${merged.accent_color}/0.7))`,
          }}
        />
        {/* Avatar */}
        <div className="relative -mt-10 px-6">
          <div
            className="relative grid h-24 w-24 place-items-center overflow-hidden rounded-2xl border-4 border-zinc-950 text-4xl shadow-xl"
            style={{ background: `rgba(${merged.accent_color}/0.95)` }}
          >
            {merged.avatar_url ? (
              <img src={merged.avatar_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <span>{merged.avatar_emoji ?? "✨"}</span>
            )}
          </div>
        </div>

        <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-5">
          <div>
            <div className="text-lg font-bold">{merged.display_name || merged.username}</div>
            <div className="text-xs text-white/50">@{merged.username} {merged.pronouns && `· ${merged.pronouns}`}</div>
            {merged.custom_role && (
              <div
                className="mt-2 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                style={{ background: `rgba(${merged.accent_color}/0.25)`, color: `rgb(${merged.accent_color})` }}
              >
                {merged.custom_role}
              </div>
            )}
            {merged.about_me && isView && (
              <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/75">{merged.about_me}</div>
            )}
            {isView && (merged.roles?.length ?? 0) > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {merged.roles.map((r) => (
                  <span key={r} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] text-white/70">{r}</span>
                ))}
              </div>
            )}
          </div>

          {!isView && <>
          {/* Avatar image upload */}
          <Field label="Profile picture">
            <div className="flex items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/80 hover:bg-white/10">
                {uploadingAvatar ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                {merged.avatar_url ? "Replace image" : "Upload image"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); e.currentTarget.value = ""; }}
                />
              </label>
              {merged.avatar_url && (
                <button
                  onClick={() => setDraft({ ...draft, avatar_url: null })}
                  className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/65 hover:bg-white/10"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              )}
            </div>
            <p className="mt-1.5 text-[10px] text-white/40">PNG/JPG up to 4MB. Overrides the emoji avatar.</p>
          </Field>

          {/* Display name */}
          <Field label="Display name">
            <input
              maxLength={32}
              value={merged.display_name ?? ""}
              onChange={(e) => setDraft({ ...draft, display_name: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm focus:outline-none"
            />
          </Field>

          <Field label="Pronouns">
            <input
              maxLength={20}
              placeholder="they/them"
              value={merged.pronouns ?? ""}
              onChange={(e) => setDraft({ ...draft, pronouns: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm focus:outline-none"
            />
          </Field>

          <Field label="About me">
            <textarea
              maxLength={190}
              rows={3}
              placeholder="Cozy nights, sci-fi films, indie games…"
              value={merged.about_me ?? ""}
              onChange={(e) => setDraft({ ...draft, about_me: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm focus:outline-none"
            />
          </Field>

          <Field label="Emoji avatar (fallback)">
            <div className="flex flex-wrap gap-1.5">
              {PRESET_EMOJI.map((e) => (
                <button
                  key={e}
                  onClick={() => setDraft({ ...draft, avatar_emoji: e })}
                  className={`grid h-9 w-9 place-items-center rounded-lg text-lg transition ${
                    merged.avatar_emoji === e ? "bg-white/20 ring-2 ring-white/40" : "bg-white/5 hover:bg-white/10"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Accent color">
            <div className="flex flex-wrap gap-1.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.rgb}
                  onClick={() => setDraft({ ...draft, accent_color: c.rgb })}
                  title={c.label}
                  className={`h-9 w-9 rounded-lg transition ${
                    merged.accent_color === c.rgb ? "ring-2 ring-white scale-110" : "hover:scale-105"
                  }`}
                  style={{ background: `rgb(${c.rgb})` }}
                />
              ))}
            </div>
          </Field>

          <Field label="Banner color">
            <div className="flex flex-wrap gap-1.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.rgb}
                  onClick={() => setDraft({ ...draft, banner_color: c.rgb })}
                  title={c.label}
                  className={`h-7 w-12 rounded-md transition ${
                    merged.banner_color === c.rgb ? "ring-2 ring-white" : ""
                  }`}
                  style={{ background: `rgb(${c.rgb})` }}
                />
              ))}
            </div>
          </Field>

          <Field label="Personal tag">
            <input
              maxLength={24}
              placeholder="e.g. tuff guy, night owl, late-night gamer"
              value={merged.custom_role ?? ""}
              onChange={(e) => setDraft({ ...draft, custom_role: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm focus:outline-none"
            />
            <p className="mt-1.5 text-[10px] text-white/40">A little label that shows under your name. Official roles are handed out by the founder.</p>
          </Field>

          <Field label="Vibe badges">
            <div className="flex flex-wrap gap-1.5">
              {PRESET_ROLES.map((r) => {
                const on = (merged.roles ?? []).includes(r);
                return (
                  <button
                    key={r}
                    onClick={() => toggleRole(r)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      on
                        ? "bg-white text-black"
                        : "border border-white/15 bg-white/5 text-white/75 hover:bg-white/10"
                    }`}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </Field>

          {err && (
            <div className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {err}
            </div>
          )}
          </>}
        </div>

        {!isView && (
        <div className="flex items-center justify-between gap-2 border-t border-white/5 bg-black/30 p-4">
          <button
            onClick={async () => {
              await signOut();
              onClose();
            }}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/75 hover:bg-white/10"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
          <button
            onClick={save}
            disabled={busy || Object.keys(draft).length === 0}
            className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-bold text-black hover:bg-white/90 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save changes
          </button>
        </div>
        )}
        </>
        )}
      </div>
      </div>
    </div>,
    document.body,
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/55">
        {label}
      </div>
      {children}
    </div>
  );
}