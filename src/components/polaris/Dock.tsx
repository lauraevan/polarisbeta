import { useEffect, useState } from "react";
import { Compass, SlidersHorizontal, Signal, Wifi } from "lucide-react";
import logo from "@/assets/polaris-logo.png";

export function Dock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(id);
  }, []);

  const time = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const date = now.toLocaleDateString([], { month: "long", day: "numeric" });

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center px-4">
      <div className="liquid-glass-strong pointer-events-auto flex items-center gap-4 rounded-2xl px-4 py-2">
        {/* Brand */}
        <div className="flex items-center gap-2 pr-2">
          <img src={logo} alt="Polaris One" className="h-7 w-7 rounded-lg object-contain" />
        </div>

        <span className="h-6 w-px bg-white/15" />

        {/* Quick controls */}
        <button className="rounded-lg p-1.5 text-white/80 transition hover:bg-white/10 hover:text-white" aria-label="Browse">
          <Compass className="h-4 w-4" />
        </button>
        <button className="rounded-lg p-1.5 text-white/80 transition hover:bg-white/10 hover:text-white" aria-label="Settings">
          <SlidersHorizontal className="h-4 w-4" />
        </button>

        {/* Network */}
        <div className="flex items-center gap-1.5 text-white/85">
          <Signal className="h-4 w-4" />
          <span className="text-[11px] font-medium tabular-nums">13ms</span>
        </div>
        <Wifi className="h-4 w-4 text-white/85" />

        <span className="h-6 w-px bg-white/15" />

        {/* Clock */}
        <div className="flex flex-col items-end leading-tight">
          <span className="text-[13px] font-semibold text-white tabular-nums">{time}</span>
          <span className="text-[10px] text-white/60">{date}</span>
        </div>
      </div>
    </div>
  );
}