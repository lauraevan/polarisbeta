import { useEffect, useState } from "react";
import logo from "@/assets/polaris-logo.png";
import { safeGetItem, safeSetItem } from "@/lib/safe-storage";

const KEY = "polaris-steam-booted";

/** Lightweight Steam-style splash shown the first time a user enters the games hub
 *  in a session. Co-brands Polaris + Steam. */
export function SteamSplash({ onDone }: { onDone?: () => void }) {
  const [show, setShow] = useState(false);
  const [out, setOut] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (safeGetItem("sessionStorage", KEY) === "1") return;
    setShow(true);
    const a = setTimeout(() => setOut(true), 1800);
    const b = setTimeout(() => {
      setShow(false);
      safeSetItem("sessionStorage", KEY, "1");
      onDone?.();
    }, 2400);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [onDone]);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-[90] flex items-center justify-center bg-[#0b0f14] transition-opacity duration-500 ${
        out ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 50%, rgba(var(--polaris-accent)/0.18), transparent 70%)",
        }}
      />
      <div className="relative flex flex-col items-center gap-6 animate-[ss-in_0.7s_ease-out_both]">
        <div className="flex items-center gap-5">
          <img src={logo} alt="" className="h-14 w-14 object-contain" />
          <div className="h-10 w-px bg-white/15" />
          {/* Steam-style mark (open-source SVG) */}
          <svg viewBox="0 0 24 24" className="h-12 w-12 text-white/90" fill="currentColor" aria-hidden>
            <path d="M12 0C5.626 0 .4 4.97.022 11.25l6.437 2.668a3.43 3.43 0 0 1 1.94-.6c.067 0 .133.003.2.006l2.864-4.144V9.1A4.572 4.572 0 0 1 16.04 4.53a4.572 4.572 0 0 1 4.566 4.57 4.572 4.572 0 0 1-4.575 4.57h-.105l-4.082 2.91v.165a3.434 3.434 0 0 1-3.43 3.43c-1.69 0-3.115-1.227-3.378-2.83L.59 15.45C2.064 20.376 6.609 24 12 24c6.624 0 12-5.373 12-12S18.624 0 12 0Zm-4.41 18.06-1.475-.61a2.59 2.59 0 0 0 1.348 1.226c1.336.557 2.881-.077 3.435-1.413a2.62 2.62 0 0 0-1.412-3.437l-1.527-.633a3.066 3.066 0 0 0 .76 1.95l1.42.59a1.62 1.62 0 1 1-1.249 2.99l-1.3-.539v-.124Zm8.45-5.97a3.046 3.046 0 0 1-3.043-3.045 3.046 3.046 0 0 1 3.043-3.043 3.046 3.046 0 0 1 3.042 3.043 3.046 3.046 0 0 1-3.042 3.044Zm.008-.755a2.287 2.287 0 1 0 .003-4.574 2.287 2.287 0 0 0-.003 4.574Z"/>
          </svg>
        </div>
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-2xl font-bold tracking-[0.18em] text-white">POLARIS STEAM</h1>
          <p className="text-[10px] uppercase tracking-[0.4em] text-white/40">
            Loading library…
          </p>
        </div>
        <div className="h-[2px] w-48 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/3 animate-[ss-bar_1.6s_ease-in-out_infinite] bg-[rgb(var(--polaris-accent))]" />
        </div>
      </div>
      <style>{`
        @keyframes ss-in { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
        @keyframes ss-bar { 0%{transform:translateX(-100%)} 100%{transform:translateX(300%)} }
      `}</style>
    </div>
  );
}