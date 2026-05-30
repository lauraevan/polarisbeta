import { useEffect, useState } from "react";

export function PolarisFlixSplash({ onDone }: { onDone: () => void }) {
  const [out, setOut] = useState(false);
  useEffect(() => {
    const a = setTimeout(() => setOut(true), 1600);
    const b = setTimeout(onDone, 2200);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [onDone]);
  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center bg-black transition-opacity duration-500 ${
        out ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <h1
            className="text-[14vw] sm:text-7xl md:text-8xl font-black tracking-[-0.04em] leading-none animate-[pf_2s_ease-out_forwards]"
            style={{
              background:
                "linear-gradient(90deg, rgba(var(--polaris-accent)/1), #fff 50%, rgba(var(--polaris-accent)/1))",
              backgroundSize: "200% 100%",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              filter: "drop-shadow(0 0 30px rgba(var(--polaris-accent)/0.55))",
            }}
          >
            PolarisFlix
          </h1>
        </div>
        <div className="h-[2px] w-40 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-full origin-left animate-[loadbar_1.6s_ease-out_forwards] bg-[rgb(var(--polaris-accent))]" />
        </div>
      </div>
      <style>{`
        @keyframes pf {
          0% { background-position: 100% 0; transform: scale(0.96); opacity: 0; }
          30% { opacity: 1; }
          100% { background-position: -100% 0; transform: scale(1); opacity: 1; }
        }
        @keyframes loadbar {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
      `}</style>
    </div>
  );
}