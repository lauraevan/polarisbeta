import { useState } from "react";
import { User } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AuthDialog } from "./AuthDialog";
import { ProfileSheet } from "./ProfileSheet";

/** Sidebar profile button. Opens auth dialog if signed out, profile sheet if signed in. */
export function ProfileButton({ collapsed }: { collapsed: boolean }) {
  const { profile, loading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

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
          <span
            className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-md text-[13px]"
            style={{ background: `rgba(${profile.accent_color}/0.95)` }}
          >
            {profile.avatar_emoji ?? "✨"}
          </span>
        ) : (
          <User className="h-[18px] w-[18px] shrink-0" />
        )}
        {!collapsed && (
          <span className="truncate">
            {loading
              ? "…"
              : profile
                ? profile.display_name || profile.username
                : "Sign up/in to Polaris"}
          </span>
        )}
      </button>
      <AuthDialog open={authOpen} onClose={() => setAuthOpen(false)} />
      <ProfileSheet open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}