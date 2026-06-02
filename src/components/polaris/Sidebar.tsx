import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
  Crown,
  Music,
  Music2,
  HardDrive,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Pin,
  PinOff,
} from "lucide-react";
import logo from "@/assets/polaris-logo.png";
import { useSidebarState } from "@/lib/sidebar-context";
import { useShowDiscord } from "@/lib/ui-prefs";
import { safeGetItem, safeSetItem } from "@/lib/safe-storage";
import { ProfileButton } from "./ProfileButton";

type NavItem = { to: string; label: string; icon: typeof Home };
type NavGroup = { id: string; label: string; items: NavItem[] };

const HOME_ITEM: NavItem = { to: "/", label: "Home", icon: Home };

const GROUPS: NavGroup[] = [
  {
    id: "entertainment",
    label: "Entertainment",
    items: [
      { to: "/media", label: "Cinema", icon: Tv },
      { to: "/music", label: "Music", icon: Music },
      { to: "/games", label: "Games", icon: Gamepad2 },
      { to: "/emulator", label: "Emulator", icon: Joystick },
      { to: "/soundboard", label: "Soundboard", icon: Music2 },
      { to: "/mylist", label: "My List", icon: Bookmark },
    ],
  },
  {
    id: "tools",
    label: "Tools",
    items: [
      { to: "/browser", label: "Browser", icon: Globe2 },
      { to: "/apps", label: "Apps", icon: LayoutGrid },
      { to: "/ai", label: "AI Tools", icon: Sparkles },
      { to: "/image-gen", label: "Image Gen 2", icon: ImageIcon },
      { to: "/vpn", label: "Tunnel", icon: Shield },
      { to: "/os", label: "Polaris OS", icon: HardDrive },
    ],
  },
  {
    id: "social",
    label: "Social",
    items: [
      { to: "/chat", label: "Chat", icon: MessageCircle },
      { to: "/partners", label: "Partners", icon: Handshake },
    ],
  },
  {
    id: "account",
    label: "Account",
    items: [
      { to: "/premium", label: "Premium", icon: Crown },
      { to: "/shop", label: "Shop", icon: ShoppingBag },
      { to: "/settings", label: "Settings", icon: SettingsIcon },
    ],
  },
];

const ALL_ITEMS: NavItem[] = [HOME_ITEM, ...GROUPS.flatMap((g) => g.items)];
const PINS_KEY = "polaris-sidebar-pins";
const COLLAPSED_GROUPS_KEY = "polaris-sidebar-collapsed-groups";

function usePins() {
  const [pins, setPins] = useState<string[]>([]);
  useEffect(() => {
    try {
      const raw = safeGetItem("localStorage", PINS_KEY);
      if (raw) setPins(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);
  function save(next: string[]) {
    setPins(next);
    safeSetItem("localStorage", PINS_KEY, JSON.stringify(next));
  }
  return {
    pins,
    isPinned: (to: string) => pins.includes(to),
    toggle: (to: string) =>
      save(pins.includes(to) ? pins.filter((x) => x !== to) : [...pins, to]),
  };
}

function useCollapsedGroups() {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  useEffect(() => {
    try {
      const raw = safeGetItem("localStorage", COLLAPSED_GROUPS_KEY);
      if (raw) setCollapsed(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);
  function toggleGroup(id: string) {
    setCollapsed((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      safeSetItem("localStorage", COLLAPSED_GROUPS_KEY, JSON.stringify(next));
      return next;
    });
  }
  return { collapsed, toggleGroup };
}

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
  const [showDiscord] = useShowDiscord();
  const { pins, isPinned, toggle: togglePin } = usePins();
  const { collapsed: groupCollapsed, toggleGroup } = useCollapsedGroups();
  const pinned = pins
    .map((to) => ALL_ITEMS.find((i) => i.to === to))
    .filter((x): x is NavItem => Boolean(x));
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

      <nav className={`mt-4 flex-1 space-y-2 overflow-y-auto pb-2 ${collapsed ? "px-2" : "px-3"} scrollbar-none`}>
        {/* Home is always at the top */}
        <NavRow item={HOME_ITEM} active={path === HOME_ITEM.to} collapsed={collapsed} pinned={isPinned(HOME_ITEM.to)} onTogglePin={() => togglePin(HOME_ITEM.to)} />

        {/* Pinned section */}
        {pinned.length > 0 && (
          <Section label="Pinned" collapsed={collapsed} open>
            {pinned.map((item) => (
              <NavRow key={`pin-${item.to}`} item={item} active={path === item.to} collapsed={collapsed} pinned onTogglePin={() => togglePin(item.to)} />
            ))}
          </Section>
        )}

        {GROUPS.map((g) => {
          const open = !groupCollapsed[g.id];
          return (
            <Section
              key={g.id}
              label={g.label}
              collapsed={collapsed}
              open={open}
              onToggle={() => toggleGroup(g.id)}
            >
              {g.items.map((item) => (
                <NavRow
                  key={item.to}
                  item={item}
                  active={path === item.to}
                  collapsed={collapsed}
                  pinned={isPinned(item.to)}
                  onTogglePin={() => togglePin(item.to)}
                />
              ))}
            </Section>
          );
        })}
      </nav>

      <div className={`border-t border-white/5 ${collapsed ? "px-2 py-3" : "p-3"}`}>
        {showDiscord && (
          <a
            href="https://discord.gg/fUhccQjbT"
            target="_blank"
            rel="noreferrer"
            title="Join the Polaris Discord"
            className={`mb-2 flex items-center rounded-xl text-sm transition ${
              collapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2"
            } text-white/80 hover:text-white`}
            style={{
              background:
                "linear-gradient(135deg, rgba(88,101,242,0.30), rgba(88,101,242,0.08))",
              boxShadow: "inset 0 0 0 1px rgba(88,101,242,0.45)",
            }}
          >
            <MessageCircle className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && <span className="font-semibold">Join Discord</span>}
          </a>
        )}
        <ProfileButton collapsed={collapsed} />
      </div>
    </aside>
  );
}

function Section({
  label,
  collapsed,
  open,
  onToggle,
  children,
}: {
  label: string;
  collapsed: boolean;
  open: boolean;
  onToggle?: () => void;
  children: React.ReactNode;
}) {
  if (collapsed) {
    // Always-visible icon strip with a faint divider above each group
    return (
      <div className="mt-2 space-y-1 border-t border-white/5 pt-2 first:mt-0 first:border-0 first:pt-0">
        {children}
      </div>
    );
  }
  return (
    <div className="space-y-0.5">
      <button
        onClick={onToggle}
        disabled={!onToggle}
        className="flex w-full items-center gap-1.5 px-2 pt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45 transition hover:text-white/80 disabled:cursor-default"
      >
        {onToggle && (
          <ChevronDown
            className={`h-3 w-3 transition-transform ${open ? "" : "-rotate-90"}`}
          />
        )}
        {label}
      </button>
      {open && <div className="space-y-0.5">{children}</div>}
    </div>
  );
}

function NavRow({
  item,
  active,
  collapsed,
  pinned,
  onTogglePin,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  pinned: boolean;
  onTogglePin: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      title={collapsed ? item.label : undefined}
      className={`group relative flex items-center rounded-xl text-sm transition-all ${
        collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2"
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
      {!collapsed && (
        <>
          <span className="relative flex-1 truncate font-medium">{item.label}</span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onTogglePin();
            }}
            aria-label={pinned ? "Unpin" : "Pin to top"}
            title={pinned ? "Unpin" : "Pin to top"}
            className={`relative rounded p-0.5 transition ${
              pinned ? "text-[rgb(var(--polaris-accent))]" : "text-white/0 group-hover:text-white/50 hover:text-white"
            }`}
          >
            {pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
          </button>
        </>
      )}
    </Link>
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
        {ALL_ITEMS.map((item) => {
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
        {ALL_ITEMS.map((item) => {
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