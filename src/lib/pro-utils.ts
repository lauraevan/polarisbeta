import { useEffect, useState } from "react";
import { safeGetItem, safeSetItem } from "@/lib/safe-storage";

export type ProProfile = { pro_until?: string | null; pro_tier?: string | null } | null;

/** Centralized Pro check used across the app. */
export function isProActive(profile: ProProfile): boolean {
  if (!profile?.pro_until) return false;
  const t = Date.parse(profile.pro_until);
  if (Number.isNaN(t)) return true; // infinity / lifetime
  return t > Date.now();
}

/** Days remaining on Pro. `null` for lifetime, `0` if expired. */
export function proDaysRemaining(profile: ProProfile): number | null {
  if (!profile?.pro_until) return 0;
  const t = Date.parse(profile.pro_until);
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.ceil((t - Date.now()) / 86_400_000));
}

const HIDE_VIP_KEY = "polaris:pro:hide_vip";

/** Per-device toggle so Pro users can hide their VIP tag site-wide. */
export function useHideVip(): [boolean, (v: boolean) => void] {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    setHidden(safeGetItem("localStorage", HIDE_VIP_KEY) === "1");
    const onChange = () => setHidden(safeGetItem("localStorage", HIDE_VIP_KEY) === "1");
    window.addEventListener("polaris:hide-vip-changed", onChange);
    return () => window.removeEventListener("polaris:hide-vip-changed", onChange);
  }, []);
  const set = (v: boolean) => {
    safeSetItem("localStorage", HIDE_VIP_KEY, v ? "1" : "0");
    setHidden(v);
    window.dispatchEvent(new Event("polaris:hide-vip-changed"));
  };
  return [hidden, set];
}