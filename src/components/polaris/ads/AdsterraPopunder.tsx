import { useEffect } from "react";
import { useShowAds } from "@/lib/ui-prefs";

const SRC = "https://pl29642623.effectivecpmnetwork.com/3f/f1/29/3ff129e02962c8507ea2a53ba82aaacd.js";
const SESSION_FLAG = "polaris-adsterra-popunder-loaded";

/** Loads the Adsterra popunder script once per session, site-wide. */
export function AdsterraPopunder() {
  const [enabled] = useShowAds();

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem(SESSION_FLAG) === "1") return;
      sessionStorage.setItem(SESSION_FLAG, "1");
    } catch {
      // ignore — load anyway
    }
    if (document.querySelector(`script[src="${SRC}"]`)) return;
    const s = document.createElement("script");
    s.src = SRC;
    s.async = true;
    s.dataset.cfasync = "false";
    document.body.appendChild(s);
  }, [enabled]);

  return null;
}