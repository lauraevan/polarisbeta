import { useEffect, useState } from "react";
import { Crown, Eye, EyeOff, Trash2, Save, MousePointer2, KeyRound } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { isProActive, proDaysRemaining, useHideVip } from "@/lib/pro-utils";
import { useServerFn } from "@tanstack/react-start";
import { listLayouts, saveLayout, deleteLayout } from "@/lib/customizer.functions";
import { useCustomizer } from "@/lib/customizer-context";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@tanstack/react-router";

type Layout = { id: string; name: string; document: unknown; updated_at: string };
type KeyRow = { code: string; tier: string; redeemed_at: string };

export function ProDashboard() {
  const { profile, user } = useAuth();
  const pro = isProActive(profile);
  const daysLeft = proDaysRemaining(profile);
  const [hideVip, setHideVip] = useHideVip();

  const list = useServerFn(listLayouts);
  const save = useServerFn(saveLayout);
  const del = useServerFn(deleteLayout);

  const c = useCustomizer();
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [layoutName, setLayoutName] = useState("");

  useEffect(() => {
    if (!pro || !user) return;
    list().then((rows) => setLayouts(rows as Layout[])).catch(() => setLayouts([]));
    supabase.from("pro_keys")
      .select("code,tier,redeemed_at")
      .eq("redeemed_by", user.id)
      .order("redeemed_at", { ascending: false })
      .limit(10)
      .then(({ data }) => setKeys((data ?? []) as KeyRow[]));
  }, [pro, user, list]);

  async function saveCurrent() {
    const name = layoutName.trim() || `Layout ${layouts.length + 1}`;
    setBusy(true);
    try {
      await save({ data: { name, document: c.doc } });
      const rows = (await list()) as Layout[];
      setLayouts(rows);
      setLayoutName("");
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function applyLayout(l: Layout) {
    c.loadDoc(l.document as never);
  }

  async function removeLayout(id: string) {
    if (!confirm("Delete this layout?")) return;
    await del({ data: { id } });
    setLayouts(layouts.filter((l) => l.id !== id));
  }

  if (!pro) {
    return (
      <section className="liquid-glass-themed rounded-2xl border border-amber-400/30 p-5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-amber-300 to-pink-500">
            <Crown className="h-5 w-5 text-black" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-white">Pro Dashboard</div>
            <div className="text-[11px] text-white/55">Unlock VIP controls, saved layouts, and key history.</div>
          </div>
          <Link to="/premium" className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-bold text-black hover:bg-amber-300">
            Get Pro
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="liquid-glass-themed rounded-2xl border border-amber-400/40 p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-amber-300 to-pink-500">
          <Crown className="h-5 w-5 text-black" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold text-white">Pro Dashboard</div>
          <div className="text-[11px] text-white/60">
            {daysLeft === null ? "Lifetime member" : `${daysLeft} days remaining`} · Tier: {profile?.pro_tier ?? "monthly"}
          </div>
        </div>
      </div>

      {/* VIP toggle */}
      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/10">
          {hideVip ? <EyeOff className="h-4 w-4 text-white/70" /> : <Eye className="h-4 w-4 text-amber-300" />}
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-white">VIP tag visibility</div>
          <div className="text-[11px] text-white/55">
            {hideVip ? "Your crown is hidden everywhere on this device." : "Your crown shows on your profile, sidebar, and chat."}
          </div>
        </div>
        <button
          onClick={() => setHideVip(!hideVip)}
          className={`relative h-6 w-11 rounded-full transition ${hideVip ? "bg-white/15" : "bg-amber-400"}`}
        >
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${hideVip ? "left-0.5" : "left-[22px]"}`} />
        </button>
      </div>

      {/* Saved layouts */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="mb-2 flex items-center gap-2">
          <MousePointer2 className="h-4 w-4 text-white/70" />
          <div className="text-sm font-semibold text-white">Saved Customizer layouts</div>
          <span className="ml-auto text-[10px] text-white/45">{layouts.length} / 5</span>
        </div>
        <div className="flex gap-2">
          <input
            value={layoutName}
            onChange={(e) => setLayoutName(e.target.value.slice(0, 40))}
            placeholder="Name this layout…"
            className="flex-1 rounded-lg bg-black/30 px-3 py-1.5 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-white/30"
          />
          <button
            onClick={saveCurrent}
            disabled={busy || layouts.length >= 5}
            className="flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-sm font-bold text-black hover:bg-white/90 disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" /> Save current
          </button>
        </div>
        {layouts.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {layouts.map((l) => (
              <li key={l.id} className="flex items-center gap-2 rounded-lg bg-black/20 px-3 py-2">
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-semibold text-white">{l.name}</div>
                  <div className="text-[10px] text-white/45">{new Date(l.updated_at).toLocaleString()}</div>
                </div>
                <button
                  onClick={() => applyLayout(l)}
                  className="rounded-md bg-white/10 px-2 py-1 text-[11px] font-semibold text-white hover:bg-white/20"
                >
                  Apply
                </button>
                <button
                  onClick={() => removeLayout(l.id)}
                  className="rounded-md p-1 text-white/50 hover:bg-white/10 hover:text-red-300"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pro key history */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="mb-2 flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-white/70" />
          <div className="text-sm font-semibold text-white">Redeemed keys</div>
        </div>
        {keys.length === 0 ? (
          <div className="text-[11px] text-white/50">No keys on record yet.</div>
        ) : (
          <ul className="space-y-1">
            {keys.map((k) => (
              <li key={k.code} className="flex items-center justify-between gap-2 rounded-lg bg-black/20 px-3 py-1.5 text-[11px]">
                <code className="font-mono text-white">{k.code}</code>
                <span className="text-white/55">{k.tier}</span>
                <span className="text-white/40">{new Date(k.redeemed_at).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}