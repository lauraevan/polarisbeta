import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode,
} from "react";
import { safeGetItem, safeSetItem } from "@/lib/safe-storage";

export type ItemTransform = {
  scale?: number;        // 0.5 – 2 (free), 0.25 – 4 (Pro)
  hidden?: boolean;
  color?: string;        // RGB triplet "r g b"
  decal?: string | null; // decal id
  order?: number;        // for reorderable lists
};

export type CustomizerDocument = {
  version: 1;
  tokens: { accent?: string; radius?: number; buttonScale?: number };
  items: Record<string, ItemTransform>;
};

export const EMPTY_DOC: CustomizerDocument = {
  version: 1,
  tokens: {},
  items: {},
};

type Ctx = {
  doc: CustomizerDocument;
  active: boolean;           // editor overlay visible
  selected: string | null;
  gridSnap: number;          // 0 = smooth, otherwise px
  setActive: (v: boolean) => void;
  setSelected: (id: string | null) => void;
  setGridSnap: (n: number) => void;
  updateItem: (id: string, patch: Partial<ItemTransform>) => void;
  updateTokens: (patch: Partial<CustomizerDocument["tokens"]>) => void;
  reorder: (id: string, dir: -1 | 1) => void;
  resetAll: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  /** Read with optional fallback. */
  getItem: (id: string) => ItemTransform;
  /** Bulk replace (used when switching saved layouts). */
  loadDoc: (next: CustomizerDocument) => void;
};

const CustomizerCtx = createContext<Ctx | null>(null);
const LOCAL_KEY = "polaris:customizer:doc";
const ACTIVE_KEY = "polaris:customizer:active";

export function CustomizerProvider({ children }: { children: ReactNode }) {
  const [doc, setDoc] = useState<CustomizerDocument>(EMPTY_DOC);
  const [active, setActive] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [gridSnap, setGridSnap] = useState(0);

  // History
  const past = useRef<CustomizerDocument[]>([]);
  const future = useRef<CustomizerDocument[]>([]);
  const [, forceTick] = useState(0);
  const tick = () => forceTick((n) => n + 1);

  // Hydrate
  useEffect(() => {
    try {
      const raw = safeGetItem("localStorage", LOCAL_KEY);
      if (raw) setDoc(JSON.parse(raw) as CustomizerDocument);
    } catch { /* ignore */ }
    if (safeGetItem("localStorage", ACTIVE_KEY) === "1") setActive(true);
  }, []);

  // Persist
  useEffect(() => { safeSetItem("localStorage", LOCAL_KEY, JSON.stringify(doc)); }, [doc]);
  useEffect(() => { safeSetItem("localStorage", ACTIVE_KEY, active ? "1" : "0"); }, [active]);

  // Apply token side-effects (accent / button scale / radius)
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (doc.tokens.accent) document.documentElement.style.setProperty("--polaris-accent", doc.tokens.accent);
    if (typeof doc.tokens.buttonScale === "number") {
      document.documentElement.style.setProperty("--polaris-button-scale", String(doc.tokens.buttonScale));
    } else {
      document.documentElement.style.removeProperty("--polaris-button-scale");
    }
  }, [doc.tokens]);

  const pushHistory = useCallback((curr: CustomizerDocument) => {
    past.current.push(curr);
    if (past.current.length > 50) past.current.shift();
    future.current.length = 0;
    tick();
  }, []);

  const updateItem = useCallback((id: string, patch: Partial<ItemTransform>) => {
    setDoc((prev) => {
      pushHistory(prev);
      return { ...prev, items: { ...prev.items, [id]: { ...prev.items[id], ...patch } } };
    });
  }, [pushHistory]);

  const updateTokens = useCallback((patch: Partial<CustomizerDocument["tokens"]>) => {
    setDoc((prev) => {
      pushHistory(prev);
      return { ...prev, tokens: { ...prev.tokens, ...patch } };
    });
  }, [pushHistory]);

  const reorder = useCallback((id: string, dir: -1 | 1) => {
    setDoc((prev) => {
      pushHistory(prev);
      const current = prev.items[id]?.order ?? 0;
      return { ...prev, items: { ...prev.items, [id]: { ...prev.items[id], order: current + dir } } };
    });
  }, [pushHistory]);

  const resetAll = useCallback(() => {
    setDoc((prev) => { pushHistory(prev); return EMPTY_DOC; });
    setSelected(null);
  }, [pushHistory]);

  const undo = useCallback(() => {
    const prev = past.current.pop();
    if (!prev) return;
    setDoc((curr) => { future.current.push(curr); tick(); return prev; });
  }, []);

  const redo = useCallback(() => {
    const next = future.current.pop();
    if (!next) return;
    setDoc((curr) => { past.current.push(curr); tick(); return next; });
  }, []);

  const loadDoc = useCallback((next: CustomizerDocument) => {
    setDoc((prev) => { pushHistory(prev); return next; });
  }, [pushHistory]);

  const getItem = useCallback((id: string) => doc.items[id] ?? {}, [doc.items]);

  const value = useMemo<Ctx>(() => ({
    doc, active, selected, gridSnap,
    setActive, setSelected, setGridSnap,
    updateItem, updateTokens, reorder, resetAll,
    undo, redo,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
    getItem, loadDoc,
  }), [doc, active, selected, gridSnap, updateItem, updateTokens, reorder, resetAll, undo, redo, getItem, loadDoc]);

  return <CustomizerCtx.Provider value={value}>{children}</CustomizerCtx.Provider>;
}

export function useCustomizer(): Ctx {
  const ctx = useContext(CustomizerCtx);
  if (!ctx) {
    return {
      doc: EMPTY_DOC, active: false, selected: null, gridSnap: 0,
      setActive: () => {}, setSelected: () => {}, setGridSnap: () => {},
      updateItem: () => {}, updateTokens: () => {}, reorder: () => {}, resetAll: () => {},
      undo: () => {}, redo: () => {}, canUndo: false, canRedo: false,
      getItem: () => ({}), loadDoc: () => {},
    };
  }
  return ctx;
}