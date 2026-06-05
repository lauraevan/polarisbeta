import { useEffect } from "react";
import { useShowAds, useAdProvider } from "@/lib/ui-prefs";

const ADSTERRA_SRC =
  "https://pl29642623.effectivecpmnetwork.com/3f/f1/29/3ff129e02962c8507ea2a53ba82aaacd.js";
const ADSTERRA_FLAG = "polaris-adsterra-popunder-loaded";
const MONETAG_FLAG = "polaris-monetag-sw-registered";

/** Loads the configured ad provider (Monetag default, Adsterra, or off). */
export function AdsLoader() {
  const [enabled] = useShowAds();
  const [provider] = useAdProvider();

  useEffect(() => {
    if (!enabled || provider === "off") return;
    if (typeof window === "undefined") return;

    if (provider === "adsterra") {
      try {
        if (sessionStorage.getItem(ADSTERRA_FLAG) === "1") return;
        sessionStorage.setItem(ADSTERRA_FLAG, "1");
      } catch {}
      if (document.querySelector(`script[src="${ADSTERRA_SRC}"]`)) return;
      const s = document.createElement("script");
      s.src = ADSTERRA_SRC;
      s.async = true;
      s.dataset.cfasync = "false";
      document.body.appendChild(s);
      return;
    }

    if (provider === "monetag") {
      try {
        if (sessionStorage.getItem(MONETAG_FLAG) === "1") return;
      } catch {}
      if (!("serviceWorker" in navigator)) return;
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then(() => {
          try {
            sessionStorage.setItem(MONETAG_FLAG, "1");
          } catch {}
        })
        .catch(() => {
          // silently ignore — likely blocked by an extension or unsupported scope
        });
    }
  }, [enabled, provider]);

  return null;
}