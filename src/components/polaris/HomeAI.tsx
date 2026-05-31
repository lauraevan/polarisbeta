import { useState } from "react";
import { Send, Code2, GraduationCap, Calendar, Sparkles, Bot, Search } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import logo from "@/assets/polaris-logo.png";

type ModeId = "default" | "code" | "tutor" | "planner" | "creative" | "precise";
type ModeTile = { id: ModeId; label: string; blurb: string; icon: React.ComponentType<{ className?: string }> };

// Maps to PolarisAI's MODES (planner reuses "precise" if needed — keep ids in sync).
const TILES: ModeTile[] = [
  { id: "default", label: "Chat", blurb: "Open-ended assistant", icon: Bot },
  { id: "code", label: "Coding", blurb: "Working code first", icon: Code2 },
  { id: "tutor", label: "Learning", blurb: "Step-by-step tutor", icon: GraduationCap },
  { id: "precise", label: "Planning", blurb: "Short, factual plans", icon: Calendar },
  { id: "creative", label: "Creative", blurb: "Vivid + playful", icon: Sparkles },
];

const STARTERS: Record<ModeId, string[]> = {
  default: ["Summarize this for me:", "Help me decide between…"],
  code: ["Write me code that…", "Refactor this function:"],
  tutor: ["Explain like I'm 12:", "Quiz me on…"],
  precise: ["Plan my week to…", "List the steps to…"],
  creative: ["Write a short story about…", "Brainstorm names for…"],
  default2: [] as string[],
} as never;

export function HomeAI() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<ModeId>("default");
  const [q, setQ] = useState("");

  function launch(prompt = q) {
    const text = prompt.trim();
    const params = new URLSearchParams({ mode });
    if (text) params.set("q", text);
    navigate({ to: "/ai", search: Object.fromEntries(params) as never });
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-96px)] w-full max-w-2xl flex-col items-center justify-center px-5 py-10">
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/8">
          <img src={logo} alt="Polaris AI" className="h-7 w-7 object-contain" />
        </div>
        <div className="mt-3 text-[10px] uppercase tracking-[0.32em] text-white/70">Polaris AI</div>
        <div className="mt-1 text-[11px] text-white/45">Ask anything · pick a mode</div>
      </div>

      {/* Prompt box — mirrors the proxy search bar shape */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          launch();
        }}
        className="liquid-glass-ghost flex w-full max-w-xl items-center gap-3 rounded-2xl px-4 py-3 transition-shadow duration-300 focus-within:shadow-[0_0_0_1px_rgba(var(--polaris-accent)/0.6),0_20px_50px_-20px_rgba(var(--polaris-accent)/0.45)]"
      >
        <Search className="h-4 w-4 text-white/60" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Ask Polaris AI in ${TILES.find((t) => t.id === mode)?.label} mode…`}
          className="flex-1 bg-transparent text-sm text-white placeholder:text-white/50 focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Send to Polaris AI"
          className="grid h-8 w-8 place-items-center rounded-xl text-white"
          style={{ background: "rgb(var(--polaris-accent))" }}
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>

      {/* Mode tiles — replaces shortcuts grid from the proxy home */}
      <div className="mt-5 grid w-full max-w-xl grid-cols-2 gap-2 sm:grid-cols-5">
        {TILES.map((t) => {
          const Icon = t.icon;
          const isOn = mode === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setMode(t.id)}
              className="liquid-glass-ghost shortcut-card flex flex-col items-center justify-center gap-1.5 rounded-2xl p-3 text-center transition"
              style={
                isOn
                  ? {
                      background: `rgba(var(--polaris-accent)/0.22)`,
                      boxShadow: `inset 0 0 0 1px rgba(var(--polaris-accent)/0.55)`,
                    }
                  : undefined
              }
            >
              <Icon className="h-5 w-5 text-white/85" />
              <div className="text-[11px] font-semibold leading-tight text-white">{t.label}</div>
              <div className="text-[9px] leading-tight text-white/50">{t.blurb}</div>
            </button>
          );
        })}
      </div>

      {/* Starter prompts for the current mode */}
      <div className="mt-4 flex w-full max-w-xl flex-wrap justify-center gap-1.5">
        {(STARTERS[mode] ?? []).map((s) => (
          <button
            key={s}
            onClick={() => launch(s)}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/75 hover:bg-white/10 hover:text-white"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}