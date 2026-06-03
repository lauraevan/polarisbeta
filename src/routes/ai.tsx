import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { AppShell } from "@/components/polaris/AppShell";
import { AiToolsHub } from "@/components/polaris/ai/AiToolsHub";
import { PolarisRecs } from "@/components/polaris/recs/PolarisRecs";

export const Route = createFileRoute("/ai")({
  head: () => ({ meta: [{ title: "AI Tools — Polaris One" }] }),
  component: AiPage,
});

function AiPage() {
  const [recsOpen, setRecsOpen] = useState(false);
  return (
    <AppShell hideDock>
      <div className="relative h-[calc(100vh-32px)] overflow-hidden">
        <div className="h-full overflow-y-auto">
          <AiToolsHub />
        </div>

        {/* Edge handle to slide Recs panel in/out */}
        <button
          onClick={() => setRecsOpen((v) => !v)}
          aria-label={recsOpen ? "Hide Recs" : "Show Recs"}
          className="liquid-glass-strong absolute top-1/2 z-30 flex h-16 w-7 -translate-y-1/2 items-center justify-center rounded-l-xl text-white/80 transition-all hover:text-white"
          style={{
            right: recsOpen ? "min(440px, 92vw)" : "0px",
            boxShadow: "inset 0 0 0 1px rgba(var(--polaris-accent)/0.45)",
          }}
        >
          {recsOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>

        {/* Slide-out Recs panel */}
        <aside
          className="liquid-glass-strong absolute right-0 top-0 z-20 h-full w-[min(440px,92vw)] overflow-y-auto border-l border-white/10 transition-transform duration-300 ease-out"
          style={{ transform: recsOpen ? "translateX(0)" : "translateX(100%)" }}
        >
          <div className="flex items-center gap-2 px-5 pt-5 text-xs uppercase tracking-[0.18em] text-white/55">
            <Sparkles className="h-3.5 w-3.5" /> Polaris Recs
          </div>
          <PolarisRecs />
        </aside>
      </div>
    </AppShell>
  );
}