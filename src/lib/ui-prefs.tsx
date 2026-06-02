import { useEffect, useState, useCallback } from "react";

const EVT = "polaris:ui-pref";

function read(key: string, fallback: boolean) {
  if (typeof window === "undefined") return fallback;
  const v = window.localStorage.getItem(key);
  if (v === "1") return true;
  if (v === "0") return false;
  return fallback;
}

export function useLocalToggle(key: string, fallback = true) {
  const [v, setV] = useState<boolean>(() => read(key, fallback));

  useEffect(() => {
    const sync = () => setV(read(key, fallback));
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
      window.localStorage.setItem(key, next ? "1" : "0");
      setV(next);
      window.dispatchEvent(new CustomEvent(EVT, { detail: { key } }));
    },
    [key],
  );

  return [v, set] as const;
}

export const SHOW_DISCORD_KEY = "polaris-show-discord";
export const useShowDiscord = () => useLocalToggle(SHOW_DISCORD_KEY, true);