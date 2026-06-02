import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth-context";
import { useAdmin } from "@/lib/admin-context";
import {
  adminListSessions, adminListEvents, adminListBans, adminSecurityStats,
  adminQuickBan, adminLiftBan, whoAmI, adminLookupTarget, adminCreateBan,
  adminSuggestTargets,
} from "@/lib/security/admin-security.functions";
import {
  Shield, Search, Ban, RefreshCw, AlertTriangle, Fingerprint, Activity,
  Eye, ChevronLeft, X, MonitorSmartphone, UserX,
} from "lucide-react";

export const Route = createFileRoute("/security")({
  head: () => ({ meta: [{ title: "Security HQ — Polaris" }, { name: "robots", content: "noindex" }] }),
  component: SecurityPage,
});

const Globe = lazy(() => import("react-globe.gl").then((m) => ({ default: m.default })));

type Session = {
  id: string; user_id: string | null; username: string | null;
  device_fingerprint: string; ip: string | null; country: string | null;
  region: string | null; city: string | null; latitude: number | null;
  longitude: number | null; asn: string | null; org: string | null;
  is_vpn: boolean; is_proxy: boolean; is_tor: boolean; trusted: boolean;
  browser: string | null; os: string | null; device_type: string | null;
  last_seen_at: string; first_seen_at: string; visit_count: number;
  user_agent: string | null;
};
type SecEvent = {
  id: string; kind: string; severity: string; user_id: string | null;
  username: string | null; ip: string | null; device_fingerprint: string | null;
  country: string | null; city: string | null; latitude: number | null;
  longitude: number | null; is_vpn: boolean; is_proxy: boolean; is_tor: boolean;
  ban_id: string | null; path: string | null; created_at: string;
};
type BanRow = { id: string; type: string; reason: string; status: string; created_at: string; expires_at: string | null };
type Stats = {
  activeBans: number; totalBans: number; events24h: number; blocked24h: number;
  newDevices24h: number; vpnAttempts24h: number; totalSessions: number; pendingAppeals: number;
};
type Panel = "feed" | "lookup" | "me" | "bans" | "devices" | "guests" | null;

type Suggestion =
  | { kind: "user"; label: string; sub: string; query: string; emoji: string | null; banned: boolean }
  | { kind: "guest"; label: string; sub: string; query: string };

function SecurityPage() {
  const { user, loading } = useAuth();
  const { isOwner } = useAdmin();
  const navigate = useNavigate();

  const fnSessions = useServerFn(adminListSessions);
  const fnEvents = useServerFn(adminListEvents);
  const fnBans = useServerFn(adminListBans);
  const fnStats = useServerFn(adminSecurityStats);
  const fnQuickBan = useServerFn(adminQuickBan);
  const fnLift = useServerFn(adminLiftBan);
  const fnWhoAmI = useServerFn(whoAmI);
  const fnLookup = useServerFn(adminLookupTarget);
  const fnCreateBan = useServerFn(adminCreateBan);
  const fnSuggest = useServerFn(adminSuggestTargets);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [events, setEvents] = useState<SecEvent[]>([]);
  const [bans, setBans] = useState<BanRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [me, setMe] = useState<Awaited<ReturnType<typeof whoAmI>> | null>(null);
  const [selected, setSelected] = useState<Session | null>(null);
  const [panel, setPanel] = useState<Panel>(null);

  const [lookupQ, setLookupQ] = useState("");
  const [dossier, setDossier] = useState<Awaited<ReturnType<typeof adminLookupTarget>> | null>(null);
  const [busy, setBusy] = useState(false);

  // Viewport sizing so the globe truly fills the screen
  const [vp, setVp] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const fit = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  const refresh = async () => {
    try {
      const [s, e, b, st, w] = await Promise.all([
        fnSessions(), fnEvents({ data: { limit: 500 } }), fnBans(), fnStats(), fnWhoAmI(),
      ]);
      setSessions(s as Session[]);
      setEvents(e as SecEvent[]);
      setBans(((b as { bans: BanRow[] }).bans) ?? []);
      setStats(st as Stats);
      setMe(w);
    } catch (err) { console.error(err); }
  };
  useEffect(() => { if (isOwner) refresh(); /* eslint-disable-next-line */ }, [isOwner]);

  const points = useMemo(() => sessions
    .filter((s) => typeof s.latitude === "number" && typeof s.longitude === "number")
    .map((s) => ({
      lat: s.latitude!, lng: s.longitude!,
      label: `${s.username ?? "guest"} · ${s.city ?? "?"} ${s.country ?? ""}`,
      color: s.is_vpn || s.is_proxy || s.is_tor ? "#ef4444" : s.user_id ? "#22d3ee" : "#94a3b8",
      size: Math.min(1.0, 0.2 + Math.log10((s.visit_count ?? 1) + 1) * 0.35),
      session: s,
    })), [sessions]);

  const ringPoints = useMemo(() => events
    .filter((e) => e.kind === "blocked_access" && e.latitude && e.longitude)
    .slice(0, 60)
    .map((e) => ({ lat: e.latitude!, lng: e.longitude! })), [events]);

  if (loading) return null;
  if (!user) return <Navigate to="/" />;
  if (!isOwner) return <Navigate to="/" />;

  const quickBan = async (eventId: string, type: "full_site" | "chat_only" | "shadow", scopes: Array<"user" | "ip" | "device">) => {
    setBusy(true);
    try { await fnQuickBan({ data: { eventId, type, scopes, reason: "Quick-banned from Security HQ" } }); await refresh(); }
    finally { setBusy(false); }
  };
  const runLookup = async () => {
    if (!lookupQ.trim()) return;
    setBusy(true);
    try {
      const d = await fnLookup({ data: { query: lookupQ.trim(), filters: {} } });
      setDossier(d);
      setPanel("lookup");
    } finally { setBusy(false); }
  };

  const activeBans = bans.filter((b) => b.status === "active").length;

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden bg-black text-white">
      {/* Fullscreen globe */}
      <div className="absolute inset-0">
        <Suspense fallback={<div className="grid h-full place-items-center text-white/30">Loading globe…</div>}>
          {vp.w > 0 && (
            <Globe
              width={vp.w}
              height={vp.h}
              globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
              bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
              backgroundColor="rgba(0,0,0,0)"
              atmosphereColor="#60a5fa"
              atmosphereAltitude={0.18}
              pointsData={points}
              pointLat="lat"
              pointLng="lng"
              pointColor="color"
              pointAltitude={0.015}
              pointRadius="size"
              pointLabel="label"
              onPointClick={(p) => setSelected((p as { session: Session }).session)}
              ringsData={ringPoints}
              ringColor={() => "#ef4444"}
              ringMaxRadius={2.5}
              ringPropagationSpeed={2}
              ringRepeatPeriod={1400}
            />
          )}
        </Suspense>
        {/* subtle vignette */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.75)_100%)]" />
      </div>

      {/* Minimal top bar */}
      <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate({ to: "/admin" })} className="rounded-full bg-white/5 p-2 backdrop-blur hover:bg-white/10">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-red-400" />
            <span className="font-mono text-sm tracking-[0.3em] text-white/80">SECURITY</span>
          </div>
        </div>

        {/* Floating search */}
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
          <input
            value={lookupQ}
            onChange={(e) => setLookupQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runLookup()}
            placeholder="Lookup user, IP, or fingerprint…"
            className="w-full rounded-full border border-white/10 bg-black/40 py-2 pl-9 pr-3 font-mono text-xs outline-none backdrop-blur placeholder:text-white/30 focus:border-white/30"
          />
        </div>

        <button onClick={refresh} className="rounded-full bg-white/5 p-2 backdrop-blur hover:bg-white/10" title="Refresh">
          <RefreshCw className="h-4 w-4" />
        </button>
      </header>

      {/* Floating compact stat strip */}
      <div className="absolute left-1/2 top-16 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/10 bg-black/50 px-2 py-1 backdrop-blur">
        <Pill label="Bans" v={stats?.activeBans ?? 0} tone="red" />
        <Pill label="Blocked 24h" v={stats?.blocked24h ?? 0} tone="red" />
        <Pill label="VPN 24h" v={stats?.vpnAttempts24h ?? 0} tone="amber" />
        <Pill label="New devices" v={stats?.newDevices24h ?? 0} />
        <Pill label="Sessions" v={stats?.totalSessions ?? 0} />
      </div>

      {/* Bottom dock */}
      <nav className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/10 bg-black/60 p-1 backdrop-blur-xl">
        <DockBtn icon={<Activity className="h-4 w-4" />} label="Feed" active={panel === "feed"} onClick={() => setPanel(panel === "feed" ? null : "feed")} />
        <DockBtn icon={<MonitorSmartphone className="h-4 w-4" />} label={`Devices · ${sessions.length}`} active={panel === "devices"} onClick={() => setPanel(panel === "devices" ? null : "devices")} />
        <DockBtn icon={<Ban className="h-4 w-4" />} label={`Bans · ${activeBans}`} active={panel === "bans"} onClick={() => setPanel(panel === "bans" ? null : "bans")} />
        <DockBtn icon={<Fingerprint className="h-4 w-4" />} label="Me" active={panel === "me"} onClick={() => setPanel(panel === "me" ? null : "me")} />
      </nav>

      {/* Legend */}
      <div className="absolute bottom-5 right-5 z-10 flex items-center gap-3 rounded-full border border-white/10 bg-black/50 px-3 py-1.5 text-[10px] backdrop-blur">
        <span className="flex items-center gap-1"><Dot c="#22d3ee" /> User</span>
        <span className="flex items-center gap-1"><Dot c="#94a3b8" /> Guest</span>
        <span className="flex items-center gap-1"><Dot c="#ef4444" /> Flagged</span>
      </div>

      {/* Selected pin floating card */}
      {selected && (
        <FloatingCard onClose={() => setSelected(null)} title={`@${selected.username ?? "guest"}`} className="left-5 top-28">
          <Row k="IP" v={selected.ip ?? "—"} />
          <Row k="Geo" v={`${selected.city ?? "?"}, ${selected.country ?? ""}`} />
          <Row k="Device" v={`${selected.browser ?? "?"} · ${selected.os ?? ""}`} />
          <Row k="Fingerprint" v={selected.device_fingerprint.slice(0, 16) + "…"} />
          <Row k="Visits" v={selected.visit_count} />
          <button onClick={() => { setLookupQ(selected.username || selected.ip || selected.device_fingerprint); runLookup(); }}
            className="mt-2 w-full rounded-full bg-red-500/30 px-3 py-1.5 text-[11px] font-bold text-red-100 hover:bg-red-500/50">
            Pull dossier
          </button>
        </FloatingCard>
      )}

      {/* Panels */}
      {panel === "feed" && (
        <FloatingPanel title="Live feed" onClose={() => setPanel(null)}>
          <div className="space-y-1.5">
            {events.slice(0, 30).map((e) => (
              <div key={e.id} className="rounded-xl border border-white/5 bg-white/[0.03] px-2.5 py-2 text-[11px]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {e.kind === "blocked_access" ? <Ban className="h-3 w-3 text-red-400" />
                      : e.kind === "new_device" ? <AlertTriangle className="h-3 w-3 text-amber-400" />
                      : <Eye className="h-3 w-3 text-white/40" />}
                    <span className="font-mono">{e.kind}</span>
                  </div>
                  <span className="text-white/40">{new Date(e.created_at).toLocaleTimeString()}</span>
                </div>
                <div className="mt-0.5 text-white/65">
                  @{e.username ?? "guest"} · {e.ip ?? "?"} · {e.city ?? ""} {e.country ?? ""}
                  {(e.is_vpn || e.is_proxy || e.is_tor) && <span className="ml-1 text-red-300">⚠</span>}
                </div>
                <div className="mt-1.5 flex gap-1">
                  <button disabled={busy} onClick={() => quickBan(e.id, "full_site", ["user", "ip", "device"])}
                    className="rounded-full bg-red-500/30 px-2 py-0.5 text-[10px] text-red-100 hover:bg-red-500/50 disabled:opacity-40">Full</button>
                  <button disabled={busy} onClick={() => quickBan(e.id, "chat_only", ["user"])}
                    className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-100 hover:bg-amber-500/40 disabled:opacity-40">Chat</button>
                  <button disabled={busy} onClick={() => quickBan(e.id, "shadow", ["user", "device"])}
                    className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] text-violet-100 hover:bg-violet-500/40 disabled:opacity-40">Shadow</button>
                </div>
              </div>
            ))}
            {events.length === 0 && <div className="py-6 text-center text-xs text-white/40">No events yet</div>}
          </div>
        </FloatingPanel>
      )}

      {panel === "bans" && (
        <FloatingPanel title={`Active bans · ${activeBans}`} onClose={() => setPanel(null)}>
          <div className="space-y-1">
            {bans.filter((b) => b.status === "active").map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-2.5 py-2 text-[11px]">
                <div className="min-w-0">
                  <div className="font-mono">{b.type}</div>
                  <div className="line-clamp-1 text-white/55">{b.reason}</div>
                </div>
                <button onClick={async () => { await fnLift({ data: { banId: b.id, reason: "Lifted from HQ" } }); refresh(); }}
                  className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] hover:bg-white/20">Lift</button>
              </div>
            ))}
            {activeBans === 0 && <div className="py-6 text-center text-xs text-white/40">No active bans</div>}
          </div>
        </FloatingPanel>
      )}

      {panel === "me" && (
        <FloatingPanel title="Your connection" onClose={() => setPanel(null)}>
          <div className="font-mono text-lg font-bold tabular-nums">{me?.ip || "—"}</div>
          {me?.geo ? (
            <div className="mt-2 space-y-1 text-[11px] text-white/70">
              <Row k="Location" v={`${me.geo.city ?? "?"}, ${me.geo.region ?? ""} ${me.geo.country ?? ""}`} />
              <Row k="ISP" v={me.geo.org ?? "—"} />
              <Row k="ASN" v={me.geo.asn ?? "—"} />
              <Row k="Hostname" v={me.geo.hostname ?? "—"} />
              <Row k="Timezone" v={me.geo.timezone ?? "—"} />
              <div className="flex flex-wrap gap-1 pt-1">
                {me.geo.is_vpn && <Tag c="red">VPN</Tag>}
                {me.geo.is_proxy && <Tag c="red">Proxy</Tag>}
                {me.geo.is_tor && <Tag c="red">Tor</Tag>}
                {!me.geo.is_vpn && !me.geo.is_proxy && !me.geo.is_tor && <Tag c="emerald">Clean</Tag>}
              </div>
            </div>
          ) : <div className="mt-2 text-xs text-white/40">Geo lookup unavailable</div>}
        </FloatingPanel>
      )}

      {panel === "devices" && (
        <FloatingPanel title={`Devices ever seen · ${sessions.length}`} onClose={() => setPanel(null)} wide>
          <div className="mb-2 text-[11px] text-white/55">
            Every device fingerprint that has ever loaded the site, with the IP, location and account they were on the first time we saw them. Ban a device or its first IP directly — works even if the visitor never signs in.
          </div>
          <div className="max-h-[60vh] overflow-y-auto rounded-xl border border-white/10">
            <table className="w-full text-[11px]">
              <thead className="sticky top-0 bg-black/85 text-left text-white/55">
                <tr>
                  <th className="px-2 py-1.5">First seen</th>
                  <th className="px-2 py-1.5">User</th>
                  <th className="px-2 py-1.5">Fingerprint</th>
                  <th className="px-2 py-1.5">IP</th>
                  <th className="px-2 py-1.5">Geo</th>
                  <th className="px-2 py-1.5">Device</th>
                  <th className="px-2 py-1.5">Flags</th>
                  <th className="px-2 py-1.5 text-right">Ban</th>
                </tr>
              </thead>
              <tbody>
                {[...sessions]
                  .sort((a, b) => a.first_seen_at.localeCompare(b.first_seen_at))
                  .map((s) => (
                    <tr key={s.id} className="border-t border-white/5 hover:bg-white/[0.03]">
                      <td className="px-2 py-1 text-white/55">{new Date(s.first_seen_at).toLocaleString()}</td>
                      <td className="px-2 py-1">
                        {s.username ? <span className="text-cyan-300">@{s.username}</span> : <span className="text-white/40">guest</span>}
                      </td>
                      <td className="px-2 py-1 font-mono text-white/70" title={s.device_fingerprint}>
                        {s.device_fingerprint.slice(0, 12)}…
                      </td>
                      <td className="px-2 py-1 font-mono">{s.ip ?? "—"}</td>
                      <td className="px-2 py-1">{[s.city, s.country].filter(Boolean).join(", ") || "—"}</td>
                      <td className="px-2 py-1 text-white/55">{s.browser ?? "?"} · {s.os ?? "?"}</td>
                      <td className="px-2 py-1">
                        {s.is_vpn && <Tag c="red">VPN</Tag>}{" "}
                        {s.is_proxy && <Tag c="red">PX</Tag>}{" "}
                        {s.is_tor && <Tag c="red">Tor</Tag>}
                      </td>
                      <td className="px-2 py-1 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            disabled={busy}
                            title="Ban this device fingerprint (works on guests)"
                            onClick={async () => {
                              setBusy(true);
                              try {
                                const targets: Array<{ scope: "device" | "ip" | "user"; value: string }> = [
                                  { scope: "device", value: s.device_fingerprint },
                                ];
                                if (s.ip) targets.push({ scope: "ip", value: s.ip });
                                if (s.user_id) targets.push({ scope: "user", value: s.user_id });
                                await fnCreateBan({ data: { type: "full_site", reason: "Banned from Devices panel", targets } });
                                await refresh();
                              } finally { setBusy(false); }
                            }}
                            className="rounded-full bg-red-500/30 px-2 py-0.5 text-[10px] text-red-100 hover:bg-red-500/50 disabled:opacity-40">
                            Device + IP
                          </button>
                          {s.ip && (
                            <button
                              disabled={busy}
                              title="Ban only this IP"
                              onClick={async () => {
                                setBusy(true);
                                try {
                                  await fnCreateBan({ data: { type: "full_site", reason: "IP ban from Devices panel", targets: [{ scope: "ip", value: s.ip! }] } });
                                  await refresh();
                                } finally { setBusy(false); }
                              }}
                              className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] hover:bg-white/20 disabled:opacity-40">
                              IP
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                {sessions.length === 0 && (
                  <tr><td colSpan={8} className="py-6 text-center text-white/40">No devices logged yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </FloatingPanel>
      )}

      {panel === "lookup" && dossier && (
        <FloatingPanel title={`Dossier · ${lookupQ}`} onClose={() => { setPanel(null); setDossier(null); }} wide>
          <div className="grid gap-2 sm:grid-cols-3">
            <Card title="Profile">
              {dossier.profile ? (
                <>
                  <Row k="User" v={`@${dossier.profile.username ?? "—"}`} />
                  <Row k="Owner" v={dossier.profile.is_owner ? "yes" : "no"} />
                  <Row k="Banned" v={dossier.profile.is_banned ? "yes" : "no"} />
                </>
              ) : <div className="text-white/40">No profile</div>}
            </Card>
            <Card title="Identifiers">
              <Row k="IPs" v={dossier.summary.ips.length} />
              <Row k="Devices" v={dossier.summary.fingerprints.length} />
              <Row k="Countries" v={dossier.summary.countries.join(", ") || "—"} />
              <Row k="VPN hits" v={dossier.summary.vpnHits} />
            </Card>
            <Card title="Bans hit">
              {dossier.bans.length === 0 ? <div className="text-white/40">None</div> :
                dossier.bans.slice(0, 5).map((t, i) => {
                  const obj = t as { scope: string; bans?: { type?: string; status?: string } };
                  return <div key={i} className="rounded bg-white/5 px-2 py-1 text-[11px]"><span className="font-mono">{obj.scope}</span> · {obj.bans?.type ?? "?"}</div>;
                })}
            </Card>
          </div>
          <div className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-white/10">
            <table className="w-full text-[11px]">
              <thead className="sticky top-0 bg-black/80 text-left text-white/55"><tr>
                <th className="px-2 py-1">When</th><th className="px-2 py-1">IP</th><th className="px-2 py-1">Geo</th><th className="px-2 py-1">UA</th><th className="px-2 py-1">Flags</th>
              </tr></thead>
              <tbody>
                {dossier.sessions.slice(0, 50).map((s) => (
                  <tr key={s.id} className="border-t border-white/5">
                    <td className="px-2 py-1 text-white/50">{new Date(s.last_seen_at).toLocaleString()}</td>
                    <td className="px-2 py-1 font-mono">{s.ip ?? "—"}</td>
                    <td className="px-2 py-1">{[s.city, s.country].filter(Boolean).join(", ") || "—"}</td>
                    <td className="px-2 py-1 text-white/40">{s.browser} · {s.os}</td>
                    <td className="px-2 py-1">{s.is_vpn ? "VPN " : ""}{s.is_proxy ? "Proxy " : ""}{s.is_tor ? "Tor" : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FloatingPanel>
      )}
    </div>
  );
}

function Pill({ label, v, tone }: { label: string; v: number; tone?: "red" | "amber" }) {
  const c = tone === "red" ? "text-red-300" : tone === "amber" ? "text-amber-300" : "text-white/85";
  return (
    <div className="flex items-baseline gap-1.5 rounded-full px-2.5 py-1">
      <span className={`font-mono text-xs font-bold tabular-nums ${c}`}>{v.toLocaleString()}</span>
      <span className="text-[10px] uppercase tracking-wider text-white/45">{label}</span>
    </div>
  );
}
function DockBtn({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs transition ${active ? "bg-white text-black" : "text-white/80 hover:bg-white/10"}`}>
      {icon}<span>{label}</span>
    </button>
  );
}
function FloatingPanel({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={`absolute right-5 top-28 z-10 ${wide ? "left-5" : "w-80"} max-h-[calc(100vh-10rem)] overflow-hidden rounded-2xl border border-white/10 bg-black/70 backdrop-blur-xl`}>
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <div className="text-[10px] uppercase tracking-[0.3em] text-white/55">{title}</div>
        <button onClick={onClose} className="rounded-full p-1 text-white/55 hover:bg-white/10"><X className="h-3.5 w-3.5" /></button>
      </div>
      <div className="max-h-[calc(100vh-14rem)] overflow-y-auto p-3">{children}</div>
    </div>
  );
}
function FloatingCard({ title, onClose, children, className }: { title: string; onClose: () => void; children: React.ReactNode; className?: string }) {
  return (
    <div className={`absolute z-10 w-72 rounded-2xl border border-cyan-500/30 bg-black/70 p-3 backdrop-blur-xl ${className ?? ""}`}>
      <div className="mb-2 flex items-center justify-between">
        <div className="font-mono text-sm">{title}</div>
        <button onClick={onClose} className="rounded-full p-1 text-white/55 hover:bg-white/10"><X className="h-3.5 w-3.5" /></button>
      </div>
      <div className="space-y-0.5 text-[11px]">{children}</div>
    </div>
  );
}
function Row({ k, v }: { k: string; v: string | number }) {
  return <div className="flex justify-between gap-2"><span className="text-white/45">{k}</span><span className="truncate text-right font-mono">{v}</span></div>;
}
function Tag({ c, children }: { c: "red" | "amber" | "emerald"; children: React.ReactNode }) {
  const map = { red: "bg-red-500/20 text-red-200", amber: "bg-amber-500/20 text-amber-200", emerald: "bg-emerald-500/20 text-emerald-200" } as const;
  return <span className={`rounded px-1.5 py-0.5 text-[10px] ${map[c]}`}>{children}</span>;
}
function Dot({ c }: { c: string }) {
  return <span className="inline-block h-2 w-2 rounded-full" style={{ background: c }} />;
}
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2">
      <div className="mb-1 text-[10px] uppercase tracking-wider text-white/45">{title}</div>
      <div className="space-y-0.5 text-[11px]">{children}</div>
    </div>
  );
}