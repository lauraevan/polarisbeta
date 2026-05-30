import { useEffect, useState } from "react";
import logo from "@/assets/polaris-logo.png";

const KEY = "polaris-booted";

export function PolarisBoot() {
  const [show, setShow] = useState(false);
  const [out, setOut] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem(KEY) === "1") return;
    setShow(true);
    const start = Date.now();
    const dur = 5200;
    const tick = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / dur);
      setProgress(p);
      if (p >= 1) clearInterval(tick);
    }, 30);
    const a = setTimeout(() => setOut(true), dur);
    const b = setTimeout(() => {
      setShow(false);
      window.sessionStorage.setItem(KEY, "1");
    }, dur + 700);
    return () => {
      clearInterval(tick);
      clearTimeout(a);
      clearTimeout(b);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black transition-opacity duration-500 ${
        out ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 45%, rgba(var(--polaris-accent)/0.25), transparent 70%)",
        }}
      />
      <div className="relative flex flex-col items-center gap-7">
        <div className="relative">
          <img
            src={logo}
            alt="Polaris"
            className="h-28 w-28 object-contain animate-[boot-in_1.4s_ease-out_both]"
            style={{ filter: "drop-shadow(0 0 40px rgba(var(--polaris-accent)/0.6))" }}
          />
          <div
            className="absolute inset-0 -z-10 rounded-full blur-3xl opacity-80"
            style={{ background: "rgba(var(--polaris-accent)/0.4)" }}
          />
        </div>
        <h1
          className="text-3xl sm:text-4xl font-semibold tracking-[0.18em] animate-[boot-text_1.6s_ease-out_0.3s_both]"
          style={{
            background:
              "linear-gradient(180deg, #ffffff 0%, rgba(var(--polaris-accent)/0.9) 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          POLARIS LAUNCHER
        </h1>
        <div className="h-[2px] w-56 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full origin-left bg-[rgb(var(--polaris-accent))] transition-[width] duration-100 ease-linear"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
        <div className="text-[11px] uppercase tracking-[0.4em] text-white/40">
          Initializing Polaris One
        </div>
      </div>
      <style>{`
        @keyframes boot-in {
          0% { transform: scale(0.6); opacity: 0; filter: blur(8px); }
          60% { opacity: 1; }
          100% { transform: scale(1); opacity: 1; filter: blur(0); }
        }
        @keyframes boot-text {
          0% { opacity: 0; letter-spacing: 0.6em; }
          100% { opacity: 1; letter-spacing: 0.18em; }
        }
      `}</style>
    </div>
  );
}