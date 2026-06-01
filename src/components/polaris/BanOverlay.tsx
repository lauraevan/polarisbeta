import { useAuth } from "@/lib/auth-context";
import { ShieldAlert } from "lucide-react";
import { useRouterState } from "@tanstack/react-router";

/**
 * Soft-ban surface: only renders inside chat surfaces (passed via wrap-around).
 * For app-wide subtle indicator, see useAuth().profile.is_banned.
 */
export function BanOverlay() {
  const { profile, signOut } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const banned = (profile as { is_banned?: boolean; ban_reason?: string | null } | null);
  // Soft ban: only block chat surfaces.
  if (!banned?.is_banned) return null;
  if (!path.startsWith("/chat")) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-6">
      <div className="liquid-glass-strong max-w-md rounded-3xl p-8 text-center">
        <ShieldAlert className="mx-auto h-14 w-14 text-red-400" />
        <h1 className="mt-4 text-2xl font-black text-white">You have been banned in Polaris One</h1>
        <p className="mt-3 text-sm text-white/75">
          Reason: <span className="font-semibold text-white">{banned.ban_reason || "No reason provided."}</span>
        </p>
        <p className="mt-4 text-xs text-white/55">
          You cannot send messages, post in chat, or send DMs. Other features remain accessible.
        </p>
        <button
          onClick={signOut}
          className="mt-6 rounded-xl bg-white px-5 py-2 text-sm font-semibold text-black hover:bg-white/90"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}