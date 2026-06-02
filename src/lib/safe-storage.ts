type StorageArea = "localStorage" | "sessionStorage";

function getStorage(area: StorageArea): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window[area];
  } catch {
    return null;
  }
}

export function safeGetItem(area: StorageArea, key: string): string | null {
  try {
    return getStorage(area)?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function safeSetItem(area: StorageArea, key: string, value: string) {
  try {
    getStorage(area)?.setItem(key, value);
  } catch {
    // Third-party embeds can block storage. Keep the app running with in-memory defaults.
  }
}

export function safeRemoveItem(area: StorageArea, key: string) {
  try {
    getStorage(area)?.removeItem(key);
  } catch {
    // noop
  }
}