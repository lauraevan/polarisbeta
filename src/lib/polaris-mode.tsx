import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { safeGetItem, safeSetItem } from "./safe-storage";

export type PolarisMode = "heavy" | "lite";

type Ctx = {
  mode: PolarisMode | null;
  setMode: (m: PolarisMode) => void;
  ready: boolean;
};

const ModeCtx = createContext<Ctx | null>(null);
const KEY = "polaris-mode-v1";

export function PolarisModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<PolarisMode | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const v = safeGetItem("localStorage", KEY);
    if (v === "heavy" || v === "lite") setModeState(v);
    setReady(true);
  }, []);

  const setMode = useCallback((m: PolarisMode) => {
    setModeState(m);
    safeSetItem("localStorage", KEY, m);
  }, []);

  return (
    <ModeCtx.Provider value={{ mode, setMode, ready }}>{children}</ModeCtx.Provider>
  );
}

export function usePolarisMode() {
  const ctx = useContext(ModeCtx);
  if (!ctx) {
    // Safe fallback for routes mounted outside provider.
    return { mode: "heavy" as PolarisMode, setMode: () => {}, ready: true };
  }
  return ctx;
}