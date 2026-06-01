import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useTabCloak } from "./tab-cloaker";

// "Panic mode" / anti-monitoring quick-hide.
// Notes & honesty for the agent: a web page CANNOT detect classroom-monitoring
// software like GoGuardian/Securly/Hapara — those run as OS-level agents and
// are completely outside the browser sandbox. What we CAN do, and what tools
// like Monoxide.dev / Edgenuity-cloakers actually ship, is:
//   1. A panic hotkey that instantly cloaks the tab (title + favicon) and
//      replaces the visible UI with an innocent "fake" page (Google Classroom
//      / Docs / etc.).
//   2. A second hotkey to restore. Restoration requires no auth — the
//      assumption is the user is the one watching over their shoulder.
//   3. A localStorage toggle so the user can configure the keys themselves.

type PanicCtx = {
  panicHotkey: string;
  setPanicHotkey: (k: string) => void;
  panicCloak: string; // cloak id to switch to on panic
  setPanicCloak: (id: string) => void;
  panicUrl: string;  // url to embed for the disguise
  setPanicUrl: (u: string) => void;
  active: boolean;
  trigger: () => void;
  exit: () => void;
};

const Ctx = createContext<PanicCtx | null>(null);
const KEY_HOTKEY = "polaris-panic-hotkey";
const KEY_CLOAK = "polaris-panic-cloak";
const KEY_URL = "polaris-panic-url";

export const PANIC_CLOAK_DEFAULT = "gclass";
export const PANIC_HOTKEY_DEFAULT = "F9";
export const PANIC_URL_DEFAULT = "https://classroom.google.com/";

export function PanicModeProvider({ children }: { children: ReactNode }) {
  const { setCloakId } = useTabCloak();
  const [panicHotkey, _setHotkey] = useState<string>(PANIC_HOTKEY_DEFAULT);
  const [panicCloak, _setCloak] = useState<string>(PANIC_CLOAK_DEFAULT);
  const [panicUrl, _setUrl] = useState<string>(PANIC_URL_DEFAULT);
  const [active, setActive] = useState(false);

  useEffect(() => {
    try {
      const k = localStorage.getItem(KEY_HOTKEY); if (k) _setHotkey(k);
      const c = localStorage.getItem(KEY_CLOAK); if (c) _setCloak(c);
      const u = localStorage.getItem(KEY_URL); if (u) _setUrl(u);
    } catch { /* noop */ }
  }, []);

  const setPanicHotkey = useCallback((k: string) => {
    _setHotkey(k); try { localStorage.setItem(KEY_HOTKEY, k); } catch { /* noop */ }
  }, []);
  const setPanicCloak = useCallback((id: string) => {
    _setCloak(id); try { localStorage.setItem(KEY_CLOAK, id); } catch { /* noop */ }
  }, []);
  const setPanicUrl = useCallback((u: string) => {
    _setUrl(u); try { localStorage.setItem(KEY_URL, u); } catch { /* noop */ }
  }, []);

  const trigger = useCallback(() => {
    setCloakId(panicCloak);
    setActive(true);
  }, [panicCloak, setCloakId]);

  const exit = useCallback(() => setActive(false), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Panic toggle: configured key. Esc exits panic when active.
      if (e.key === panicHotkey) {
        e.preventDefault();
        setActive((on) => {
          const next = !on;
          if (next) setCloakId(panicCloak);
          return next;
        });
      } else if (active && e.key === "Escape") {
        setActive(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [panicHotkey, panicCloak, setCloakId, active]);

  const value = useMemo(
    () => ({ panicHotkey, setPanicHotkey, panicCloak, setPanicCloak, panicUrl, setPanicUrl, active, trigger, exit }),
    [panicHotkey, panicCloak, panicUrl, active, setPanicHotkey, setPanicCloak, setPanicUrl, trigger, exit],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePanicMode() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePanicMode outside PanicModeProvider");
  return ctx;
}

/** Full-screen disguise that takes over the viewport when panic mode is active. */
export function PanicOverlay() {
  const { active, panicUrl, exit } = usePanicMode();
  if (!active) return null;
  return (
    <div className="fixed inset-0 z-[2147483647] bg-white">
      <iframe
        title="Google Classroom"
        src={panicUrl}
        className="h-full w-full border-0"
        // sandbox left permissive so the page renders normally
      />
      {/* A tiny, deniable exit affordance in the corner — looks like a scrollbar nub */}
      <button
        onClick={exit}
        aria-label="Exit panic mode"
        title="Exit (Esc)"
        className="fixed bottom-1 right-1 z-[2147483647] h-3 w-3 cursor-default rounded-sm bg-transparent"
      />
    </div>
  );
}