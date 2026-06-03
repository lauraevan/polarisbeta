import { Star, Flame, Heart, Sparkles, Crown, Skull, Zap, Sun, Moon, Cloud, Bolt, Award } from "lucide-react";

export type Decal = { id: string; label: string; icon: typeof Star; color: string };

export const DECALS: Decal[] = [
  { id: "star",    label: "Star",     icon: Star,     color: "#fde047" },
  { id: "flame",   label: "Flame",    icon: Flame,    color: "#fb923c" },
  { id: "heart",   label: "Heart",    icon: Heart,    color: "#f472b6" },
  { id: "sparkle", label: "Sparkle",  icon: Sparkles, color: "#c084fc" },
  { id: "crown",   label: "Crown",    icon: Crown,    color: "#fcd34d" },
  { id: "skull",   label: "Skull",    icon: Skull,    color: "#e5e7eb" },
  { id: "bolt",    label: "Bolt",     icon: Zap,      color: "#22d3ee" },
  { id: "sun",     label: "Sun",      icon: Sun,      color: "#facc15" },
  { id: "moon",    label: "Moon",     icon: Moon,     color: "#c7d2fe" },
  { id: "cloud",   label: "Cloud",    icon: Cloud,    color: "#bae6fd" },
  { id: "zap",     label: "Spark",    icon: Bolt,     color: "#a78bfa" },
  { id: "award",   label: "Award",    icon: Award,    color: "#fda4af" },
];

export function DecalIcon({ id, size = 14 }: { id: string; size?: number }) {
  const d = DECALS.find((x) => x.id === id);
  if (!d) return null;
  const I = d.icon;
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute -right-1 -top-1 grid place-items-center rounded-full"
      style={{
        background: "rgba(0,0,0,0.6)",
        color: d.color,
        padding: 2,
        boxShadow: `0 0 8px ${d.color}80`,
      }}
    >
      <I style={{ width: size, height: size }} />
    </span>
  );
}

export function DecalPicker({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  return (
    <div className="grid grid-cols-6 gap-1.5">
      <button
        onClick={() => onChange(null)}
        title="None"
        className={`grid h-9 place-items-center rounded-lg border text-[10px] font-bold ${
          !value ? "border-white bg-white/15 text-white" : "border-white/10 bg-white/5 text-white/40"
        }`}
      >
        ×
      </button>
      {DECALS.map((d) => {
        const I = d.icon;
        const active = value === d.id;
        return (
          <button
            key={d.id}
            onClick={() => onChange(d.id)}
            title={d.label}
            className={`grid h-9 place-items-center rounded-lg border transition ${
              active ? "border-white bg-white/15" : "border-white/10 bg-white/5 hover:bg-white/10"
            }`}
            style={{ color: d.color }}
          >
            <I className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}