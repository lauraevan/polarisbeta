import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Crown, Check, Sparkles, Music, Palette, Headphones, Copy } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { redeemProKey, generateProKey } from "@/lib/pro.functions";
import { toast } from "sonner";

function isProActive(profile: { pro_until?: string | null } | null) {
  if (!profile?.pro_until) return false;
  const t = Date.parse(profile.pro_until);
  return Number.isNaN(t) ? true : t > Date.now();
}

const PERKS = [
  { icon: Music, label: "Music gapless + crossfade", text: "Seamless Vapor playback, no gaps." },
  { icon: Headphones, label: "Lyric sync premium", text: "Time-locked karaoke-style lyrics." },
  { icon: Palette, label: "Custom theming", text: "Premium fonts, glow accents, profile flair." },
  { icon: Sparkles, label: "Early access", text: "Try new Polaris features first." },
];

export function Premium() {
  const { profile, refreshProfile } = useAuth();
  const redeem = useServerFn(redeemProKey);
  const generate = useServerFn(generateProKey);
  const pro = isProActive(profile);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [genTier, setGenTier] = useState<"monthly" | "lifetime">("monthly");
  const [genDays, setGenDays] = useState(30);
  const [genResult, setGenResult] = useState<string | null>(null);

  async function onRedeem(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) {
      toast.error("Sign in first.");
      return;
    }
    if (!code.trim()) return;
    setBusy(true);
    try {
      const r = await redeem({ data: { code: code.trim() } });
      if (r.ok) {
        toast.success(`You're now Polaris Pro (${r.tier}).`);
        setCode("");
        await refreshProfile();
      } else {
        toast.error(`Couldn't redeem: ${r.error}`);
      }
    } finally {
      setBusy(false);
    }
  }

  async function onGenerate() {
    setBusy(true);
    try {
      const r = await generate({
        data: { tier: genTier, duration_days: genTier === "monthly" ? genDays : undefined, source: "manual" },
      });
      if (r.ok) {
        setGenResult(r.code);
        toast.success("Key generated");
      } else {
        toast.error(r.error || "Failed");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-10 text-white">
      <div className="mb-8 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 to-pink-500">
          <Crown className="h-6 w-6 text-black" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Polaris Pro</h1>
          <div className="text-sm text-white/60">Unlock the full Polaris One experience.</div>
        </div>
      </div>

      {pro && (
        <div className="mb-8 rounded-2xl border border-amber-400/40 bg-gradient-to-r from-amber-500/10 to-pink-500/10 p-5">
          <div className="flex items-center gap-2 text-amber-300">
            <Check className="h-5 w-5" />
            <span className="font-semibold">You're Polaris Pro</span>
            <span className="ml-2 rounded-full bg-amber-400/20 px-2 py-0.5 text-xs uppercase">
              {profile?.pro_tier ?? "active"}
            </span>
          </div>
          {profile?.pro_until && profile.pro_tier !== "lifetime" && (
            <div className="mt-1 text-sm text-white/70">
              Valid until {new Date(profile.pro_until).toLocaleDateString()}
            </div>
          )}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Perks */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">What you get</h2>
          {PERKS.map((p) => (
            <div key={p.label} className="flex items-start gap-3 rounded-xl bg-white/5 p-3">
              <div className="mt-0.5 grid h-8 w-8 place-items-center rounded-lg bg-amber-400/15 text-amber-300">
                <p.icon className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-medium">{p.label}</div>
                <div className="text-xs text-white/55">{p.text}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Redeem */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Have a key?</h2>
          <form onSubmit={onRedeem} className="space-y-3 rounded-2xl bg-white/5 p-4">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="POL-XXXX-XXXX-XXXX"
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-sm tracking-wider focus:border-amber-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={busy || !code.trim()}
              className="w-full rounded-lg bg-gradient-to-r from-amber-400 to-pink-500 px-4 py-2 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Redeeming…" : "Redeem key"}
            </button>
            <p className="text-xs text-white/45">
              Keys are delivered via Ko-fi (coming soon). Each key works once and is locked to your
              account.
            </p>
          </form>

          {profile?.is_owner && (
            <div className="space-y-3 rounded-2xl border border-amber-400/30 bg-amber-400/5 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-300">
                <Crown className="h-4 w-4" /> Owner — Generate key
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={genTier}
                  onChange={(e) => setGenTier(e.target.value as "monthly" | "lifetime")}
                  className="rounded-lg bg-black/30 px-3 py-2 text-sm"
                >
                  <option value="monthly">Monthly</option>
                  <option value="lifetime">Lifetime</option>
                </select>
                {genTier === "monthly" && (
                  <input
                    type="number"
                    value={genDays}
                    onChange={(e) => setGenDays(Math.max(1, Number(e.target.value) || 30))}
                    className="w-24 rounded-lg bg-black/30 px-3 py-2 text-sm"
                  />
                )}
                <button
                  onClick={onGenerate}
                  disabled={busy}
                  className="rounded-lg bg-amber-400 px-3 py-2 text-sm font-semibold text-black hover:bg-amber-300 disabled:opacity-50"
                >
                  Generate
                </button>
              </div>
              {genResult && (
                <div className="flex items-center justify-between rounded-lg bg-black/40 px-3 py-2 font-mono text-sm">
                  <span>{genResult}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(genResult);
                      toast.success("Copied");
                    }}
                    className="rounded p-1 hover:bg-white/10"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
