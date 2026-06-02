import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Gamepad2,
  Tv,
  Globe2,
  LayoutGrid,
  Sparkles,
  Joystick,
  MessageCircle,
  Settings as SettingsIcon,
  ShoppingBag,
  Bookmark,
  Handshake,
  Shield,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import logo from "@/assets/polaris-logo.png";
import { useSidebarState } from "@/lib/sidebar-context";
import { ProfileButton } from "./ProfileButton";

const nav = [
  { to: "/", label: "Home", icon: Home },
  { to: "/games", label: "Games", icon: Gamepad2 },
  { to: "/media", label: "Cinema", icon: Tv },
  { to: "/browser", label: "Browser", icon: Globe2 },
  { to: "/apps", label: "Apps", icon: LayoutGrid },
  { to: "/ai", label: "AI Tools", icon: Sparkles },
  { to: "/mylist", label: "My List", icon: Bookmark },
  { to: "/emulator", label: "Emulator", icon: Joystick },
  { to: "/chat", label: "Chat", icon: MessageCircle },
  { to: "/shop", label: "Shop", icon: ShoppingBag },
  { to: "/partners", label: "Partners", icon: Handshake },
  { to: "/vpn", label: "VPN", icon: Shield },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

export function Sidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { collapsed, toggle, orientation } = useSidebarState();

  return (
    <>
      {/* Phone + small tablet: compact top bar (icons-only, scrollable) */}
      <MobileTopNav path={path} />
      {/* Desktop (lg+): side rail OR full-width top bar based on orientation */}
      {orientation === "side" ? (
        <DesktopSide path={path} collapsed={collapsed} toggle={toggle} />
      ) : (
        <DesktopTop path={path} />
      )}
    </>
  );
}

function Brand({ small = false }: { small?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative shrink-0">
        <img
          src={logo}
          alt="Polaris One"
          className={small ? "h-7 w-7 object-contain" : "h-9 w-9 object-contain"}
          style={{ mixBlendMode: "plus-lighter" }}
        />
        <div
          className="absolute inset-0 -z-10 rounded-lg blur-xl opacity-70"
          style={{ background: `rgba(var(--polaris-accent)/0.55)` }}
        />
      </div>
      {!small && (
        <div className="overflow-hidden leading-tight">
          <div className="truncate text-[15px] font-semibold tracking-wide text-white">Polaris One</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-white/40">Web OS</div>
        </div>
      )}
    </div>
  );
}

function DesktopSide({
  path,
  collapsed,
  toggle,
}: {
  path: string;
  collapsed: boolean;
  toggle: () => void;
}) {
  const width = collapsed ? "w-[68px]" : "w-60";
  return (
    <aside
      className={`liquid-glass-strong sticky top-0 z-20 hidden h-screen ${width} shrink-0 flex-col self-start rounded-none transition-[width] duration-300 ease-out lg:flex`}
    >
      {/* Brand */}
      <div className={`flex items-center pt-6 pb-2 ${collapsed ? "justify-center px-2" : "gap-3 px-5"}`}>
        <Brand small={collapsed} />
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="liquid-glass absolute -right-3 top-7 z-30 hidden h-6 w-6 items-center justify-center rounded-full text-white/85 hover:text-white lg:flex"
      >
        {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>

      <nav className={`mt-5 flex-1 space-y-1 ${collapsed ? "px-2" : "px-3"}`}>
        {nav.map((item) => {
          const active = path === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              title={collapsed ? item.label : undefined}
              className={`group relative flex items-center rounded-xl text-sm transition-all ${
                collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5"
              } ${active ? "text-white" : "text-white/65 hover:bg-white/5 hover:text-white"}`}
            >
              {active && (
                <span
                  className="pointer-events-none absolute inset-0 rounded-xl"
                  style={{
                    background: `linear-gradient(90deg, rgba(var(--polaris-accent)/0.22), rgba(var(--polaris-accent)/0.05))`,
                    boxShadow: `inset 0 0 0 1px rgba(var(--polaris-accent)/0.45), 0 10px 30px -10px rgba(var(--polaris-accent)/0.5)`,
                  }}
                />
              )}
              <Icon className="relative h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span className="relative font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className={`border-t border-white/5 ${collapsed ? "px-2 py-3" : "p-3"}`}>
        <ProfileButton collapsed={collapsed} />
      </div>
    </aside>
  );
}

function DesktopTop({ path }: { path: string }) {
  return (
    <header className="liquid-glass-strong sticky top-0 z-20 hidden w-full items-center gap-3 rounded-none border-b border-white/5 px-4 py-2 lg:flex">
      <div className="shrink-0">
        <Brand small />
      </div>
      <span className="mx-1 h-6 w-px shrink-0 bg-white/15" />
      <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto scrollbar-none">
        {nav.map((item) => {
          const active = path === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              title={item.label}
              className={`relative flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition xl:px-3 ${
                active ? "text-white" : "text-white/65 hover:bg-white/5 hover:text-white"
              }`}
            >
              {active && (
                <span
                  className="pointer-events-none absolute inset-0 rounded-lg"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(var(--polaris-accent)/0.22), rgba(var(--polaris-accent)/0.05))",
                    boxShadow: "inset 0 0 0 1px rgba(var(--polaris-accent)/0.45)",
                  }}
                />
              )}
              <Icon className="relative h-4 w-4 shrink-0" />
              <span className="relative hidden font-medium xl:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="shrink-0">
        <ProfileButton collapsed />
      </div>
    </header>
  );
}

function MobileTopNav({ path }: { path: string }) {
  return (
    <header className="liquid-glass-strong sticky top-0 z-20 flex w-full items-center gap-2 rounded-none border-b border-white/5 px-3 py-2 lg:hidden">
      <div className="shrink-0">
        <Brand small />
      </div>
      <nav
        className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto scrollbar-none"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {nav.map((item) => {
          const active = path === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              title={item.label}
              aria-label={item.label}
              className={`relative grid h-9 w-9 shrink-0 place-items-center rounded-lg transition ${
                active ? "text-white" : "text-white/60 hover:text-white"
              }`}
            >
              {active && (
                <span
                  className="pointer-events-none absolute inset-0 rounded-lg"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(var(--polaris-accent)/0.28), rgba(var(--polaris-accent)/0.08))",
                    boxShadow: "inset 0 0 0 1px rgba(var(--polaris-accent)/0.5)",
                  }}
                />
              )}
              <Icon className="relative h-[18px] w-[18px] shrink-0" />
            </Link>
          );
        })}
      </nav>
      <div className="shrink-0">
        <ProfileButton collapsed />
      </div>
    </header>
  );
}