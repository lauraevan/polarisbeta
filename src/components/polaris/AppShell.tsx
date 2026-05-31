import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { WallpaperLayer } from "./WallpaperLayer";
import { WallpaperPicker } from "./WallpaperPicker";
import { Dock } from "./Dock";
import { WallpaperProvider } from "@/lib/wallpaper-context";
import { SidebarProvider } from "@/lib/sidebar-context";
import { PolarisBoot } from "./Boot";
import { ProfileSheet } from "./ProfileSheet";
import { useEffect, useState } from "react";

export function AppShell({ children, hideDock = false }: { children: ReactNode; hideDock?: boolean }) {
  const [wallpaperOpen, setWallpaperOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const open = () => setProfileOpen(true);
    window.addEventListener("polaris:open-profile", open);
    window.addEventListener("polaris:signed-up", open);
    return () => window.removeEventListener("polaris:open-profile", open);
    // cleanup of signed-up too
  }, []);

  return (
    <WallpaperProvider>
      <SidebarProvider>
        <WallpaperLayer />
        <div className="flex min-h-screen text-white">
          <Sidebar />
          <main className="relative flex-1 overflow-x-hidden">{children}</main>
        </div>
        {!hideDock && <Dock onOpenWallpaper={() => setWallpaperOpen(true)} />}
        <WallpaperPicker open={wallpaperOpen} onOpenChange={setWallpaperOpen} />
        <ProfileSheet open={profileOpen} onClose={() => setProfileOpen(false)} />
        <PolarisBoot />
      </SidebarProvider>
    </WallpaperProvider>
  );
}