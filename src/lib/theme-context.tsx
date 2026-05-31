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
export type DockPosition = "left" | "center" | "right";
type Ctx = {
  mode: Mode;
  setMode: (m: Mode) => void;
  customAccent: string | null; // RGB triplet like "255 170 90", null = use wallpaper accent
  setCustomAccent: (rgb: string | null) => void;
  outlineColor: string; // hex
  setOutlineColor: (hex: string) => void;
  dockSize: number; // 0.75 - 1.4
  setDockSize: (n: number) => void;
  shortcutSize: number; // 0.75 - 1.4
  setShortcutSize: (n: number) => void;
  dockPins: string[]; // app names pinned to dock
  setDockPins: (a: string[]) => void;
  defaultEngine: "uv" | "scramjet";
  setDefaultEngine: (e: "uv" | "scramjet") => void;
  dockPosition: DockPosition;
  setDockPosition: (p: DockPosition) => void;
  homeAISwipe: boolean;
  setHomeAISwipe: (b: boolean) => void;
};

const ThemeCtx = createContext<Ctx | null>(null);
const KEY = "polaris-theme-v2";

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
  const [dockSize, setDockSize] = useState<number>(1);
  const [shortcutSize, setShortcutSize] = useState<number>(1);
  const [dockPins, setDockPins] = useState<string[]>(["YouTube", "Spotify", "Discord"]);
  const [defaultEngine, setDefaultEngine] = useState<"uv" | "scramjet">("uv");
  const [dockPosition, setDockPosition] = useState<DockPosition>("center");
  const [homeAISwipe, setHomeAISwipe] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const v = JSON.parse(raw);
        if (v.mode) setMode(v.mode);
        if (v.customAccent !== undefined) setCustomAccent(v.customAccent);
        if (v.outlineColor) setOutlineColor(v.outlineColor);
        if (typeof v.dockSize === "number") setDockSize(v.dockSize);
        if (typeof v.shortcutSize === "number") setShortcutSize(v.shortcutSize);
        if (Array.isArray(v.dockPins)) setDockPins(v.dockPins);
        if (v.defaultEngine === "uv" || v.defaultEngine === "scramjet") setDefaultEngine(v.defaultEngine);
        if (v.dockPosition === "left" || v.dockPosition === "center" || v.dockPosition === "right") setDockPosition(v.dockPosition);
        if (typeof v.homeAISwipe === "boolean") setHomeAISwipe(v.homeAISwipe);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ mode, customAccent, outlineColor, dockSize, shortcutSize, dockPins, defaultEngine, dockPosition, homeAISwipe }),
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
      document.documentElement.style.setProperty("--polaris-dock-scale", String(dockSize));
      document.documentElement.style.setProperty("--polaris-shortcut-scale", String(shortcutSize));
    }
  }, [mode, customAccent, outlineColor, dockSize, shortcutSize, dockPins, defaultEngine, dockPosition, homeAISwipe]);

  const value = useMemo<Ctx>(
    () => ({
      mode, setMode, customAccent, setCustomAccent, outlineColor, setOutlineColor,
      dockSize, setDockSize, shortcutSize, setShortcutSize, dockPins, setDockPins,
      defaultEngine, setDefaultEngine, dockPosition, setDockPosition,
      homeAISwipe, setHomeAISwipe,
    }),
    [mode, customAccent, outlineColor, dockSize, shortcutSize, dockPins, defaultEngine, dockPosition, homeAISwipe],
  );

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}