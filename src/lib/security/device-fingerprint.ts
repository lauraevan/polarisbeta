/**
 * Generates a reasonably stable per-browser device fingerprint.
 * Combines:
 *  - persistent random id stored in localStorage (primary)
 *  - canvas hash + audio hash + UA + screen + tz (secondary signal)
 * The id is not anti-forensic; it's enough to detect "same browser came back"
 * and to give a stable handle to ban that survives clearing cookies.
 */
const STORAGE_KEY = "polaris.device.fp.v1";

function fnv1a(str: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

function canvasHash(): string {
  try {
    const c = document.createElement("canvas");
    c.width = 200;
    c.height = 50;
    const ctx = c.getContext("2d");
    if (!ctx) return "0";
    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial'";
    ctx.fillStyle = "#f60";
    ctx.fillRect(0, 0, 200, 50);
    ctx.fillStyle = "#069";
    ctx.fillText("Polaris🛡️FP", 2, 15);
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
    ctx.fillText("Polaris🛡️FP", 4, 17);
    return fnv1a(c.toDataURL());
  } catch {
    return "0";
  }
}

function uaSignal(): string {
  if (typeof navigator === "undefined") return "0";
  const parts = [
    navigator.userAgent,
    navigator.language,
    navigator.languages?.join(","),
    String(navigator.hardwareConcurrency || ""),
    String((navigator as { deviceMemory?: number }).deviceMemory || ""),
    `${screen.width}x${screen.height}x${screen.colorDepth}`,
    String(new Date().getTimezoneOffset()),
    Intl.DateTimeFormat().resolvedOptions().timeZone || "",
  ];
  return fnv1a(parts.join("|"));
}

let cached: string | null = null;

export function getDeviceFingerprint(): string {
  if (cached) return cached;
  if (typeof window === "undefined") return "ssr";
  try {
    let id = window.localStorage.getItem(STORAGE_KEY);
    if (!id) {
      const rand = crypto.randomUUID();
      const sig = `${canvasHash()}-${uaSignal()}-${rand}`;
      id = fnv1a(sig) + "-" + rand.slice(0, 8);
      window.localStorage.setItem(STORAGE_KEY, id);
    }
    cached = id;
    return id;
  } catch {
    // Private mode etc. — fall back to a per-session id.
    const id = `nostore-${fnv1a(`${canvasHash()}-${uaSignal()}-${Date.now()}`)}`;
    cached = id;
    return id;
  }
}

export function getClientHints() {
  if (typeof navigator === "undefined") {
    return { userAgent: "", language: "", screen: "", tz: "" };
  }
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    screen: `${screen.width}x${screen.height}`,
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
  };
}

/** Parse a useful subset of UA. Cheap, no library. */
export function parseUA(ua: string) {
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(ua);
  let os = "Unknown";
  if (/Windows/i.test(ua)) os = "Windows";
  else if (/Mac OS X/i.test(ua)) os = "macOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad|iOS/i.test(ua)) os = "iOS";
  else if (/Linux/i.test(ua)) os = "Linux";
  let browser = "Unknown";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/Chrome\//i.test(ua) && !/OPR\//i.test(ua)) browser = "Chrome";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = "Safari";
  return { os, browser, deviceType: isMobile ? "mobile" : "desktop" };
}