import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "./auth-context";

// Device-local key — admin panel re-appears on this device until user logs out
// of the admin panel explicitly. Profile.is_owner is the server source of truth.
const LS_KEY = "polaris.admin.unlocked.v1";

type Ctx = {
  /** True when this device has been unlocked AND the user's profile says is_owner. */
  isAdmin: boolean;
  /** True if profile.is_owner regardless of device flag (for badges). */
  isOwner: boolean;
  unlock: () => void;
  lock: () => void;
};

const AdminCtx = createContext<Ctx | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [deviceUnlocked, setDeviceUnlocked] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDeviceUnlocked(localStorage.getItem(LS_KEY) === "1");
  }, []);

  const isOwner = !!(profile as { is_owner?: boolean } | null)?.is_owner;
  const isAdmin = isOwner && deviceUnlocked;

  const unlock = useCallback(() => {
    localStorage.setItem(LS_KEY, "1");
    setDeviceUnlocked(true);
  }, []);
  const lock = useCallback(() => {
    localStorage.removeItem(LS_KEY);
    setDeviceUnlocked(false);
  }, []);

  return (
    <AdminCtx.Provider value={useMemo(() => ({ isAdmin, isOwner, unlock, lock }), [isAdmin, isOwner, unlock, lock])}>
      {children}
    </AdminCtx.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminCtx);
  if (!ctx) throw new Error("useAdmin must be used inside AdminProvider");
  return ctx;
}