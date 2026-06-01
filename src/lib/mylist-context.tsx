import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { TmdbItem, MediaKind } from "./tmdb";

export type ListEntry = TmdbItem & { kind: MediaKind };

export type GameEntry = {
  id: string;        // unique key, e.g. slug or steam id
  title: string;
  cover?: string;
  source?: string;   // "polaris" | "hydra" | "gn-math" | ...
  launchUrl?: string;
};

type Ctx = {
  list: ListEntry[];
  has: (kind: MediaKind, id: number) => boolean;
  add: (item: ListEntry) => void;
  remove: (kind: MediaKind, id: number) => void;
  games: GameEntry[];
  hasGame: (id: string) => boolean;
  addGame: (g: GameEntry) => void;
  removeGame: (id: string) => void;
};

const C = createContext<Ctx | null>(null);
const KEY = "polarisflix-mylist";
const GKEY = "polaris-mylist-games";

export function MyListProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<ListEntry[]>([]);
  const [games, setGames] = useState<GameEntry[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setList(JSON.parse(raw));
    } catch {}
    try {
      const raw = window.localStorage.getItem(GKEY);
      if (raw) setGames(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(KEY, JSON.stringify(list));
  }, [list]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(GKEY, JSON.stringify(games));
  }, [games]);

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
        games,
        hasGame: (id) => games.some((g) => g.id === id),
        addGame: (g) =>
          setGames((prev) => (prev.some((x) => x.id === g.id) ? prev : [g, ...prev])),
        removeGame: (id) => setGames((prev) => prev.filter((g) => g.id !== id)),
      }}
    >
      {children}
    </C.Provider>
  );
}

export function useMyList() {
  const ctx = useContext(C);
  if (!ctx) {
    // Safe default so the hook works outside the provider (e.g. SSR / before mount).
    return {
      list: [],
      has: () => false,
      add: () => {},
      remove: () => {},
      games: [],
      hasGame: () => false,
      addGame: () => {},
      removeGame: () => {},
    } as Ctx;
  }
  return ctx;
}