import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Save, LogOut, Loader2, Camera, Trash2, Sparkles, ImagePlus, UserPlus, UserCheck, UserX, Users, Check, VenetianMask, Crown } from "lucide-react";
import { useAuth, type Profile } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import {
  sendFriendRequest, acceptFriendRequest, removeFriend, listFriends, getFriendStatus,
  type FriendEdge,
} from "@/lib/friends.functions";
import { ProDashboard } from "@/components/polaris/premium/ProDashboard";
import { isProActive } from "@/lib/pro-utils";

const PRESET_COLORS: { label: string; rgb: string }[] = [
  { label: "Ember",  rgb: "255 140 80" },
  { label: "Sunset", rgb: "240 110 110" },
  { label: "Peach",  rgb: "255 180 130" },
  { label: "Gold",   rgb: "240 200 100" },
  { label: "Sakura", rgb: "240 150 200" },
  { label: "Aurora", rgb: "140 220 200" },
  { label: "Indigo", rgb: "140 150 240" },
  { label: "Lilac",  rgb: "200 160 240" },
];
const PRESET_EMOJI = ["✨","🔥","🌙","🌸","🍂","☕️","🎮","🎬","🦊","🐉","💎","🌊"];
const PRESET_ROLES = ["Member","Gamer","Movies","Anime","Music","Chill","Lurker","Mod"];
const PRONOUN_OPTIONS = ["None","they/them","she/her","he/him","she/they","he/they","any/all","ask me"];

export function ProfileSheet({ open, onClose, viewUserId }: { open: boolean; onClose: () => void; viewUserId?: string | null }) {
  const { profile, updateProfile, signOut } = useAuth();
  const [draft, setDraft] = useState<Partial<Profile>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Profile | null>(null);
  const [loadingView, setLoadingView] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [ownedThemes, setOwnedThemes] = useState<Array<{ id: string; name: string; accent: string; banner: string }>>([]);
  const [tab, setTab] = useState<"profile" | "chat" | "pro">("profile");

  useEffect(() => {
    if (open && profile) setDraft({});
  }, [open, profile]);

  useEffect(() => {
    if (!open || !viewUserId) { setViewing(null); return; }
    setLoadingView(true);
    supabase.from("profiles").select("*").eq("id", viewUserId).maybeSingle().then(({ data }) => {
      setViewing((data as unknown as Profile) ?? null);
      setLoadingView(false);
    });
  }, [open, viewUserId]);

  // Load owned themes for banner picker.
  useEffect(() => {
    if (!open || viewUserId || !profile) return;
    (async () => {
      const { data: inv } = await supabase.from("user_inventory").select("item_id").eq("user_id", profile.id);
      const ids = (inv ?? []).map((r) => r.item_id);
      if (!ids.length) { setOwnedThemes([]); return; }
      const { data: items } = await supabase.from("shop_items").select("id,name,kind,payload").in("id", ids);
      const themes = (items ?? [])
        .filter((i) => i.kind === "theme")
        .map((i) => {
          const p = (i.payload ?? {}) as { accent?: string; banner?: string };
          return { id: i.id, name: i.name, accent: p.accent ?? "255 140 80", banner: p.banner ?? p.accent ?? "230 110 50" };
        });
      setOwnedThemes(themes);
    })();
  }, [open, viewUserId, profile]);

  if (!open || typeof document === "undefined") return null;

  const isView = !!viewUserId && (!profile || viewUserId !== profile.id);
  const base = isView ? viewing : profile;
  if (!base && !loadingView) return null;

  const merged = { ...(base as Profile), ...(isView ? {} : draft) };
  const accent = merged.accent_color || "255 140 80";
  const banner = merged.banner_color || accent;
  const bannerUrl = merged.banner_url ?? null;
  const isPro = isProActive(merged as { pro_until?: string | null });
  const dirty = Object.keys(draft).length > 0;

  async function save() {
    setErr(null);
    setBusy(true);
    const { error } = await updateProfile(draft);
    setBusy(false);
    if (error) setErr(error);
    else {
      if (draft.accent_color && typeof document !== "undefined") {
        document.documentElement.style.setProperty("--polaris-accent", draft.accent_color);
      }
      setDraft({});
    }
  }

  function toggleRole(role: string) {
    const current = merged.roles ?? [];
    const next = current.includes(role) ? current.filter((r) => r !== role) : [...current, role];
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

  async function uploadBanner(file: File) {
    if (!profile) return;
    if (file.size > 6 * 1024 * 1024) { setErr("Banner must be under 6MB."); return; }
    setUploadingBanner(true);
    setErr(null);
    const ext = (file.name.split(".").pop() || "png").toLowerCase();
    const path = `${profile.id}/banner-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) { setErr("Upload failed: " + upErr.message); setUploadingBanner(false); return; }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setDraft({ ...draft, banner_url: data.publicUrl });
    setUploadingBanner(false);
  }

  const accentRgb = `rgb(${accent})`;
  const accentSoft = `rgba(${accent} / 0.18)`;
  const accentRing = `rgba(${accent} / 0.25)`;

  return createPortal(
    <div
      className="fixed inset-0 z-[500] overflow-y-auto bg-black/60 text-white backdrop-blur-2xl animate-[fadeIn_180ms_ease]"
      onClick={onClose}
    >
      <div
        className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 sm:px-8"
        onClick={(e) => e.stopPropagation()}
      >
        {loadingView && !base ? (
          <div className="grid h-64 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-white/60" /></div>
        ) : (
          <>
            {/* Header */}
            <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-4">
                <h1
                  className="text-2xl font-black tracking-tight sm:text-3xl"
                  style={{ color: accentRgb, textShadow: "0 2px 18px rgba(0,0,0,0.55)" }}
                >
                  {isView ? "Profile" : "Profile Settings"}
                </h1>
                {!isView && (
                  <div
                    className="flex rounded-full p-1 backdrop-blur-xl"
                    style={{ background: "rgba(0,0,0,0.45)", border: `1px solid ${accentRing}` }}
                  >
                    {(["profile", "chat", "pro"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTab(t)}
                        className="rounded-full px-4 py-1.5 text-sm font-semibold transition"
                        style={
                          tab === t
                            ? { background: accentRgb, color: "#0a0a0a" }
                            : { color: `rgba(${accent} / 0.75)` }
                        }
                      >
                        {t === "profile" ? "Profile" : t === "chat" ? "Chat Style" : "Pro"}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2.5 text-white/70 backdrop-blur-xl hover:text-white"
                style={{ background: "rgba(0,0,0,0.4)", border: `1px solid ${accentRing}` }}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,360px)]">
              {/* LEFT — form */}
              <div
                className="overflow-hidden rounded-3xl backdrop-blur-xl"
                style={{
                  background: "linear-gradient(180deg, rgba(0,0,0,0.55), rgba(0,0,0,0.35))",
                  border: `1px solid ${accentSoft}`,
                  boxShadow: `0 20px 60px -20px rgba(${accent} / 0.25)`,
                }}
              >
                <div className="space-y-6 p-6 sm:p-7">
                  {/* PHOTO */}
                  <Section label="Photo" accent={accent}>
                    <div className="relative">
                      <div
                        className={`h-32 w-full rounded-2xl ${isPro && !bannerUrl ? "pro-banner-animated" : ""}`}
                        style={{
                          background: bannerUrl
                            ? `url(${bannerUrl}) center/cover no-repeat`
                            : isPro
                              ? undefined
                              : `linear-gradient(135deg, rgb(${banner}), rgb(${accent}))`,
                          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)",
                        }}
                      >
                        {!isView && (
                          <div className="absolute right-3 top-3 flex gap-2">
                            <label
                              className="flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold text-white shadow-lg backdrop-blur-md"
                              style={{ background: "rgba(0,0,0,0.55)", border: `1px solid ${accentRing}` }}
                              title="Upload banner image"
                            >
                              {uploadingBanner ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImagePlus className="h-3 w-3" />}
                              {uploadingBanner ? "Uploading…" : "Upload banner"}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadBanner(f); e.currentTarget.value = ""; }}
                              />
                            </label>
                            {bannerUrl && (
                              <button
                                onClick={() => setDraft({ ...draft, banner_url: null })}
                                className="rounded-full p-1.5 text-white shadow-lg backdrop-blur-md"
                                style={{ background: "rgba(0,0,0,0.55)", border: `1px solid ${accentRing}` }}
                                title="Clear banner image"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="-mt-10 flex items-end gap-4 pl-2">
                        <div className="relative">
                          <div
                            className="relative grid h-20 w-20 place-items-center overflow-hidden rounded-full text-3xl shadow-2xl"
                            style={{
                              background: accentRgb,
                              boxShadow: "0 0 0 4px rgba(0,0,0,0.85), 0 12px 30px -8px rgba(0,0,0,0.6)",
                            }}
                          >
                            {merged.avatar_url ? (
                              <img src={merged.avatar_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
                            ) : (
                              <span>{merged.avatar_emoji ?? merged.username?.[0]?.toUpperCase() ?? "U"}</span>
                            )}
                          </div>
                          {!isView && (
                            <label
                              className="absolute -bottom-1 right-0 grid h-7 w-7 cursor-pointer place-items-center rounded-full shadow-lg"
                              style={{ background: accentRgb, color: "#0a0a0a" }}
                              title="Upload photo"
                            >
                              {uploadingAvatar ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); e.currentTarget.value = ""; }}
                              />
                            </label>
                          )}
                        </div>
                        <div className="min-w-0 pb-1">
                          <div className="truncate text-lg font-bold text-white">{merged.display_name || merged.username}</div>
                          <div className="truncate text-xs text-white/55">@{merged.username}</div>
                        </div>
                        {!isView && merged.avatar_url && (
                          <button
                            onClick={() => setDraft({ ...draft, avatar_url: null })}
                            className="ml-auto mb-1 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] text-white/70 hover:text-white"
                            style={{ background: "rgba(0,0,0,0.4)", border: `1px solid ${accentRing}` }}
                          >
                            <Trash2 className="h-3 w-3" /> Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </Section>

                  <Divider accent={accent} />

                  {!isView && tab === "profile" && (
                    <>
                      <Section label="Identity" accent={accent}>
                        <Field label="Display Name" hint={`${(merged.display_name ?? "").length}/15`}>
                          <Input
                            accent={accent}
                            maxLength={15}
                            value={merged.display_name ?? ""}
                            onChange={(e) => setDraft({ ...draft, display_name: e.target.value })}
                          />
                        </Field>
                        <Field label="Username">
                          <Input accent={accent} value={merged.username ?? ""} disabled />
                        </Field>
                        <Field label="Pronouns">
                          <div
                            className="relative flex items-center rounded-xl"
                            style={{ background: "rgba(0,0,0,0.55)", border: `1px solid ${accentRing}` }}
                          >
                            <select
                              value={merged.pronouns ?? "None"}
                              onChange={(e) => setDraft({ ...draft, pronouns: e.target.value === "None" ? null : e.target.value })}
                              className="w-full appearance-none bg-transparent px-3 py-2.5 text-sm text-white focus:outline-none"
                              style={{ colorScheme: "dark" }}
                            >
                              {PRONOUN_OPTIONS.map((p) => (
                                <option key={p} value={p} className="bg-zinc-900">{p}</option>
                              ))}
                            </select>
                          </div>
                        </Field>
                      </Section>

                      <Divider accent={accent} />

                      <Section label="About" accent={accent}>
                        <Field label="Status" hint={`${(merged.description ?? "").length}/60`}>
                          <Input
                            accent={accent}
                            maxLength={60}
                            placeholder="What are you up to?"
                            value={merged.description ?? ""}
                            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                          />
                        </Field>
                        <Field label="Bio" hint={`${(merged.about_me ?? "").length}/190`}>
                          <textarea
                            maxLength={190}
                            rows={3}
                            placeholder="Cozy nights, sci-fi films, indie games…"
                            value={merged.about_me ?? ""}
                            onChange={(e) => setDraft({ ...draft, about_me: e.target.value })}
                            className="w-full resize-none rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none"
                            style={{ background: "rgba(0,0,0,0.55)", border: `1px solid ${accentRing}` }}
                          />
                        </Field>
                        <Field label="Personal Tag">
                          <Input
                            accent={accent}
                            maxLength={24}
                            placeholder="night owl, late-night gamer"
                            value={merged.custom_role ?? ""}
                            onChange={(e) => setDraft({ ...draft, custom_role: e.target.value })}
                          />
                        </Field>
                      </Section>

                      <Divider accent={accent} />

                      <Section label="Appearance" accent={accent}>
                        <Field label="Accent Color">
                          <div className="flex flex-wrap gap-2">
                            {PRESET_COLORS.map((c) => (
                              <button
                                key={c.rgb}
                                onClick={() => setDraft({ ...draft, accent_color: c.rgb })}
                                title={c.label}
                                className={`h-9 w-9 rounded-xl transition ${
                                  merged.accent_color === c.rgb ? "ring-2 ring-white scale-110" : "hover:scale-105 opacity-85"
                                }`}
                                style={{ background: `rgb(${c.rgb})` }}
                              />
                            ))}
                          </div>
                        </Field>
                        <Field label="Banner Color">
                          <div className="flex flex-wrap gap-2">
                            {PRESET_COLORS.map((c) => (
                              <button
                                key={c.rgb}
                                onClick={() => setDraft({ ...draft, banner_color: c.rgb })}
                                title={c.label}
                                className={`h-7 w-14 rounded-lg transition ${
                                  merged.banner_color === c.rgb ? "ring-2 ring-white" : "opacity-85 hover:opacity-100"
                                }`}
                                style={{ background: `rgb(${c.rgb})` }}
                              />
                            ))}
                          </div>
                        </Field>
                        {ownedThemes.length > 0 && (
                          <Field label="Apply a Purchased Theme Banner">
                            <div className="flex flex-wrap gap-2">
                              {ownedThemes.map((t) => (
                                <button
                                  key={t.id}
                                  onClick={() => setDraft({ ...draft, banner_color: t.banner, accent_color: t.accent, banner_url: null })}
                                  title={t.name}
                                  className="group flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:scale-[1.02]"
                                  style={{
                                    background: `linear-gradient(135deg, rgb(${t.banner}), rgb(${t.accent}))`,
                                    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.15)",
                                  }}
                                >
                                  {t.name}
                                </button>
                              ))}
                            </div>
                          </Field>
                        )}
                        <Field label="Emoji Avatar (fallback)">
                          <div className="flex flex-wrap gap-1.5">
                            {PRESET_EMOJI.map((e) => (
                              <button
                                key={e}
                                onClick={() => setDraft({ ...draft, avatar_emoji: e, avatar_url: null })}
                                className="grid h-9 w-9 place-items-center rounded-lg text-lg transition"
                                style={{
                                  background: merged.avatar_emoji === e && !merged.avatar_url ? accentSoft : "rgba(0,0,0,0.4)",
                                  border: merged.avatar_emoji === e && !merged.avatar_url ? `1px solid ${accentRgb}` : "1px solid transparent",
                                }}
                              >
                                {e}
                              </button>
                            ))}
                          </div>
                        </Field>
                      </Section>

                      <Divider accent={accent} />

                      <Section label="Roles" accent={accent}>
                        <div className="flex flex-wrap gap-1.5">
                          {PRESET_ROLES.map((r) => {
                            const on = (merged.roles ?? []).includes(r);
                            return (
                              <button
                                key={r}
                                onClick={() => toggleRole(r)}
                                className="rounded-full px-3 py-1 text-xs font-semibold transition"
                                style={
                                  on
                                    ? { background: accentRgb, color: "#0a0a0a" }
                                    : { background: "rgba(0,0,0,0.4)", color: "rgba(255,255,255,0.75)", border: `1px solid ${accentRing}` }
                                }
                              >
                                {r}
                              </button>
                            );
                          })}
                        </div>
                      </Section>
                    </>
                  )}

                  {!isView && tab === "chat" && (
                    <Section label="Chat Style" accent={accent}>
                      <p className="text-sm text-white/65">
                        Your accent color already styles your chat name and bubbles.
                        More options like message font, bubble shape, and signature
                        emoji are coming soon.
                      </p>
                      <div className="flex items-center gap-2 text-xs text-white/55">
                        <Sparkles className="h-3.5 w-3.5" style={{ color: accentRgb }} />
                        Live preview is on the right.
                      </div>
                    </Section>
                  )}

                  {!isView && tab === "pro" && (
                    <Section label="Pro Dashboard" accent={accent}>
                      <div className="-mx-1"><ProDashboard /></div>
                    </Section>
                  )}

                  {!isView && tab === "profile" && (
                    <>
                      <Divider accent={accent} />
                      <Section label="Privacy" accent={accent}>
                        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-2.5"
                          style={{ background: "rgba(0,0,0,0.4)", borderColor: accentRing }}>
                          <span className="flex items-center gap-2 text-sm text-white/85">
                            <VenetianMask className="h-4 w-4" style={{ color: accentRgb }} />
                            Browse anonymously
                            <span className="text-[10px] text-white/45">Hides your name & avatar across Polaris</span>
                          </span>
                          <input
                            type="checkbox"
                            checked={!!merged.is_anonymous}
                            onChange={(e) => setDraft({ ...draft, is_anonymous: e.target.checked })}
                            className="h-4 w-4 accent-[rgb(var(--polaris-accent))]"
                          />
                        </label>
                      </Section>
                    </>
                  )}

                  {isView && (
                    <Section label="About" accent={accent}>
                      {merged.about_me ? (
                        <p className="text-sm text-white/80">{merged.about_me}</p>
                      ) : (
                        <p className="text-sm italic text-white/40">No bio yet.</p>
                      )}
                      {(merged.roles?.length ?? 0) > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {merged.roles.map((r) => (
                            <span
                              key={r}
                              className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                              style={{ background: accentSoft, color: accentRgb }}
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      )}
                    </Section>
                  )}

                  {isView && profile && viewUserId && viewUserId !== profile.id && (
                    <FriendButton otherId={viewUserId} accent={accent} />
                  )}

                  {!isView && (
                    <FriendsPanel accent={accent} />
                  )}

                  {err && (
                    <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                      {err}
                    </div>
                  )}
                </div>

                {!isView && (
                  <div
                    className="flex items-center justify-between gap-2 p-4"
                    style={{ background: "rgba(0,0,0,0.4)", borderTop: `1px solid ${accentSoft}` }}
                  >
                    <button
                      onClick={async () => { await signOut(); onClose(); }}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-white/70 hover:text-white"
                      style={{ background: "rgba(0,0,0,0.3)", border: `1px solid ${accentSoft}` }}
                    >
                      <LogOut className="h-3.5 w-3.5" /> Sign out
                    </button>
                    <button
                      onClick={save}
                      disabled={busy || !dirty}
                      className="flex items-center gap-2 rounded-lg px-5 py-2 text-xs font-bold transition disabled:opacity-40"
                      style={{ background: accentRgb, color: "#0a0a0a", boxShadow: `0 10px 30px -10px rgba(${accent} / 0.6)` }}
                    >
                      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      Save changes
                    </button>
                  </div>
                )}
              </div>

              {/* RIGHT — preview */}
              <aside className="lg:sticky lg:top-8 lg:self-start">
                <div
                  className="overflow-hidden rounded-3xl backdrop-blur-xl"
                  style={{
                    background: "linear-gradient(180deg, rgba(0,0,0,0.55), rgba(0,0,0,0.35))",
                    border: `1px solid ${accentSoft}`,
                  }}
                >
                  <div
                    className="px-5 pt-4 text-[10px] font-bold uppercase tracking-[0.3em]"
                    style={{ color: `rgba(${accent} / 0.8)` }}
                  >
                    Preview
                  </div>
                  <div className="p-5 pt-3">
                    {/* Profile card preview */}
                    <div
                      className="overflow-hidden rounded-2xl"
                      style={{ background: "rgba(0,0,0,0.55)", border: `1px solid ${accentRing}` }}
                    >
                      <div
                        className="h-16"
                        style={{
                          background: bannerUrl
                            ? `url(${bannerUrl}) center/cover no-repeat`
                            : `linear-gradient(135deg, rgb(${banner}), rgb(${accent}))`,
                        }}
                      />
                      <div className="relative -mt-7 px-4 pb-4">
                        <div
                          className="grid h-14 w-14 place-items-center overflow-hidden rounded-full text-xl shadow-lg"
                          style={{ background: accentRgb, boxShadow: "0 0 0 4px rgba(0,0,0,0.85)" }}
                        >
                          {merged.avatar_url ? (
                            <img src={merged.avatar_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span>{merged.avatar_emoji ?? merged.username?.[0]?.toUpperCase() ?? "U"}</span>
                          )}
                        </div>
                        <div className="mt-2.5 flex flex-wrap items-center gap-2">
                          <span className="text-base font-extrabold text-white">{merged.display_name || merged.username}</span>
                          <span
                            className="rounded-md px-1.5 py-0.5 text-[10px] font-medium"
                            style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.75)" }}
                          >
                            @everyone
                          </span>
                        </div>
                        <div className="text-xs text-white/55">@{merged.username}</div>
                        {merged.description && (
                          <div className="mt-1.5 text-xs" style={{ color: accentRgb }}>{merged.description}</div>
                        )}
                        {merged.about_me && (
                          <div className="mt-2 text-xs text-white/70">{merged.about_me}</div>
                        )}
                        {merged.custom_role && (
                          <span
                            className="mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold"
                            style={{ background: accentSoft, color: accentRgb }}
                          >
                            {merged.custom_role}
                          </span>
                        )}
                        {!isView && (
                          <div className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-white/45">
                            This is you
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Chat message preview */}
                    <div
                      className="mt-4 flex items-start gap-2.5 rounded-2xl p-3"
                      style={{ background: "rgba(0,0,0,0.4)", border: `1px solid ${accentSoft}` }}
                    >
                      <div
                        className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full text-sm"
                        style={{ background: accentRgb }}
                      >
                        {merged.avatar_url ? (
                          <img src={merged.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span>{merged.avatar_emoji ?? merged.username?.[0]?.toUpperCase() ?? "U"}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-bold" style={{ color: accentRgb }}>
                            {merged.display_name || merged.username}
                          </span>
                          <span className="text-[10px] text-white/40">now</span>
                        </div>
                        <div className="text-xs text-white/80">hey, this is how your messages will look ✨</div>
                      </div>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

function Section({ label, accent, children }: { label: string; accent: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div
        className="text-[10px] font-bold uppercase tracking-[0.3em]"
        style={{ color: `rgba(${accent} / 0.8)` }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function Divider({ accent }: { accent: string }) {
  return <div className="h-px w-full" style={{ background: `rgba(${accent} / 0.15)` }} />;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <div className="text-xs font-medium text-white/80">{label}</div>
        {hint && <div className="text-[10px] text-white/40">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function Input({ accent, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { accent: string }) {
  return (
    <input
      {...props}
      className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none disabled:opacity-60"
      style={{
        background: "rgba(0,0,0,0.55)",
        border: `1px solid rgba(${accent} / 0.25)`,
      }}
    />
  );
}

function FriendButton({ otherId, accent }: { otherId: string; accent: string }) {
  const getStatus = useServerFn(getFriendStatus);
  const sendReq = useServerFn(sendFriendRequest);
  const accept = useServerFn(acceptFriendRequest);
  const remove = useServerFn(removeFriend);
  const [state, setState] = useState<"loading" | "none" | "outgoing" | "incoming" | "friends" | "self">("loading");
  const [edgeId, setEdgeId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const r = await getStatus({ data: { otherId } });
    setState(r.state);
    setEdgeId(r.id);
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [otherId]);

  if (state === "self") return null;
  const accentRgb = `rgb(${accent})`;
  const ring = `rgba(${accent} / 0.4)`;

  const action = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try { await fn(); await load(); } catch (e) { console.error(e); }
    finally { setBusy(false); }
  };

  return (
    <Section label="Friend" accent={accent}>
      <div className="flex flex-wrap gap-2">
        {state === "loading" && <Loader2 className="h-4 w-4 animate-spin text-white/50" />}
        {state === "none" && (
          <button disabled={busy} onClick={() => action(() => sendReq({ data: { username: "" } /* unused */ }).catch(async () => {
            // fallback: we need username; fetch from profile we already loaded via parent? simpler: send by username via id-based fn
          }))} className="hidden" />
        )}
        {state === "none" && (
          <FriendByIdButton otherId={otherId} accentRgb={accentRgb} ring={ring} onDone={load} />
        )}
        {state === "outgoing" && (
          <button disabled={busy} onClick={() => action(() => remove({ data: { otherId } }))}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white/80 hover:text-white"
            style={{ background: "rgba(0,0,0,0.4)", border: `1px solid ${ring}` }}>
            <UserX className="h-3.5 w-3.5" /> Cancel request
          </button>
        )}
        {state === "incoming" && edgeId && (
          <>
            <button disabled={busy} onClick={() => action(() => accept({ data: { friendshipId: edgeId } }))}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold"
              style={{ background: accentRgb, color: "#0a0a0a" }}>
              <Check className="h-3.5 w-3.5" /> Accept
            </button>
            <button disabled={busy} onClick={() => action(() => remove({ data: { otherId } }))}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white/80"
              style={{ background: "rgba(0,0,0,0.4)", border: `1px solid ${ring}` }}>
              <UserX className="h-3.5 w-3.5" /> Decline
            </button>
          </>
        )}
        {state === "friends" && (
          <>
            <span className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold"
              style={{ background: accentRgb, color: "#0a0a0a" }}>
              <UserCheck className="h-3.5 w-3.5" /> Friends
            </span>
            <button disabled={busy} onClick={() => action(() => remove({ data: { otherId } }))}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white/80"
              style={{ background: "rgba(0,0,0,0.4)", border: `1px solid ${ring}` }}>
              <UserX className="h-3.5 w-3.5" /> Unfriend
            </button>
          </>
        )}
      </div>
    </Section>
  );
}

function FriendByIdButton({ otherId, accentRgb, ring, onDone }: { otherId: string; accentRgb: string; ring: string; onDone: () => void }) {
  const sendReq = useServerFn(sendFriendRequest);
  const [busy, setBusy] = useState(false);
  const click = async () => {
    setBusy(true);
    try {
      const { data: p } = await supabase.from("profiles").select("username").eq("id", otherId).maybeSingle();
      if (p?.username) await sendReq({ data: { username: p.username } });
      onDone();
    } catch (e) { console.error(e); }
    finally { setBusy(false); }
  };
  return (
    <button disabled={busy} onClick={click}
      className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold"
      style={{ background: accentRgb, color: "#0a0a0a", boxShadow: `0 8px 22px -10px ${ring}` }}>
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
      Add Friend
    </button>
  );
}

function FriendsPanel({ accent }: { accent: string }) {
  const list = useServerFn(listFriends);
  const accept = useServerFn(acceptFriendRequest);
  const remove = useServerFn(removeFriend);
  const [edges, setEdges] = useState<FriendEdge[] | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try { const r = await list(); setEdges(r.edges); } catch { setEdges([]); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const action = async (fn: () => Promise<unknown>) => {
    setBusy(true); try { await fn(); await load(); } finally { setBusy(false); }
  };

  const accentRgb = `rgb(${accent})`;
  const ring = `rgba(${accent} / 0.25)`;
  const friends = edges?.filter((e) => e.status === "accepted") ?? [];
  const incoming = edges?.filter((e) => e.direction === "incoming") ?? [];
  const outgoing = edges?.filter((e) => e.direction === "outgoing") ?? [];

  return (
    <Section label="Friends" accent={accent}>
      {edges === null ? (
        <Loader2 className="h-4 w-4 animate-spin text-white/50" />
      ) : edges.length === 0 ? (
        <p className="text-sm italic text-white/40">No friends yet — open someone's profile to add them.</p>
      ) : (
        <div className="space-y-3">
          {incoming.length > 0 && (
            <div>
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/55">Requests</div>
              <div className="space-y-1.5">
                {incoming.map((e) => (
                  <Row key={e.id} edge={e} accent={accent}>
                    <button disabled={busy} onClick={() => action(() => accept({ data: { friendshipId: e.id } }))}
                      className="rounded-lg px-3 py-1 text-[11px] font-bold" style={{ background: accentRgb, color: "#0a0a0a" }}>
                      Accept
                    </button>
                    <button disabled={busy} onClick={() => action(() => remove({ data: { otherId: e.other_id } }))}
                      className="rounded-lg px-3 py-1 text-[11px] font-bold text-white/75"
                      style={{ background: "rgba(0,0,0,0.4)", border: `1px solid ${ring}` }}>
                      Decline
                    </button>
                  </Row>
                ))}
              </div>
            </div>
          )}
          {friends.length > 0 && (
            <div>
              <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/55">
                <Users className="h-3 w-3" /> Friends ({friends.length})
              </div>
              <div className="space-y-1.5">
                {friends.map((e) => (
                  <Row key={e.id} edge={e} accent={accent}>
                    <button disabled={busy} onClick={() => action(() => remove({ data: { otherId: e.other_id } }))}
                      className="rounded-lg px-3 py-1 text-[11px] font-bold text-white/75"
                      style={{ background: "rgba(0,0,0,0.4)", border: `1px solid ${ring}` }}>
                      Unfriend
                    </button>
                  </Row>
                ))}
              </div>
            </div>
          )}
          {outgoing.length > 0 && (
            <div>
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/55">Sent</div>
              <div className="space-y-1.5">
                {outgoing.map((e) => (
                  <Row key={e.id} edge={e} accent={accent}>
                    <button disabled={busy} onClick={() => action(() => remove({ data: { otherId: e.other_id } }))}
                      className="rounded-lg px-3 py-1 text-[11px] font-bold text-white/75"
                      style={{ background: "rgba(0,0,0,0.4)", border: `1px solid ${ring}` }}>
                      Cancel
                    </button>
                  </Row>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Section>
  );
}

function Row({ edge, accent, children }: { edge: FriendEdge; accent: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-xl px-3 py-2"
      style={{ background: "rgba(0,0,0,0.4)", border: `1px solid rgba(${accent} / 0.15)` }}>
      <div className="grid h-8 w-8 place-items-center overflow-hidden rounded-full text-base"
        style={{ background: `rgb(${accent})`, color: "#0a0a0a" }}>
        {edge.other_avatar_url
          ? <img src={edge.other_avatar_url} alt="" className="h-full w-full object-cover" />
          : <span>{edge.other_avatar_emoji ?? edge.other_username[0]?.toUpperCase() ?? "U"}</span>}
      </div>
      <div className="flex-1 truncate text-sm font-semibold text-white">@{edge.other_username}</div>
      <div className="flex gap-1.5">{children}</div>
    </div>
  );
}
