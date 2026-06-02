import { useEffect, useState } from "react";
import { Crown, Lock, Sparkles, Type as TypeIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { safeGetItem, safeSetItem } from "@/lib/safe-storage";

const FONT_OPTIONS = [
  { id: "default", label: "Default", css: "" },
  { id: "space-grotesk", label: "Space Grotesk", css: "'Space Grotesk', system-ui" },
  { id: "playfair", label: "Playfair Display", css: "'Playfair Display', serif" },
  { id: "jetbrains", label: "JetBrains Mono", css: "'JetBrains Mono', monospace" },
  { id: "dm-serif", label: "DM Serif Display", css: "'DM Serif Display', serif" },
  { id: "bricolage", label: "Bricolage Grotesque", css: "'Bricolage Grotesque', sans-serif" },
];

const GLOW_KEY = "polaris:pro:glow";
const FONT_KEY = "polaris:pro:font";

function applyPremium(font: string, glow: number) {
  if (typeof document === "undefined") return;
  const font_css = FONT_OPTIONS.find((f) => f.id === font)?.css ?? "";
  document.documentElement.style.setProperty("--polaris-display-font", font_css || "inherit");
  document.documentElement.style.setProperty("--polaris-glow", String(glow));
}

function isProActive(profile: { pro_until?: string | null } | null) {
  if (!profile?.pro_until) return false;
  const t = Date.parse(profile.pro_until);
  return Number.isNaN(t) ? true : t > Date.now();
}

/** Mount this once at app root so the user's saved Pro look applies everywhere. */
export function PremiumStyleMount() {
  const { profile } = useAuth();
  const pro = isProActive(profile);
  useEffect(() => {
    if (!pro) {
      applyPremium("default", 0);
      return;
    }
    const font = safeGetItem("localStorage", FONT_KEY) ?? "default";
    const glow = Number(safeGetItem("localStorage", GLOW_KEY) ?? "0.4");
    applyPremium(font, isFinite(glow) ? glow : 0.4);
  }, [pro]);
  return null;
}

export function ProCustomization() {
  const { profile } = useAuth();
  const pro = isProActive(profile);
  const [font, setFont] = useState<string>("default");
  const [glow, setGlow] = useState<number>(0.4);

  useEffect(() => {
    setFont(safeGetItem("localStorage", FONT_KEY) ?? "default");
    const g = Number(safeGetItem("localStorage", GLOW_KEY) ?? "0.4");
    setGlow(isFinite(g) ? g : 0.4);
  }, []);

  useEffect(() => {
    if (!pro) return;
    safeSetItem("localStorage", FONT_KEY, font);
    safeSetItem("localStorage", GLOW_KEY, String(glow));
    applyPremium(font, glow);
  }, [pro, font, glow]);

  return (
    <section className="liquid-glass-themed relative overflow-hidden rounded-2xl border border-amber-400/30 p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-amber-400 to-pink-500">
          <Crown className="h-4 w-4 text-black" />
        </div>
        <div>
          <div className="text-sm font-bold text-white">Pro Customization</div>
          <div className="text-[11px] text-white/55">Premium fonts and accent glow.</div>
        </div>
        {!pro && (
          <Link
            to="/premium"
            className="ml-auto flex items-center gap-1 rounded-full bg-amber-400/15 px-3 py-1 text-[11px] font-semibold text-amber-300 hover:bg-amber-400/25"
          >
            <Lock className="h-3 w-3" />
            Pro only
          </Link>
        )}
      </div>

      <div className={`grid gap-4 ${pro ? "" : "pointer-events-none opacity-50"}`}>
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-white/80">
            <TypeIcon className="h-3.5 w-3.5" /> Display font
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {FONT_OPTIONS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFont(f.id)}
                style={{ fontFamily: f.css || undefined }}
                className={`rounded-lg border px-3 py-2 text-left text-sm ${
                  font === f.id
                    ? "border-amber-400 bg-amber-400/10 text-white"
                    : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-white/80">
            <Sparkles className="h-3.5 w-3.5" /> Accent glow intensity
            <span className="ml-auto text-white/50">{Math.round(glow * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={glow}
            onChange={(e) => setGlow(Number(e.target.value))}
            className="w-full accent-amber-400"
          />
          <div
            className="mt-3 rounded-xl border border-white/10 p-4 text-center"
            style={{
              background: `radial-gradient(120% 80% at 50% 0%, rgba(var(--polaris-accent)/${glow * 0.5}), transparent 70%)`,
              boxShadow: `0 0 ${glow * 60}px rgba(var(--polaris-accent)/${glow * 0.7})`,
              fontFamily: "var(--polaris-display-font, inherit)",
            }}
          >
            <div className="text-lg font-bold tracking-wide text-white">Polaris Pro Preview</div>
            <div className="text-xs text-white/55">Your glow + font, live.</div>
          </div>
        </div>
      </div>
    </section>
  );
}
