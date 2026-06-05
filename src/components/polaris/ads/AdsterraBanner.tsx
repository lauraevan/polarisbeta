import { useEffect, useRef } from "react";
import { useShowAds } from "@/lib/ui-prefs";

/**
 * Adsterra "Native Banner" container.
 *
 * Replace ADSTERRA_KEY with your real publisher key (e.g. "abc123def456...").
 * The script is loaded on demand once the user has not opted out.
 */
const ADSTERRA_KEY = "polaris1-native-banner";
const ADSTERRA_SRC = `//pl00000000.profitableratecpm.com/${ADSTERRA_KEY}/invoke.js`;

type Props = {
  /** Visual variant — both render the same script slot, just different framing. */
  variant?: "banner" | "inline";
  className?: string;
};

export function AdsterraBanner({ variant = "banner", className = "" }: Props) {
  const [enabled] = useShowAds();
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || !host.current) return;
    const el = host.current;
    el.innerHTML = "";

    const slot = document.createElement("div");
    slot.id = `container-${ADSTERRA_KEY}`;
    el.appendChild(slot);

    const s = document.createElement("script");
    s.async = true;
    s.dataset.cfasync = "false";
    s.src = ADSTERRA_SRC;
    s.onerror = () => {
      // Fail silently — show a subtle house ad so the slot isn't empty.
      el.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:11px;letter-spacing:.2em;color:rgba(255,255,255,0.4);text-transform:uppercase">Polaris One — Premium ad-free coming soon</div>`;
    };
    el.appendChild(s);

    return () => { el.innerHTML = ""; };
  }, [enabled]);

  if (!enabled) return null;

  const wrap =
    variant === "banner"
      ? "h-24 sm:h-28"
      : "h-20";

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] ${wrap} ${className}`}
    >
      <div className="absolute right-2 top-1.5 text-[9px] uppercase tracking-[0.25em] text-white/35">Ad</div>
      <div ref={host} className="h-full w-full" />
    </div>
  );
}