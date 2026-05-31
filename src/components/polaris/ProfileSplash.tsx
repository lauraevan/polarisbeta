import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

/**
 * One-time "Logging into profile…" splash shown when entering Games / Media
 * after sign-in. Uses sessionStorage so it doesn't repeat on tab switches.
 */
export function ProfileSplash({ tag }: { tag: string }) {
  const { profile, loading } = useAuth();
  const key = `polaris-splash-${tag}`;
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!profile) return;
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    setShow(true);
    const t = setTimeout(() => setShow(false), 1400);
    return () => clearTimeout(t);
  }, [profile, loading, key]);

  if (!show || !profile) return null;
  return (
    <div
      className="fixed inset-0 z-[180] flex items-center justify-center bg-black/80 backdrop-blur-2xl animate-[fadeIn_220ms_ease]"
    >
      <div
        className="flex flex-col items-center gap-4 px-8 py-7 rounded-3xl border border-white/15"
        style={{
          background: `linear-gradient(160deg, rgba(${profile.accent_color}/0.25), rgba(15,12,10,0.92))`,
        }}
      >
        <div
          className="grid h-16 w-16 place-items-center rounded-2xl text-3xl shadow-xl"
          style={{ background: `rgba(${profile.accent_color}/0.95)` }}
        >
          {profile.avatar_emoji ?? "✨"}
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-[0.3em] text-white/55">
            Logging into profile
          </div>
          <div className="mt-1 text-lg font-bold text-white">
            {profile.display_name || profile.username}
          </div>
        </div>
        <Loader2 className="h-4 w-4 animate-spin text-white/70" />
      </div>
    </div>
  );
}