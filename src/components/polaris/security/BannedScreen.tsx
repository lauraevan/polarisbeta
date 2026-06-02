import { useState } from "react";
import { ShieldAlert, Send } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { submitBanAppeal } from "@/lib/security/security.functions";
import { getDeviceFingerprint } from "@/lib/security/device-fingerprint";
import { useAuth } from "@/lib/auth-context";

type Ban = {
  ban_id: string;
  type: "full_site" | "chat_only" | "dm_only" | "shadow";
  reason: string;
  expires_at: string | null;
  created_at: string;
};

export function BannedScreen({ ban }: { ban: Ban }) {
  const { user, signOut } = useAuth();
  const submit = useServerFn(submitBanAppeal);
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const expiresLabel = ban.expires_at
    ? new Date(ban.expires_at).toLocaleString()
    : "Permanent";

  const send = async () => {
    setErr(null);
    if (msg.trim().length < 10) {
      setErr("Appeal must be at least 10 characters.");
      return;
    }
    try {
      await submit({
        data: {
          banId: ban.ban_id,
          deviceFingerprint: getDeviceFingerprint(),
          userId: user?.id ?? null,
          message: msg.trim(),
        },
      });
      setSent(true);
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] grid place-items-center bg-gradient-to-br from-[#0a0008] via-[#150004] to-[#000] p-4 text-white">
      <div className="w-full max-w-lg rounded-3xl border border-red-500/30 bg-black/60 p-8 shadow-[0_30px_120px_-30px_rgba(255,0,40,0.4)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-red-500/20 ring-1 ring-red-500/40">
            <ShieldAlert className="h-7 w-7 text-red-300" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-red-300/80">Access denied</div>
            <h1 className="text-2xl font-black">You have been banned</h1>
          </div>
        </div>

        <div className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
          <Row label="Type" value={ban.type === "full_site" ? "Full site ban" : ban.type === "chat_only" ? "Chat ban" : ban.type === "dm_only" ? "DM ban" : "Restricted"} />
          <Row label="Reason" value={ban.reason} />
          <Row label="Issued" value={new Date(ban.created_at).toLocaleString()} />
          <Row label="Expires" value={expiresLabel} />
        </div>

        <div className="mt-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-white/55">
            {sent ? "Appeal submitted" : "Submit an appeal"}
          </div>
          {sent ? (
            <p className="mt-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
              The owner will review your appeal. You can leave this page.
            </p>
          ) : (
            <>
              <textarea
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                placeholder="Explain why this ban should be lifted…"
                rows={4}
                className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-black/40 p-3 text-sm outline-none focus:border-white/30"
              />
              {err && <p className="mt-1 text-xs text-red-300">{err}</p>}
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={send}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-400"
                >
                  <Send className="h-4 w-4" /> Submit appeal
                </button>
                {user && (
                  <button
                    onClick={signOut}
                    className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20"
                  >
                    Sign out
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        <p className="mt-6 text-[11px] text-white/40">
          Evasion attempts (VPN, proxy, new device, new account) are logged and will extend or strengthen this ban.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="text-[11px] uppercase tracking-wider text-white/45">{label}</div>
      <div className="max-w-[60%] text-right text-sm">{value}</div>
    </div>
  );
}