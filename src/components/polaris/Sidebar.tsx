import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Gamepad2,
  Tv,
  LayoutGrid,
  Sparkles,
  Joystick,
  MessageCircle,
  User,
  LogOut,
  Trophy,
  Moon,
  Monitor,
  DiscIcon,
} from "lucide-react";
import logo from "@/assets/polaris-logo.png";

const nav = [
  { to: "/", label: "Home", icon: Home },
  { to: "/games", label: "Games", icon: Gamepad2 },
  { to: "/media", label: "Media", icon: Tv },
  { to: "/apps", label: "Apps", icon: LayoutGrid },
  { to: "/ai", label: "AI Tools", icon: Sparkles },
  { to: "/emulator", label: "Emulator", icon: Joystick },
  { to: "/chat", label: "Chat", icon: MessageCircle },
] as const;

export function Sidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="glass relative z-20 hidden h-screen w-64 shrink-0 flex-col rounded-none border-r border-white/5 md:flex">
      <div className="flex items-center gap-3 px-5 pb-2 pt-6">
        <div className="relative">
          <img src={logo} alt="Polaris One" className="h-9 w-9 rounded-lg object-contain" />
          <div
            className="absolute inset-0 -z-10 rounded-lg blur-xl opacity-70"
            style={{ background: `rgba(var(--polaris-accent)/0.55)` }}
          />
        </div>
        <div className="leading-tight">
          <div className="text-[15px] font-semibold tracking-wide text-white">Polaris One</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-white/40">Web OS</div>
        </div>
      </div>

      <nav className="mt-6 flex-1 space-y-1 px-3">
        {nav.map((item) => {
          const active = path === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                active
                  ? "text-white"
                  : "text-white/65 hover:bg-white/5 hover:text-white"
              }`}
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
              <Icon className="relative h-[18px] w-[18px]" />
              <span className="relative font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/5 p-3">
        <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white">
          <User className="h-[18px] w-[18px]" /> Profile
        </button>
        <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/50 hover:bg-white/5 hover:text-white">
          <LogOut className="h-[18px] w-[18px]" /> Logout
        </button>
        <div className="mt-3 flex items-center gap-2 px-2 text-white/40">
          <DiscIcon className="h-4 w-4 hover:text-white" />
          <Trophy className="h-4 w-4 hover:text-white" />
          <Moon className="h-4 w-4 hover:text-white" />
          <Monitor className="h-4 w-4 hover:text-white" />
        </div>
      </div>
    </aside>
  );
}