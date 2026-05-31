import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Palette, Image as ImageIcon, EyeOff, Eye, Type } from "lucide-react";
import { AppShell } from "@/components/polaris/AppShell";
import { useTheme } from "@/lib/theme-context";
import { useWallpaper } from "@/lib/wallpaper-context";

const COLOR_PRESETS: { label: string; rgb: string; hex: string }[] = [
  { label: "Ember",    rgb: "255 140 80",  hex: "#ff8c50" },
  { label: "Sunset",   rgb: "240 110 110", hex: "#f06e6e" },
  { label: "Gold",     rgb: "240 200 100", hex: "#f0c864" },
  { label: "Sakura",   rgb: "240 150 200", hex: "#f096c8" },
  { label: "Aurora",   rgb: "140 220 200", hex: "#8cdcc8" },
  { label: "Indigo",   rgb: "140 150 240", hex: "#8c96f0" },
  { label: "Forest",   rgb: "160 220 160", hex: "#a0dca0" },
  { label: "Crimson",  rgb: "230 80 90",   hex: "#e6505a" },
];

function hexToRgbTriplet(hex: string): string {
  const m = hex.replace("#", "");
  const n = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

function SettingsPage() {
  const { mode, setMode, customAccent, setCustomAccent, outlineColor, setOutlineColor } = useTheme();
  const { wallpaper, setWallpaperId, all } = useWallpaper();
  const [pickerHex, setPickerHex] = useState("#ff9e55");

  return (
    <div className="min-h-screen px-4 pb-32 pt-8 sm:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="space-y-1">
          <div className="text-[11px] uppercase tracking-[0.3em] text-white/55">
            System
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">Settings</h1>
          <p className="text-sm text-white/55">
            Personalize Polaris — theme, wallpaper, and accent.
          </p>
        </header>

        {/* Background Mode */}
        <section className="liquid-glass-themed rounded-2xl p-5">
          <SectionTitle icon={ImageIcon} title="Background mode" subtitle="Wallpaper or clean outline" />
          <div className="mt-3 grid grid-cols-2 gap-3">
            <ModeCard
              active={mode === "wallpaper"}
              onClick={() => setMode("wallpaper")}
              icon={Eye}
              title="Wallpaper"
              desc="Animated backgrounds with cinematic vibes."
            />
            <ModeCard
              active={mode === "outline"}
              onClick={() => setMode("outline")}
              icon={EyeOff}
              title="Outline only"
              desc="No wallpaper — solid black with accent outlines."
            />
          </div>

          {mode === "outline" && (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
              <span className="text-xs text-white/70">Outline color</span>
              <input
                type="color"
                value={outlineColor}
                onChange={(e) => setOutlineColor(e.target.value)}
                className="h-8 w-12 cursor-pointer rounded border-0 bg-transparent"
              />
              <span className="text-xs tabular-nums text-white/50">{outlineColor}</span>
            </div>
          )}
        </section>

        {/* Accent */}
        <section className="liquid-glass-themed rounded-2xl p-5">
          <SectionTitle icon={Palette} title="Accent color" subtitle="Overrides wallpaper accent" />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => setCustomAccent(null)}
              className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
                customAccent === null
                  ? "border-white bg-white text-black"
                  : "border-white/15 bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              From wallpaper
            </button>
            {COLOR_PRESETS.map((c) => (
              <button
                key={c.rgb}
                onClick={() => setCustomAccent(c.rgb)}
                title={c.label}
                className={`h-10 w-10 rounded-xl transition ${
                  customAccent === c.rgb ? "ring-2 ring-white scale-110" : "hover:scale-105"
                }`}
                style={{ background: `rgb(${c.rgb})` }}
              />
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
            <span className="text-xs text-white/70">Custom</span>
            <input
              type="color"
              value={pickerHex}
              onChange={(e) => setPickerHex(e.target.value)}
              className="h-8 w-12 cursor-pointer rounded border-0 bg-transparent"
            />
            <button
              onClick={() => setCustomAccent(hexToRgbTriplet(pickerHex))}
              className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-black hover:bg-white/90"
            >
              Apply
            </button>
          </div>
        </section>

        {/* Wallpapers */}
        {mode === "wallpaper" && (
          <section className="liquid-glass-themed rounded-2xl p-5">
            <SectionTitle icon={Type} title="Wallpaper" subtitle={`Currently: ${wallpaper.name}`} />
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {all.map((w) => (
                <button
                  key={w.id}
                  onClick={() => setWallpaperId(w.id)}
                  className={`group relative aspect-video overflow-hidden rounded-xl border transition ${
                    w.id === wallpaper.id
                      ? "border-white scale-[1.02] shadow-lg"
                      : "border-white/10 hover:border-white/30"
                  }`}
                >
                  {w.poster ? (
                    <img
                      src={w.poster}
                      alt={w.name}
                      className="absolute inset-0 h-full w-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.opacity = "0";
                      }}
                    />
                  ) : null}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(160deg, rgba(${w.accent}/0.4), rgba(10,9,16,0.6))`,
                    }}
                  />
                  <div className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5 text-left text-[10px] font-medium text-white">
                    {w.name}
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Tab Cloaker placeholder (will be expanded) */}
        <section className="liquid-glass-themed rounded-2xl p-5 opacity-60">
          <SectionTitle icon={EyeOff} title="Tab Cloaker" subtitle="Coming soon" />
          <p className="mt-2 text-xs text-white/55">
            Disguise the browser tab title & favicon as Google Classroom, Docs, etc.
          </p>
        </section>
      </div>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof Palette;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="grid h-9 w-9 place-items-center rounded-xl"
        style={{ background: "rgba(var(--polaris-accent)/0.25)" }}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-sm font-bold text-white">{title}</div>
        {subtitle && <div className="text-[11px] text-white/55">{subtitle}</div>}
      </div>
    </div>
  );
}

function ModeCard({
  active,
  onClick,
  icon: Icon,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Eye;
  title: string;
  desc: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`group flex items-start gap-3 rounded-xl border p-4 text-left transition ${
        active
          ? "border-white bg-white/10"
          : "border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10"
      }`}
    >
      <Icon className="h-5 w-5 shrink-0 text-white/80" />
      <div>
        <div className="text-sm font-bold text-white">{title}</div>
        <div className="mt-0.5 text-[11px] text-white/55">{desc}</div>
      </div>
    </button>
  );
}

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Polaris One" }] }),
  component: () => (
    <AppShell>
      <SettingsPage />
    </AppShell>
  ),
});