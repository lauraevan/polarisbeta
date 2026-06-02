import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { safeGetItem, safeSetItem } from "./safe-storage";

type Orientation = "side" | "top";

type Ctx = {
  collapsed: boolean;
  toggle: () => void;
  setCollapsed: (v: boolean) => void;
  orientation: Orientation;
  setOrientation: (o: Orientation) => void;
  toggleOrientation: () => void;
};

const SidebarCtx = createContext<Ctx | null>(null);
const KEY = "polaris-sidebar-collapsed";
const ORI_KEY = "polaris-sidebar-orientation";

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [orientation, setOrientation] = useState<Orientation>("side");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const v = safeGetItem("localStorage", KEY);
    if (v === "1") setCollapsed(true);
    const o = safeGetItem("localStorage", ORI_KEY);
    if (o === "top" || o === "side") setOrientation(o);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    safeSetItem("localStorage", KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    safeSetItem("localStorage", ORI_KEY, orientation);
  }, [orientation]);

  const toggle = useCallback(() => setCollapsed((c) => !c), []);
  const toggleOrientation = useCallback(
    () => setOrientation((o) => (o === "side" ? "top" : "side")),
    [],
  );

  return (
    <SidebarCtx.Provider
      value={{ collapsed, toggle, setCollapsed, orientation, setOrientation, toggleOrientation }}
    >
      {children}
    </SidebarCtx.Provider>
  );
}

export function useSidebarState() {
  const ctx = useContext(SidebarCtx);
  if (!ctx) throw new Error("useSidebarState must be inside SidebarProvider");
  return ctx;
}