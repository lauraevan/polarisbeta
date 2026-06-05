import { useEffect, useState } from "react";
import { safeGetItem, safeSetItem } from "./safe-storage";

const KEY = "polaris-play-continue";
const MAX = 12;

export type RecentGame = {
  id: string;
  title: string;
  cover?: string;
  src: string;
  mode: "src" | "srcdoc";
  source?: string;
  ts: number;
};

function read(): RecentGame[] {
  try {
    const raw = safeGetItem("localStorage", KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function write(list: RecentGame[]) {
  safeSetItem("localStorage", KEY, JSON.stringify(list.slice(0, MAX)));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("polaris-play-continue-changed"));
  }
}

export function recordPlay(g: Omit<RecentGame, "ts">) {
  const cur = read().filter((x) => x.id !== g.id);
  cur.unshift({ ...g, ts: Date.now() });
  write(cur);
}

export function useContinuePlaying(): RecentGame[] {
  const [list, setList] = useState<RecentGame[]>(() => (typeof window === "undefined" ? [] : read()));
  useEffect(() => {
    const sync = () => setList(read());
    window.addEventListener("polaris-play-continue-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("polaris-play-continue-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return list;
}