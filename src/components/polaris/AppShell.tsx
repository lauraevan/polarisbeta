import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { WallpaperLayer } from "./WallpaperLayer";
import { WallpaperPicker } from "./WallpaperPicker";
import { Dock } from "./Dock";
import { WallpaperProvider } from "@/lib/wallpaper-context";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <WallpaperProvider>
      <WallpaperLayer />
      <div className="flex min-h-screen text-white">
        <Sidebar />
        <main className="relative flex-1 overflow-x-hidden">{children}</main>
      </div>
      <Dock />
      <WallpaperPicker />
    </WallpaperProvider>
  );
}