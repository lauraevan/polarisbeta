import { useEffect, useState } from "react";
import logo from "@/assets/polaris-play-logo.png.asset.json";
import { safeGetItem, safeSetItem } from "@/lib/safe-storage";

const KEY = "polaris-play-booted";

/** Polaris Play splash — PS-style logo + "Polaris Play" wordmark.
 *  No loading bar. Holds 1.22s, then a quick smooth fade to the catalog. */
export function PolarisPlaySplash({ onDone }: { onDone?: () => void }) {
  const [show, setShow] = useState(false);
  const [out, setOut] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (safeGetItem("sessionStorage", KEY) === "1") return;
    setShow(true);
    const a = setTimeout(() => setOut(true), 1220);
    const b = setTimeout(() => {
      setShow(false);
      safeSetItem("sessionStorage", KEY, "1");
      onDone?.();
    }, 1820);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [onDone]);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-[120] flex items-center justify-center bg-black transition-opacity duration-[600ms] ease-out ${
        out ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 50%, rgba(0,112,255,0.22), transparent 70%)",
        }}
      />
      <div className="relative flex flex-col items-center gap-5 animate-[pp-in_700ms_ease-out_both]">
        <img
          src={logo.url}
          alt=""
          className="h-28 w-28 object-contain drop-shadow-[0_0_28px_rgba(0,112,255,0.55)] sm:h-36 sm:w-36"
        />
        <h1 className="text-3xl font-black tracking-[0.14em] text-white sm:text-4xl animate-[pp-text_196ms_cubic-bezier(.2,.7,.2,1)_350ms_both] origin-top will-change-transform">
          POLARIS PLAY
        </h1>
      </div>
      <style>{`
        @keyframes pp-in { from { opacity: 0; transform: translateY(10px) scale(0.97) } to { opacity: 1; transform: none } }
        @keyframes pp-text {
          0%   { opacity: 0; transform: translateY(-18px) scaleY(0.4); filter: blur(6px); letter-spacing: 0.02em; }
          60%  { opacity: 1; filter: blur(0); }
          100% { opacity: 1; transform: translateY(0) scaleY(1); filter: blur(0); letter-spacing: 0.14em; }
        }
      `}</style>
    </div>
  );
}