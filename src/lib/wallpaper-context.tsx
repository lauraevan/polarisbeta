import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { WALLPAPERS, DEFAULT_WALLPAPER_ID, type Wallpaper, type Resolution } from "./wallpapers";
import { safeGetItem, safeSetItem } from "./safe-storage";

type Ctx = {
  wallpaper: Wallpaper;
  setWallpaperId: (id: string) => void;
  resolution: Resolution;
  setResolution: (r: Resolution) => void;
  all: Wallpaper[];
};

const WallpaperCtx = createContext<Ctx | null>(null);
const STORAGE_KEY = "polaris-wallpaper";
const RES_KEY = "polaris-wallpaper-res";

export function WallpaperProvider({ children }: { children: ReactNode }) {
  const [id, setId] = useState<string>(DEFAULT_WALLPAPER_ID);
  const [resolution, setRes] = useState<Resolution>("540p");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = safeGetItem("localStorage", STORAGE_KEY);
    if (saved && WALLPAPERS.some((w) => w.id === saved)) setId(saved);
    const savedRes = safeGetItem("localStorage", RES_KEY) as Resolution | null;
    if (savedRes && ["540p", "1080p", "4k"].includes(savedRes)) setRes(savedRes);
  }, []);

  const wallpaper = useMemo(
    () => WALLPAPERS.find((w) => w.id === id) ?? WALLPAPERS[0],
    [id]
  );

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.style.setProperty(
      "--polaris-accent",
      wallpaper.accent
    );
    safeSetItem("localStorage", STORAGE_KEY, wallpaper.id);
  }, [wallpaper]);

  const setWallpaperId = useCallback((next: string) => setId(next), []);
  const setResolution = useCallback((r: Resolution) => {
    setRes(r);
    if (typeof window !== "undefined") safeSetItem("localStorage", RES_KEY, r);
  }, []);

  return (
    <WallpaperCtx.Provider value={{ wallpaper, setWallpaperId, resolution, setResolution, all: WALLPAPERS }}>
      {children}
    </WallpaperCtx.Provider>
  );
}

export function useWallpaper() {
  const ctx = useContext(WallpaperCtx);
  if (!ctx) {
    // Safe fallback for routes mounted outside AppShell (e.g. /admin).
    return {
      wallpaper: WALLPAPERS[0],
      setWallpaperId: () => {},
      resolution: "540p" as Resolution,
      setResolution: () => {},
      all: WALLPAPERS,
    };
  }
  return ctx;
}
