// Tiny helpers shared by Polaris Lite. Kept dependency-free for size.

import { useEffect, useState } from "react";

/** Debounced value — Lite uses it so search inputs don't hammer remote APIs. */
export function useDebounced<T>(value: T, delay = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

/** sessionStorage-backed JSON fetch cache. Safe on SSR (no-op when no window). */
export async function cachedFetchJson<T = unknown>(
  url: string,
  init?: RequestInit & { ttlMs?: number },
): Promise<T> {
  const ttl = init?.ttlMs ?? 5 * 60_000;
  const key = `lite:fetch:${url}`;
  if (typeof window !== "undefined") {
    try {
      const raw = sessionStorage.getItem(key);
      if (raw) {
        const { t, d } = JSON.parse(raw) as { t: number; d: T };
        if (Date.now() - t < ttl) return d;
      }
    } catch { /* ignore */ }
  }
  const res = await fetch(url, init);
  const data = (await res.json()) as T;
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), d: data }));
    } catch { /* quota — ignore */ }
  }
  return data;
}