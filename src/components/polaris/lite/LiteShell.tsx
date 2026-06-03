import { Link, useRouterState } from "@tanstack/react-router";
import { lazy, Suspense, useMemo, type ReactNode } from "react";
import { Home, Gamepad2, Globe, Compass, PlaySquare, Music, MessageCircle, Settings } from "lucide-react";
import { usePolarisMode } from "@/lib/polaris-mode";
import { LiteHome } from "./LiteHome";

const LiteGames = lazy(() => import("./LiteGames").then((m) => ({ default: m.LiteGames })));
const LiteAI = lazy(() => import("./LiteAI").then((m) => ({ default: m.LiteAI })));
const LiteFlix = lazy(() => import("./LiteFlix").then((m) => ({ default: m.LiteFlix })));
const LiteMusic = lazy(() => import("./LiteMusic").then((m) => ({ default: m.LiteMusic })));
const LiteBrowser = lazy(() => import("./LiteBrowser").then((m) => ({ default: m.LiteBrowser })));
const LiteSettings = lazy(() => import("./LiteSettings").then((m) => ({ default: m.LiteSettings })));

const DOCK = [
  { to: "/", label: "Home", Icon: Home },
  { to: "/games", label: "Games", Icon: Gamepad2 },
  { to: "/browser", label: "Browser", Icon: Globe },
  { to: "/", label: "Polaris", Icon: Compass, brand: true },
  { to: "/media", label: "Flix", Icon: PlaySquare },
  { to: "/music", label: "Music", Icon: Music },
  { to: "/ai", label: "AI", Icon: MessageCircle },
];

function liteContent(pathname: string): ReactNode {
  if (pathname === "/" || pathname === "") return <LiteHome />;
  if (pathname.startsWith("/games")) return <LiteGames />;
  if (pathname.startsWith("/media")) return <LiteFlix />;
  if (pathname.startsWith("/music")) return <LiteMusic />;
  if (pathname.startsWith("/ai")) return <LiteAI />;
  if (pathname.startsWith("/browser")) return <LiteBrowser />;
  if (pathname.startsWith("/settings")) return <LiteSettings />;
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 text-center">
      <h1 className="text-2xl font-bold">Not available in Lite</h1>
      <p className="mt-2 text-sm text-white/50">Switch to Heavy in Settings to use it.</p>
    </div>
  );
}

// Deterministic starfield (no re-render flicker, no random per-paint)
function useStars(count = 80) {
  return useMemo(() => {
    let seed = 1337;
    const r = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    return Array.from({ length: count }, () => ({
      x: r() * 100, y: r() * 100, s: r() * 1.8 + 0.4, o: r() * 0.7 + 0.2,
    }));
  }, [count]);
}

export function LiteShell(_: { children?: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { setMode } = usePolarisMode();
  const stars = useStars(90);
  const onHome = pathname === "/" || pathname === "";

  return (
    <div
      className="relative min-h-screen overflow-hidden text-white"
      style={{
        background:
          "radial-gradient(ellipse at 50% 65%, #3a1a14 0%, #1c0a10 55%, #0a0608 100%)",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      }}
    >
      {/* Starfield */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {stars.map((p, i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.s,
              height: p.s,
              borderRadius: "50%",
              background: "#ffd9b0",
              opacity: p.o,
            }}
          />
        ))}
      </div>

      {/* Top bar — minimal, only Settings + Heavy switch */}
      <header className="relative z-20 flex items-center justify-between px-4 py-3">
        <Link to="/" className="text-xs font-black tracking-[0.3em] text-white/70 hover:text-white">
          POLARIS·LITE
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to="/settings"
            className="rounded-full border border-white/10 bg-white/5 p-2 text-white/70 hover:bg-white/10"
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
          </Link>
          <button
            onClick={() => setMode("heavy")}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-white/70 hover:bg-white/10"
            title="Switch to Heavy"
          >
            Heavy
          </button>
        </div>
      </header>

      {/* Page content. Home gets centered hero treatment. */}
      <main className={`relative z-10 ${onHome ? "" : "mx-auto max-w-6xl pb-32"}`}>
        <Suspense fallback={<div className="px-4 py-20 text-center text-xs text-white/40">Loading…</div>}>
          {liteContent(pathname)}
        </Suspense>
      </main>

      {/* Bottom pill dock */}
      <nav className="fixed inset-x-0 bottom-5 z-30 flex justify-center px-3">
        <div
          className="flex items-center gap-1 rounded-full border border-white/10 px-2 py-2 backdrop-blur-xl"
          style={{ background: "rgba(28,12,14,0.78)", boxShadow: "0 10px 40px rgba(0,0,0,0.55)" }}
        >
          {DOCK.map((d, i) => {
            const active =
              d.to === "/" && !d.brand ? pathname === "/" : !d.brand && pathname.startsWith(d.to);
            return (
              <Link
                key={i}
                to={d.to}
                aria-label={d.label}
                className={`group flex h-10 w-10 items-center justify-center rounded-full transition ${
                  d.brand
                    ? "bg-gradient-to-br from-orange-400 via-pink-500 to-fuchsia-500 text-white shadow-[0_0_18px_rgba(255,122,89,0.6)]"
                    : active
                      ? "bg-white/15 text-white"
                      : "text-white/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                <d.Icon className="h-5 w-5" />
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
