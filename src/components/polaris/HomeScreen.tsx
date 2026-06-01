import { Link } from "@tanstack/react-router";
import { Fragment, useEffect, useState } from "react";
import {
  FlixLogo,
  AnimeLogo,
  GamesLogo,
  MusicLogo,
  AppsLogo,
  BrowserLogo,
  LiveLogo,
  SettingsLogo,
  ChatLogo,
  AiLogo,
} from "./brand-logos";
import { WallpaperLayer } from "./WallpaperLayer";
import { WallpaperProvider } from "@/lib/wallpaper-context";
import { isDesktopMode } from "@/lib/runtime-mode";
import { ShoppingBag, LayoutGrid } from "lucide-react";

const DAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

type DockApp = {
  id: string;
  label: string;
  to?: string;
  href?: string;
  Logo: React.ComponentType<{ size?: number }>;
  webOnly?: boolean;
};

const APPS: DockApp[] = [
  { id: "apps", label: "Launchpad", to: "/apps", Logo: AppsLogo },
  { id: "games", label: "Games", to: "/games", Logo: GamesLogo },
  { id: "flix", label: "Polaris Flix", to: "/media", Logo: FlixLogo },
  { id: "anime", label: "Anime", to: "/media", Logo: AnimeLogo },
  { id: "live", label: "Live TV", to: "/media", Logo: LiveLogo },
  { id: "music", label: "Music", to: "/apps", Logo: MusicLogo },
  { id: "ai", label: "AI", to: "/ai", Logo: AiLogo },
  { id: "chat", label: "Chat", to: "/chat", Logo: ChatLogo },
  { id: "browser", label: "Browser", to: "/browser", Logo: BrowserLogo },
  { id: "settings", label: "Settings", to: "/settings", Logo: SettingsLogo },
];

export function HomeScreen() {
  const [now, setNow] = useState<Date | null>(null);
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    setNow(new Date());
    setDesktop(isDesktopMode());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const day = now ? DAYS[now.getDay()] : "";
  const time = now
    ? now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : "";
  const date = now
    ? now.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" })
    : "";

  return (
    <WallpaperProvider>
      <div className="relative h-screen w-screen overflow-hidden text-white">
        <WallpaperLayer />

        {/* Giant day-of-week — Mona Sans, lightweight, wide tracking */}
        <div className="pointer-events-none absolute inset-x-0 top-[6vh] flex flex-col items-center">
          <h1
            className="text-center text-white"
            style={{
              fontFamily: '"Mona Sans", system-ui, sans-serif',
              fontWeight: 300,
              fontSize: "clamp(56px, 11vw, 168px)",
              letterSpacing: "0.06em",
              lineHeight: 1,
              textShadow: "0 8px 40px rgba(0,0,0,0.55)",
            }}
          >
            {day || "\u00a0"}
          </h1>
          <div
            className="mt-3 flex items-center gap-3 text-white/90"
            style={{
              fontFamily: '"Mona Sans", system-ui, sans-serif',
              fontWeight: 400,
              fontSize: "clamp(14px, 1.6vw, 22px)",
              letterSpacing: "0.18em",
            }}
            suppressHydrationWarning
          >
            <span suppressHydrationWarning>{time}</span>
            <span className="opacity-50">·</span>
            <span suppressHydrationWarning>{date}</span>
          </div>
        </div>

        {/* Sidebar quick-access (top-left) — small unobtrusive grid button */}
        <Link
          to="/apps"
          aria-label="Launchpad"
          className="liquid-glass absolute left-4 top-4 z-30 grid h-10 w-10 place-items-center rounded-xl text-white/85 hover:text-white"
        >
          <LayoutGrid className="h-4 w-4" />
        </Link>
        {!desktop && (
          <Link
            to="/shop"
            aria-label="Shop"
            className="liquid-glass absolute right-4 top-4 z-30 grid h-10 w-10 place-items-center rounded-xl text-white/85 hover:text-white"
          >
            <ShoppingBag className="h-4 w-4" />
          </Link>
        )}

        {/* Floating dock — brand-tile strip matching the reference */}
        <HomeDock desktop={desktop} />
      </div>
    </WallpaperProvider>
  );
}

function HomeDock({ desktop }: { desktop: boolean }) {
  const apps = APPS.filter((a) => !(a.webOnly && desktop));
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-30 flex justify-center px-4">
      <div className="liquid-glass pointer-events-auto flex max-w-[96vw] items-center gap-2 overflow-x-auto rounded-3xl px-3 py-2 sm:gap-3 sm:px-4 sm:py-3">
        {apps.map((app, i) => {
          const Logo = app.Logo;
          const inner = (
            <span
              className="group relative inline-flex shrink-0 items-center justify-center transition-transform duration-200 hover:-translate-y-1"
              title={app.label}
            >
              <Logo size={48} />
            </span>
          );
          return (
            <Fragment key={app.id}>
              {i > 0 && <span className="h-8 w-px shrink-0 bg-white/15" />}
              {app.to ? (
                <Link to={app.to} className="shrink-0">
                  {inner}
                </Link>
              ) : (
                <a href={app.href} className="shrink-0">
                  {inner}
                </a>
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}