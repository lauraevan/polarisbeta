import { useEffect, useState } from "react";
import { X, Save, LogOut, Loader2 } from "lucide-react";
import { useAuth, type Profile } from "@/lib/auth-context";

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
const PRESET_ROLES = ["Member","Cinephile","Gamer","Otaku","Night Owl","Explorer","Beta Tester","Founder"];

export function ProfileSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile, updateProfile, signOut } = useAuth();
  const [draft, setDraft] = useState<Partial<Profile>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open && profile) setDraft({});
  }, [open, profile]);

  if (!open || !profile) return null;

  const merged = { ...profile, ...draft };

  async function save() {
    setErr(null);
    setBusy(true);
    const { error } = await updateProfile(draft);
    setBusy(false);
    if (error) setErr(error);
    else setDraft({});
  }

  function toggleRole(role: string) {
    const current = merged.roles ?? [];
    const next = current.includes(role)
      ? current.filter((r) => r !== role)
      : [...current, role];
    setDraft({ ...draft, roles: next });
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-2xl animate-[fadeIn_180ms_ease]"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/15 bg-zinc-950 text-white shadow-2xl"
      >
        {/* Banner — Discord style */}
        <div
          className="h-28 w-full"
          style={{
            background: `linear-gradient(135deg, rgba(${merged.banner_color}/0.95), rgba(${merged.accent_color}/0.7))`,
          }}
        />
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-black/40 p-2 text-white/80 hover:bg-black/60"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Avatar */}
        <div className="relative -mt-10 px-6">
          <div
            className="grid h-20 w-20 place-items-center rounded-2xl border-4 border-zinc-950 text-4xl shadow-xl"
            style={{ background: `rgba(${merged.accent_color}/0.95)` }}
          >
            {merged.avatar_emoji ?? "✨"}
          </div>
        </div>

        <div className="max-h-[60vh] space-y-5 overflow-y-auto px-6 py-5">
          <div>
            <div className="text-lg font-bold">{merged.display_name || merged.username}</div>
            <div className="text-xs text-white/50">@{merged.username} {merged.pronouns && `· ${merged.pronouns}`}</div>
          </div>

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

          <Field label="Avatar">
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

          <Field label="Roles">
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
        </div>

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
      </div>
    </div>
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