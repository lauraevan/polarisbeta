import { useState } from "react";
import { Gamepad2, Cloud, Zap } from "lucide-react";
import { RetroPane } from "./RetroPane";
import { SwitchCloudPane } from "./SwitchCloudPane";
import { StratusCloudPane } from "./StratusCloudPane";

type Tab = "retro" | "cloud" | "stratus";
const TABS: { id: Tab; label: string; icon: typeof Gamepad2; sub: string }[] = [
  { id: "retro", label: "Retro", icon: Gamepad2, sub: "NES · SNES · GBA · N64 · PS1" },
  { id: "cloud", label: "Switch · Cloud", icon: Cloud, sub: "Streamed via Afterplay" },
  { id: "stratus", label: "Stratus Cloud", icon: Zap, sub: "Cherri's backend · modern titles" },
];

export function Emulator() {
  const [tab, setTab] = useState<Tab>("retro");

  return (
    <div className="mx-auto flex h-[calc(100vh-110px)] max-w-6xl flex-col px-3 pt-4 pb-2 text-white sm:px-4">
      {/* Tab bar */}
      <header>
        <div className="liquid-glass-themed flex items-center gap-1 overflow-x-auto rounded-2xl p-1.5">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="relative flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm transition"
                style={
                  active
                    ? {
                        background:
                          "linear-gradient(90deg, rgba(var(--polaris-accent)/0.28), rgba(var(--polaris-accent)/0.10))",
                        boxShadow: "inset 0 0 0 1px rgba(var(--polaris-accent)/0.55)",
                        color: "#fff",
                      }
                    : { color: "rgba(255,255,255,0.65)" }
                }
              >
                <Icon className="h-4 w-4" />
                <span className="font-semibold">{t.label}</span>
                <span className="hidden text-[10px] uppercase tracking-widest text-white/45 sm:inline">
                  {t.sub}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      <div className="min-h-0 flex-1">
        {tab === "retro" && <RetroPane />}
        {tab === "cloud" && <SwitchCloudPane />}
        {tab === "stratus" && <StratusCloudPane />}
      </div>
    </div>
  );
}