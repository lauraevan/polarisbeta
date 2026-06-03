import { useState } from "react";
import { User, Crown } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AuthDialog } from "./AuthDialog";
import { ProfileSheet } from "./ProfileSheet";
import { useHideVip, isProActive } from "@/lib/pro-utils";

/** Sidebar profile button. Opens auth dialog if signed out, profile sheet if signed in. */
export function ProfileButton({ collapsed }: { collapsed: boolean }) {
  const { profile, loading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [hideVip] = useHideVip();
  const isPro = isProActive(profile) && !hideVip;

  return (
    <>
      <button
        onClick={() => (profile ? setProfileOpen(true) : setAuthOpen(true))}
        title={collapsed ? (profile ? profile.display_name || profile.username : "Sign up/in to Polaris") : undefined}
        className={`flex w-full items-center rounded-xl text-sm text-white/70 transition hover:bg-white/5 hover:text-white ${
          collapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2"
        }`}
      >
        {profile ? (
          <span className="relative shrink-0">
            <span
              className="grid h-[22px] w-[22px] place-items-center overflow-hidden rounded-md text-[13px]"
              style={{ background: `rgba(${profile.accent_color}/0.95)` }}
            >
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <span>{profile.avatar_emoji ?? "✨"}</span>
              )}
            </span>
            {isPro && (
              <span
                title="Polaris Pro — VIP"
                className="absolute -right-1.5 -top-1.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-gradient-to-br from-amber-300 to-amber-600 ring-1 ring-black/40"
              >
                <Crown className="h-2 w-2 text-black" />
              </span>
            )}
          </span>
        ) : (
          <User className="h-[18px] w-[18px] shrink-0" />
        )}
        {!collapsed && (
          <span className="flex min-w-0 items-center gap-1.5">
            <span className={`truncate ${isPro ? "pro-username-glow" : ""}`}>
              {loading
                ? "…"
                : profile
                  ? profile.display_name || profile.username
                  : "Sign up/in to Polaris"}
            </span>
            {isPro && (
              <span className="inline-flex items-center gap-0.5 rounded-md bg-gradient-to-r from-amber-400 to-amber-600 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-black">
                <Crown className="h-2.5 w-2.5" /> VIP
              </span>
            )}
          </span>
        )}
      </button>
      <AuthDialog open={authOpen} onClose={() => setAuthOpen(false)} />
      <ProfileSheet open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}