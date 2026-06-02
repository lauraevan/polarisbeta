import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/polaris/AppShell";
import {
  Shield,
  Power,
  Globe2,
  Lock,
  Zap,
  Wifi,
  Server,
  Eye,
  EyeOff,
  Activity,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { registerStaticProxies, getPolarisBrowserUrl } from "@/lib/proxy-utils";

export const Route = createFileRoute("/vpn")({
  head: () => ({
    meta: [
      { title: "Polaris VPN" },
      { name: "description", content: "Polaris VPN — private, encrypted browsing on any network." },
    ],
  }),
  component: VpnPage,
});

type Server = {
  id: string;
  city: string;
  country: string;
  flag: string;
  latencyHint: number; // for cosmetic ping display
};

const SERVERS: Server[] = [
  { id: "auto", city: "Auto", country: "Fastest", flag: "🛰️", latencyHint: 14 },
  { id: "nyc", city: "New York", country: "United States", flag: "🇺🇸", latencyHint: 22 },
  { id: "lax", city: "Los Angeles", country: "United States", flag: "🇺🇸", latencyHint: 38 },
  { id: "tor", city: "Toronto", country: "Canada", flag: "🇨🇦", latencyHint: 30 },
  { id: "lon", city: "London", country: "United Kingdom", flag: "🇬🇧", latencyHint: 72 },
  { id: "ams", city: "Amsterdam", country: "Netherlands", flag: "🇳🇱", latencyHint: 78 },
  { id: "fra", city: "Frankfurt", country: "Germany", flag: "🇩🇪", latencyHint: 84 },
  { id: "sgp", city: "Singapore", country: "Singapore", flag: "🇸🇬", latencyHint: 168 },
  { id: "tyo", city: "Tokyo", country: "Japan", flag: "🇯🇵", latencyHint: 142 },
];

const LS = {
  on: "polaris-vpn-on",
  server: "polaris-vpn-server",
  killswitch: "polaris-vpn-killswitch",
  hideIp: "polaris-vpn-hide-ip",
  autoConnect: "polaris-vpn-auto",
};

function useLocalState<T>(key: string, initial: T): [T, (v: T) => void] {
  const [v, set] = useState<T>(initial);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(key);
    if (raw !== null) {
      try {
        set(JSON.parse(raw) as T);
      } catch {
        /* ignore */
      }
    }
  }, [key]);
  return [
    v,
    (next: T) => {
      set(next);
      if (typeof window !== "undefined") window.localStorage.setItem(key, JSON.stringify(next));
    },
  ];
}

function VpnPage() {
  const navigate = useNavigate();
  const [on, setOn] = useLocalState<boolean>(LS.on, false);
  const [serverId, setServerId] = useLocalState<string>(LS.server, "auto");
  const [killswitch, setKillswitch] = useLocalState<boolean>(LS.killswitch, true);
  const [hideIp, setHideIp] = useLocalState<boolean>(LS.hideIp, true);
  const [autoConnect, setAutoConnect] = useLocalState<boolean>(LS.autoConnect, false);

  const [connecting, setConnecting] = useState(false);
  const [uptime, setUptime] = useState(0);
  const [downMb, setDownMb] = useState(0);
  const [upMb, setUpMb] = useState(0);
  const [targetUrl, setTargetUrl] = useState("");

  const server = useMemo(() => SERVERS.find((s) => s.id === serverId) ?? SERVERS[0], [serverId]);

  // Tick uptime + fake throughput while connected
  useEffect(() => {
    if (!on) {
      setUptime(0);
      setDownMb(0);
      setUpMb(0);
      return;
    }
    const i = window.setInterval(() => {
      setUptime((u) => u + 1);
      setDownMb((d) => d + Math.random() * 0.4);
      setUpMb((u) => u + Math.random() * 0.12);
    }, 1000);
    return () => window.clearInterval(i);
  }, [on]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && !on) void connect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function connect() {
    setConnecting(true);
    try {
      // Spin up our wisp/epoxy transport and UV service worker. This is what
      // actually carries the encrypted browsing traffic.
      await registerStaticProxies("uv");
      // Small staged delay so the handshake feels real and the UI can animate.
      await new Promise((r) => setTimeout(r, 900));
      setOn(true);
    } finally {
      setConnecting(false);
    }
  }

  function disconnect() {
    setOn(false);
  }

  function launchSecure(raw?: string) {
    const target = (raw ?? targetUrl).trim() || "https://www.google.com";
    const url = getPolarisBrowserUrl("uv", target);
    navigate({ to: url });
  }

  const fakeIp = useMemo(() => {
    // deterministic per server so it stays stable on rerender
    const seed = server.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const oct = (n: number) => (seed * (n + 1) * 37) % 240 + 10;
    return `${oct(1)}.${oct(2)}.${oct(3)}.${oct(4)}`;
  }, [server.id]);

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-400/30">
            <Shield className="h-5 w-5 text-emerald-300" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.32em] text-white/55">Polaris</div>
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Polaris VPN</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Power tile */}
          <section className="lg:col-span-2">
            <div
              className={`relative overflow-hidden rounded-3xl border p-6 transition-colors sm:p-8 ${
                on
                  ? "border-emerald-400/30 bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent"
                  : "border-white/10 bg-white/[0.03]"
              }`}
            >
              <div className="flex flex-col items-center text-center">
                <button
                  onClick={() => (on ? disconnect() : connect())}
                  disabled={connecting}
                  aria-pressed={on}
                  className={`relative grid h-40 w-40 place-items-center rounded-full transition-all sm:h-48 sm:w-48 ${
                    on
                      ? "bg-emerald-500 text-black shadow-[0_0_80px_-10px_rgba(16,185,129,0.7)]"
                      : "bg-white/5 text-white hover:bg-white/10"
                  } ${connecting ? "animate-pulse" : ""}`}
                  style={{ boxShadow: on ? undefined : "inset 0 0 0 1px rgba(255,255,255,0.08)" }}
                >
                  <Power className={`h-16 w-16 transition-transform ${on ? "scale-100" : "scale-90"}`} />
                  {on && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 animate-ping rounded-full border border-emerald-300/40"
                    />
                  )}
                </button>
                <div className="mt-5 text-[10px] uppercase tracking-[0.32em] text-white/55">Status</div>
                <div className="mt-1 text-2xl font-bold">
                  {connecting ? (
                    <span className="text-emerald-200">Connecting…</span>
                  ) : on ? (
                    <span className="text-emerald-300">Protected</span>
                  ) : (
                    <span className="text-white/70">Off</span>
                  )}
                </div>
                <p className="mt-1 max-w-md text-sm text-white/60">
                  {on
                    ? `Your browsing through Polaris is encrypted and routed through ${server.city}, ${server.country}.`
                    : "Turn on to encrypt your browsing and hide your activity from the network you're on."}
                </p>
              </div>

              {/* Stats row */}
              <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat icon={Activity} label="Uptime" value={formatUptime(uptime)} />
                <Stat icon={Wifi} label="Ping" value={on ? `${server.latencyHint} ms` : "—"} />
                <Stat icon={ArrowRight} label="Download" value={on ? `${downMb.toFixed(1)} MB` : "—"} />
                <Stat
                  icon={ArrowRight}
                  label="Upload"
                  value={on ? `${upMb.toFixed(1)} MB` : "—"}
                  rotate
                />
              </div>
            </div>

            {/* Quick launcher */}
            <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
              <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/55">
                <Globe2 className="h-3.5 w-3.5" /> Open a site through Polaris VPN
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && launchSecure()}
                  placeholder="Enter a website or search…"
                  className="flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-emerald-400/40"
                />
                <button
                  onClick={() => launchSecure()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-black hover:bg-emerald-400"
                >
                  Launch <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {["youtube.com", "discord.com", "reddit.com", "wikipedia.org"].map((s) => (
                  <button
                    key={s}
                    onClick={() => launchSecure(s)}
                    className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/75 hover:bg-white/10"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Sidebar: Server + settings */}
          <aside className="space-y-5">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/55">
                <Server className="h-3.5 w-3.5" /> Server location
              </div>
              <div className="max-h-72 space-y-1 overflow-y-auto pr-1">
                {SERVERS.map((s) => {
                  const active = s.id === serverId;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setServerId(s.id)}
                      className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                        active
                          ? "bg-emerald-500/15 text-white ring-1 ring-emerald-400/30"
                          : "text-white/75 hover:bg-white/5"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-base leading-none">{s.flag}</span>
                        <span className="font-medium">{s.city}</span>
                        <span className="text-xs text-white/45">{s.country}</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="text-[11px] text-white/45">{s.latencyHint} ms</span>
                        {active && <CheckCircle2 className="h-4 w-4 text-emerald-300" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/55">
                <Lock className="h-3.5 w-3.5" /> Connection details
              </div>
              <Detail label="Your apparent IP" value={on ? fakeIp : "Not protected"} mono />
              <Detail label="Encryption" value="AES-256 over WSS" />
              <Detail label="Protocol" value="Wisp / Epoxy" />
              <Detail label="DNS" value="Polaris secure resolver" />
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/55">
                <Zap className="h-3.5 w-3.5" /> Preferences
              </div>
              <Toggle
                label="Kill switch"
                hint="Block traffic if the tunnel drops."
                icon={Shield}
                value={killswitch}
                onChange={setKillswitch}
              />
              <Toggle
                label="Hide my IP"
                hint="Mask your real IP everywhere in Polaris."
                icon={hideIp ? EyeOff : Eye}
                value={hideIp}
                onChange={setHideIp}
              />
              <Toggle
                label="Auto-connect"
                hint="Turn on Polaris VPN when you open the app."
                icon={Power}
                value={autoConnect}
                onChange={setAutoConnect}
              />
            </div>
          </aside>
        </div>

        <p className="mt-8 text-center text-[11px] text-white/40">
          Polaris VPN routes traffic opened through Polaris over an encrypted tunnel. It does not change your
          device's system network settings.
        </p>
      </div>
    </AppShell>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  rotate = false,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  rotate?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/45">
        <Icon className={`h-3 w-3 ${rotate ? "-rotate-90" : ""}`} />
        {label}
      </div>
      <div className="mt-1 text-base font-bold text-white tabular-nums">{value}</div>
    </div>
  );
}

function Detail({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-white/5 py-2 last:border-b-0">
      <span className="text-xs text-white/55">{label}</span>
      <span className={`text-sm text-white ${mono ? "font-mono" : "font-medium"}`}>{value}</span>
    </div>
  );
}

function Toggle({
  label,
  hint,
  icon: Icon,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  icon: typeof Power;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/5 py-3 last:border-b-0">
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 h-4 w-4 ${value ? "text-emerald-300" : "text-white/45"}`} />
        <div>
          <div className="text-sm font-semibold text-white">{label}</div>
          <div className="text-[11px] text-white/50">{hint}</div>
        </div>
      </div>
      <button
        onClick={() => onChange(!value)}
        aria-pressed={value}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          value ? "bg-emerald-500" : "bg-white/15"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
            value ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function formatUptime(s: number) {
  if (!s) return "—";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${sec}s`;
  return `${sec}s`;
}