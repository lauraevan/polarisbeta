import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { TmdbItem, MediaKind } from "./tmdb";

export type ListEntry = TmdbItem & { kind: MediaKind };

type Ctx = {
  list: ListEntry[];
  has: (kind: MediaKind, id: number) => boolean;
  add: (item: ListEntry) => void;
  remove: (kind: MediaKind, id: number) => void;
};

const C = createContext<Ctx | null>(null);
const KEY = "polarisflix-mylist";

export function MyListProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<ListEntry[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setList(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(KEY, JSON.stringify(list));
  }, [list]);

  return (
    <C.Provider
      value={{
        list,
        has: (k, id) => list.some((i) => i.kind === k && i.id === id),
        add: (item) =>
          setList((prev) =>
            prev.some((i) => i.kind === item.kind && i.id === item.id) ? prev : [item, ...prev]
          ),
        remove: (k, id) => setList((prev) => prev.filter((i) => !(i.kind === k && i.id === id))),
      }}
    >
      {children}
    </C.Provider>
  );
}

export function useMyList() {
  const ctx = useContext(C);
  if (!ctx) throw new Error("useMyList must be used inside MyListProvider");
  return ctx;
}