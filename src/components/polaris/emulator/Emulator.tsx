import { useState } from "react";
import { Gamepad2, Cloud, FlaskConical } from "lucide-react";
import { RetroPane } from "./RetroPane";
import { IframePane } from "./IframePane";

type Tab = "retro" | "cloud" | "vela";
const TABS: { id: Tab; label: string; icon: typeof Gamepad2; sub: string }[] = [
  { id: "retro", label: "Retro", icon: Gamepad2, sub: "NES · SNES · GBA · N64 · PS1" },
  { id: "cloud", label: "Switch · Cloud", icon: Cloud, sub: "Streamed via Afterplay" },
  { id: "vela", label: "Switch · Experimental", icon: FlaskConical, sub: "Vela WebGPU alpha" },
];

export function Emulator() {
  const [tab, setTab] = useState<Tab>("retro");

  return (
    <div className="flex h-screen flex-col text-white">
      {/* Tab bar */}
      <header className="px-3 pt-3 sm:px-4">
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
        {tab === "cloud" && (
          <IframePane
            url="https://afterplay.io"
            label="Afterplay.io"
            banner="Cloud-streamed Switch emulation. Sign in to Afterplay; the Switch tier may require a paid plan."
          />
        )}
        {tab === "vela" && (
          <IframePane
            url="https://proxy-alt.github.io/Vela/"
            label="Vela"
            warning
            banner="Experimental open-source WebGPU Switch emulator. Most commercial games will not boot yet."
          />
        )}
      </div>
    </div>
  );
}