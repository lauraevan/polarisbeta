import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { usePolarisMode } from "@/lib/polaris-mode";
import { LiteHome } from "./LiteHome";
import { LiteGames } from "./LiteGames";
import { LiteAI } from "./LiteAI";
import { LiteFlix } from "./LiteFlix";
import { LiteMusic } from "./LiteMusic";
import { LiteBrowser } from "./LiteBrowser";
import { LiteSettings } from "./LiteSettings";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/games", label: "Games" },
  { to: "/media", label: "Flix" },
  { to: "/music", label: "Music" },
  { to: "/ai", label: "AI" },
  { to: "/browser", label: "Browser" },
  { to: "/settings", label: "Settings" },
];

function liteContent(pathname: string, fallback: ReactNode): ReactNode {
  if (pathname === "/" || pathname === "") return <LiteHome />;
  if (pathname.startsWith("/games")) return <LiteGames />;
  if (pathname.startsWith("/media")) return <LiteFlix />;
  if (pathname.startsWith("/music")) return <LiteMusic />;
  if (pathname.startsWith("/ai")) return <LiteAI />;
  if (pathname.startsWith("/browser")) return <LiteBrowser />;
  if (pathname.startsWith("/settings")) return <LiteSettings />;
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold">Not available in Lite</h1>
      <p className="mt-2 text-sm text-neutral-400">
        This page isn't part of the lightweight build. Switch to Heavyweight in Settings to use it.
      </p>
      <div className="mt-4 hidden">{fallback}</div>
    </div>
  );
}

export function LiteShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { setMode } = usePolarisMode();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100" style={{ fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif" }}>
      <header className="sticky top-0 z-30 border-b border-neutral-800 bg-neutral-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2 sm:px-4">
          <Link to="/" className="mr-2 font-black tracking-tight text-white">
            Polaris<span className="text-neutral-500">·lite</span>
          </Link>
          <nav className="flex flex-1 items-center gap-1 overflow-x-auto text-sm">
            {NAV.map((n) => {
              const active =
                n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`shrink-0 rounded px-2.5 py-1.5 ${
                    active
                      ? "bg-neutral-100 text-neutral-900"
                      : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <button
            onClick={() => setMode("heavy")}
            title="Switch to Heavyweight mode"
            className="shrink-0 rounded border border-neutral-700 px-2.5 py-1.5 text-xs text-neutral-300 hover:bg-neutral-800"
          >
            Heavy
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl">{liteContent(pathname, children)}</main>
      <footer className="mx-auto mt-10 max-w-6xl px-4 pb-10 text-center text-xs text-neutral-600">
        Polaris Lite · system fonts · no animations · no wallpapers
      </footer>
    </div>
  );
}