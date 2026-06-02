import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { WallpaperLayer } from "./WallpaperLayer";
import { WallpaperPicker } from "./WallpaperPicker";
import { Dock } from "./Dock";
import { WallpaperProvider } from "@/lib/wallpaper-context";
import { SidebarProvider, useSidebarState } from "@/lib/sidebar-context";
import { MyListProvider } from "@/lib/mylist-context";
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
    return () => {
      window.removeEventListener("polaris:open-profile", open);
      window.removeEventListener("polaris:signed-up", open);
    };
  }, []);

  return (
    <WallpaperProvider>
      <SidebarProvider>
        <MyListProvider>
        <WallpaperLayer />
        <ShellLayout>{children}</ShellLayout>
        {!hideDock && <Dock onOpenWallpaper={() => setWallpaperOpen(true)} />}
        {!hideDock && <WallpaperPicker open={wallpaperOpen} onOpenChange={setWallpaperOpen} />}
        <ProfileSheet open={profileOpen} onClose={() => setProfileOpen(false)} />
        <PolarisBoot />
        </MyListProvider>
      </SidebarProvider>
    </WallpaperProvider>
  );
}

function ShellLayout({ children }: { children: ReactNode }) {
  const { orientation } = useSidebarState();
  // Mobile always stacks (mobile nav is a top bar). Desktop follows orientation.
  const desktopDir = orientation === "top" ? "lg:flex-col" : "lg:flex-row";
  return (
    <div className={`flex flex-col ${desktopDir} min-h-screen text-white`}>
      <Sidebar />
      <main className="relative min-w-0 flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}