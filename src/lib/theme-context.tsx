import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Mode = "wallpaper" | "outline";
type Ctx = {
  mode: Mode;
  setMode: (m: Mode) => void;
  customAccent: string | null; // RGB triplet like "255 170 90", null = use wallpaper accent
  setCustomAccent: (rgb: string | null) => void;
  outlineColor: string; // hex
  setOutlineColor: (hex: string) => void;
};

const ThemeCtx = createContext<Ctx | null>(null);
const KEY = "polaris-theme-v1";

function hexToRgbTriplet(hex: string): string {
  const m = hex.replace("#", "");
  const n = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>("wallpaper");
  const [customAccent, setCustomAccent] = useState<string | null>(null);
  const [outlineColor, setOutlineColor] = useState<string>("#ff9e55");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const v = JSON.parse(raw);
        if (v.mode) setMode(v.mode);
        if (v.customAccent !== undefined) setCustomAccent(v.customAccent);
        if (v.outlineColor) setOutlineColor(v.outlineColor);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ mode, customAccent, outlineColor }),
    );
    // Apply custom accent if set
    if (customAccent && typeof document !== "undefined") {
      document.documentElement.style.setProperty("--polaris-accent", customAccent);
    }
    if (typeof document !== "undefined") {
      document.documentElement.dataset.polarisMode = mode;
      document.documentElement.style.setProperty(
        "--polaris-outline",
        hexToRgbTriplet(outlineColor),
      );
    }
  }, [mode, customAccent, outlineColor]);

  const value = useMemo<Ctx>(
    () => ({ mode, setMode, customAccent, setCustomAccent, outlineColor, setOutlineColor }),
    [mode, customAccent, outlineColor],
  );

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}