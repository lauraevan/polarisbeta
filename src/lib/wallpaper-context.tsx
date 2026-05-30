import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { WALLPAPERS, DEFAULT_WALLPAPER_ID, type Wallpaper } from "./wallpapers";

type Ctx = {
  wallpaper: Wallpaper;
  setWallpaperId: (id: string) => void;
  all: Wallpaper[];
};

const WallpaperCtx = createContext<Ctx | null>(null);
const STORAGE_KEY = "polaris-wallpaper";

export function WallpaperProvider({ children }: { children: ReactNode }) {
  const [id, setId] = useState<string>(DEFAULT_WALLPAPER_ID);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && WALLPAPERS.some((w) => w.id === saved)) setId(saved);
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
    window.localStorage.setItem(STORAGE_KEY, wallpaper.id);
  }, [wallpaper]);

  const setWallpaperId = useCallback((next: string) => setId(next), []);

  return (
    <WallpaperCtx.Provider value={{ wallpaper, setWallpaperId, all: WALLPAPERS }}>
      {children}
    </WallpaperCtx.Provider>
  );
}

export function useWallpaper() {
  const ctx = useContext(WallpaperCtx);
  if (!ctx) throw new Error("useWallpaper must be used inside WallpaperProvider");
  return ctx;
}