type StorageArea = "localStorage" | "sessionStorage";

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => Array.from(values.keys())[index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, String(value)),
  };
}

function ensureStorage(area: StorageArea) {
  if (typeof window === "undefined") return;
  try {
    const storage = window[area];
    const probe = "__polaris_storage_probe__";
    storage.setItem(probe, "1");
    storage.removeItem(probe);
  } catch {
    try {
      Object.defineProperty(window, area, {
        configurable: true,
        value: createMemoryStorage(),
      });
    } catch {
      // If the browser refuses replacement, safeGetItem/safeSetItem below still prevent crashes.
    }
  }
}

ensureStorage("localStorage");
ensureStorage("sessionStorage");

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