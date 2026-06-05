import { useEffect, useState, useCallback } from "react";
import { safeGetItem, safeSetItem } from "./safe-storage";

const EVT = "polaris:ui-pref";

function read(key: string, fallback: boolean) {
  if (typeof window === "undefined") return fallback;
  const v = safeGetItem("localStorage", key);
  if (v === "1") return true;
  if (v === "0") return false;
  return fallback;
}

export function useLocalToggle(key: string, fallback = true) {
  const [v, setV] = useState<boolean>(fallback);

  useEffect(() => {
    const sync = () => setV(read(key, fallback));
    sync();
    const onCustom = (e: Event) => {
      if ((e as CustomEvent).detail?.key === key) sync();
    };
    window.addEventListener("storage", sync);
    window.addEventListener(EVT, onCustom as EventListener);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(EVT, onCustom as EventListener);
    };
  }, [key, fallback]);

  const set = useCallback(
    (next: boolean) => {
      safeSetItem("localStorage", key, next ? "1" : "0");
      setV(next);
      window.dispatchEvent(new CustomEvent(EVT, { detail: { key } }));
    },
    [key],
  );

  return [v, set] as const;
}

export const SHOW_DISCORD_KEY = "polaris-show-discord";
export const useShowDiscord = () => useLocalToggle(SHOW_DISCORD_KEY, true);

export const SHOW_ADS_KEY = "polaris-show-ads";
export const useShowAds = () => useLocalToggle(SHOW_ADS_KEY, true);

// Ad provider: "monetag" | "adsterra" | "off"
export type AdProvider = "monetag" | "adsterra" | "off";
export const AD_PROVIDER_KEY = "polaris-ad-provider";

export function useAdProvider() {
  const [v, setV] = useState<AdProvider>("monetag");

  useEffect(() => {
    const sync = () => {
      const raw = safeGetItem("localStorage", AD_PROVIDER_KEY);
      if (raw === "monetag" || raw === "adsterra" || raw === "off") setV(raw);
      else setV("monetag");
    };
    sync();
    const onCustom = (e: Event) => {
      if ((e as CustomEvent).detail?.key === AD_PROVIDER_KEY) sync();
    };
    window.addEventListener("storage", sync);
    window.addEventListener(EVT, onCustom as EventListener);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(EVT, onCustom as EventListener);
    };
  }, []);

  const set = useCallback((next: AdProvider) => {
    safeSetItem("localStorage", AD_PROVIDER_KEY, next);
    setV(next);
    window.dispatchEvent(new CustomEvent(EVT, { detail: { key: AD_PROVIDER_KEY } }));
  }, []);

  return [v, set] as const;
}