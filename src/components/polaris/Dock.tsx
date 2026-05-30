import { useEffect, useState } from "react";
import { Compass, SlidersHorizontal, Signal, Wifi, LayoutGrid } from "lucide-react";
import logo from "@/assets/polaris-logo.png";
import { Launchpad } from "./Launchpad";

export function Dock() {
  const [now, setNow] = useState<Date | null>(null);
  const [launchpadOpen, setLaunchpadOpen] = useState(false);

  useEffect(() => {
    // Only run on the client to avoid SSR/CSR hydration mismatch.
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(id);
  }, []);

  const time = now
    ? now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : "--:--";
  const date = now
    ? now.toLocaleDateString([], { month: "long", day: "numeric" })
    : "";

  return (
    <>
      <Launchpad open={launchpadOpen} onClose={() => setLaunchpadOpen(false)} />
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center px-4">
        <div className="liquid-glass-themed pointer-events-auto flex max-w-[calc(100vw-2rem)] items-center gap-3 overflow-x-auto rounded-2xl px-3 py-2 sm:gap-4 sm:px-4">
        {/* Brand */}
        <div className="flex items-center gap-2 pr-1 sm:pr-2">
          <img src={logo} alt="Polaris One" className="h-7 w-7 rounded-lg object-contain" />
        </div>

        <span className="h-6 w-px bg-white/15" />

        {/* Launchpad — opens the all-apps overlay */}
        <button
          onClick={() => setLaunchpadOpen((o) => !o)}
          aria-label="Launchpad"
          className={`rounded-lg p-1.5 transition hover:bg-white/10 hover:text-white ${
            launchpadOpen ? "bg-white/15 text-white" : "text-white/80"
          }`}
        >
          <LayoutGrid className="h-4 w-4" />
        </button>

        {/* Quick controls */}
        <button className="rounded-lg p-1.5 text-white/80 transition hover:bg-white/10 hover:text-white" aria-label="Browse">
          <Compass className="h-4 w-4" />
        </button>
        <button className="rounded-lg p-1.5 text-white/80 transition hover:bg-white/10 hover:text-white" aria-label="Settings">
          <SlidersHorizontal className="h-4 w-4" />
        </button>

        {/* Network */}
        <div className="hidden items-center gap-1.5 text-white/85 sm:flex">
          <Signal className="h-4 w-4" />
          <span className="text-[11px] font-medium tabular-nums">13ms</span>
        </div>
        <Wifi className="hidden h-4 w-4 text-white/85 sm:block" />

        <span className="hidden h-6 w-px bg-white/15 sm:block" />

        {/* Clock */}
        <div className="flex flex-col items-end leading-tight" suppressHydrationWarning>
          <span className="text-[13px] font-semibold text-white tabular-nums" suppressHydrationWarning>{time}</span>
          <span className="text-[10px] text-white/60" suppressHydrationWarning>{date}</span>
        </div>
      </div>
    </div>
    </>
  );
}