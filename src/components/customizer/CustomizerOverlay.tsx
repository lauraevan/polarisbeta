import { useEffect, useState } from "react";
import {
  X, Undo2, Redo2, RotateCcw, Save, Grid3x3, MousePointer2,
  EyeOff, Eye, ChevronUp, ChevronDown, Lock, Crown,
} from "lucide-react";
import { useCustomizer } from "@/lib/customizer-context";
import { useAuth } from "@/lib/auth-context";
import { isProActive } from "@/lib/pro-utils";
import { DecalPicker } from "./decals";
import { Link } from "@tanstack/react-router";

/**
 * Floating editor chrome shown when Customizer is active.
 * Renders a top toolbar (left) and an inspector panel (right) when an element is selected.
 */
export function CustomizerOverlay() {
  const c = useCustomizer();
  const { profile } = useAuth();
  const pro = isProActive(profile);

  // Keyboard shortcuts
  useEffect(() => {
    if (!c.active) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName?.match(/INPUT|TEXTAREA|SELECT/)) return;
      if (e.key === "Escape") c.setSelected(null);
      if ((e.metaKey || e.ctrlKey) && e.key === "z") { e.preventDefault(); e.shiftKey ? c.redo() : c.undo(); }
      if ((e.metaKey || e.ctrlKey) && e.key === "y") { e.preventDefault(); c.redo(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [c]);

  if (!c.active) return null;

  return (
    <>
      <Toolbar pro={pro} />
      {c.selected && <Inspector pro={pro} />}
    </>
  );
}

function Toolbar({ pro }: { pro: boolean }) {
  const c = useCustomizer();
  return (
    <div
      className="liquid-glass-strong fixed top-3 left-1/2 z-[60] -translate-x-1/2 flex items-center gap-1.5 rounded-2xl px-2.5 py-1.5 text-xs font-semibold text-white shadow-2xl"
      style={{ boxShadow: "0 0 0 1px rgba(var(--polaris-accent)/0.5), 0 25px 60px -20px rgba(0,0,0,0.6)" }}
    >
      <span className="flex items-center gap-1.5 px-2 text-[11px] text-white/80">
        <span className="grid h-5 w-5 place-items-center rounded-md bg-gradient-to-br from-amber-300 to-pink-500 text-black">
          <MousePointer2 className="h-3 w-3" />
        </span>
        Customizer
      </span>
      <Divider />
      <ToolBtn onClick={c.undo} disabled={!c.canUndo} title="Undo (⌘Z)"><Undo2 className="h-3.5 w-3.5" /></ToolBtn>
      <ToolBtn onClick={c.redo} disabled={!c.canRedo || !pro} title={pro ? "Redo (⌘⇧Z)" : "Pro only"}>
        <Redo2 className="h-3.5 w-3.5" /> {!pro && <Lock className="h-2.5 w-2.5" />}
      </ToolBtn>
      <ToolBtn onClick={() => { if (confirm("Reset everything you've customized?")) c.resetAll(); }} title="Reset all">
        <RotateCcw className="h-3.5 w-3.5" />
      </ToolBtn>
      <Divider />
      <div className="flex items-center gap-0.5 rounded-lg bg-black/30 p-0.5">
        {[0, 8, 16, 24].map((g) => (
          <button
            key={g}
            onClick={() => c.setGridSnap(g)}
            className={`rounded-md px-1.5 py-0.5 text-[10px] ${c.gridSnap === g ? "bg-white text-black" : "text-white/60 hover:text-white"}`}
            title={g === 0 ? "Smooth" : `Snap ${g}px`}
          >
            {g === 0 ? <MousePointer2 className="h-3 w-3" /> : <span className="flex items-center gap-0.5"><Grid3x3 className="h-3 w-3" />{g}</span>}
          </button>
        ))}
      </div>
      <Divider />
      <Link
        to="/settings"
        onClick={() => c.setActive(false)}
        className="rounded-lg bg-white/10 px-2.5 py-1 text-[11px] hover:bg-white/20"
      >
        <Save className="inline h-3 w-3" /> Layouts
      </Link>
      <button
        onClick={() => c.setActive(false)}
        className="rounded-lg bg-red-500 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-red-400"
      >
        <X className="inline h-3 w-3" /> Exit
      </button>
    </div>
  );
}

function ToolBtn({
  onClick, disabled, title, children,
}: { onClick: () => void; disabled?: boolean; title: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex items-center gap-0.5 rounded-lg px-2 py-1 text-white/85 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-0.5 h-5 w-px bg-white/15" />;
}

function Inspector({ pro }: { pro: boolean }) {
  const c = useCustomizer();
  const id = c.selected!;
  const t = c.getItem(id);
  const [scale, setScale] = useState<number>(t.scale ?? 1);

  useEffect(() => { setScale(t.scale ?? 1); }, [id, t.scale]);

  return (
    <div
      className="liquid-glass-strong fixed right-3 top-20 z-[60] flex w-72 flex-col gap-3 rounded-2xl p-4 text-xs text-white shadow-2xl"
      style={{ boxShadow: "0 0 0 1px rgba(var(--polaris-accent)/0.45), 0 25px 60px -20px rgba(0,0,0,0.7)" }}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-white/50">Selected</div>
          <div className="truncate text-sm font-bold">{id}</div>
        </div>
        <button onClick={() => c.setSelected(null)} className="rounded p-1 text-white/60 hover:bg-white/10 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-white/55">Scale</span>
          <span className="text-white/70">{scale.toFixed(2)}×</span>
        </div>
        <input
          type="range"
          min={pro ? 0.25 : 0.5} max={pro ? 4 : 2} step={0.05}
          value={scale}
          onChange={(e) => { const v = Number(e.target.value); setScale(v); c.updateItem(id, { scale: v }); }}
          className="w-full accent-[rgb(var(--polaris-accent))]"
        />
        {!pro && <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-300/80"><Lock className="h-2.5 w-2.5" /> Free: 0.5×–2×. Pro: 0.25×–4×.</div>}
      </div>

      <div className="flex gap-2">
        <button onClick={() => c.reorder(id, -1)} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-white/5 px-2 py-1.5 hover:bg-white/10">
          <ChevronUp className="h-3 w-3" /> Up
        </button>
        <button onClick={() => c.reorder(id, 1)} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-white/5 px-2 py-1.5 hover:bg-white/10">
          <ChevronDown className="h-3 w-3" /> Down
        </button>
      </div>

      <button
        onClick={() => c.updateItem(id, { hidden: !t.hidden })}
        className="flex items-center justify-center gap-1.5 rounded-lg bg-white/5 px-2 py-1.5 hover:bg-white/10"
      >
        {t.hidden ? <><Eye className="h-3.5 w-3.5" /> Show</> : <><EyeOff className="h-3.5 w-3.5" /> Hide</>}
      </button>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-white/55 flex items-center gap-1">
            Decal {!pro && <Crown className="h-3 w-3 text-amber-300" />}
          </span>
          {!pro && <span className="text-[9px] text-amber-300/80">Pro</span>}
        </div>
        <div className={!pro ? "pointer-events-none opacity-40" : ""}>
          <DecalPicker value={t.decal ?? null} onChange={(v) => c.updateItem(id, { decal: v })} />
        </div>
      </div>

      <button
        onClick={() => c.updateItem(id, { scale: undefined, color: undefined, decal: null, hidden: false, order: undefined })}
        className="mt-1 rounded-lg bg-white/5 px-2 py-1.5 text-[11px] text-white/70 hover:bg-white/10"
      >
        Reset this element
      </button>
    </div>
  );
}