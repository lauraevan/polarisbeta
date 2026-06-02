import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useRouterState } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { recordVisitAndCheckBan } from "@/lib/security/security.functions";
import { getDeviceFingerprint } from "@/lib/security/device-fingerprint";
import { BannedScreen } from "./BannedScreen";

type Ban = {
  ban_id: string;
  type: "full_site" | "chat_only" | "dm_only" | "shadow";
  reason: string;
  expires_at: string | null;
  created_at: string;
};

/**
 * Runs on every mount + auth change. Records a visit, detects new devices,
 * and blocks the whole app if a full_site/shadow ban matches.
 * Chat/DM bans don't block here — they're enforced by their own surfaces.
 */
export function BanGate() {
  const { user, profile, loading } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const record = useServerFn(recordVisitAndCheckBan);
  const [ban, setBan] = useState<Ban | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    (async () => {
      try {
        const fp = getDeviceFingerprint();
        const res = await record({
          data: {
            deviceFingerprint: fp,
            userId: user?.id ?? null,
            username: profile?.username ?? null,
            path,
          },
        });
        if (cancelled) return;
        if (res.isNewDevice && user) {
          toast("New device signed in", {
            description: "If this wasn't you, change your password immediately.",
          });
        }
        if (res.ban && (res.ban.type === "full_site" || res.ban.type === "shadow")) {
          setBan(res.ban as Ban);
        } else {
          setBan(null);
        }
      } catch {
        // Fail open — don't lock people out on transient errors.
      } finally {
        if (!cancelled) setChecked(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // Re-check on user change. Don't re-fire on every route nav.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, loading]);

  if (!checked || !ban) return null;
  return <BannedScreen ban={ban} />;
}