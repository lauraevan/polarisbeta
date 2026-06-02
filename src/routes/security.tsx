import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth-context";
import { useAdmin } from "@/lib/admin-context";
import {
  adminListSessions, adminListEvents, adminListBans, adminSecurityStats,
  adminQuickBan, adminLiftBan, whoAmI, adminLookupTarget,
} from "@/lib/security/admin-security.functions";
import {
  Shield, Search, Ban, RefreshCw, AlertTriangle, Fingerprint, Activity,
  Eye, ChevronLeft, X, ChevronRight,
} from "lucide-react";

export const Route = createFileRoute("/security")({
  head: () => ({ meta: [{ title: "Security HQ — Polaris" }, { name: "robots", content: "noindex" }] }),
  component: SecurityPage,
});

// react-globe.gl pulls three.js → must be client-only
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

  const [sessions, setSessions] = useState<Session[]>([]);
  const [events, setEvents] = useState<SecEvent[]>([]);
  const [bans, setBans] = useState<BanRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [me, setMe] = useState<Awaited<ReturnType<typeof whoAmI>> | null>(null);
  const [selected, setSelected] = useState<Session | null>(null);

  // Filters
  const [vpnOnly, setVpnOnly] = useState(false);
  const [country, setCountry] = useState("");
  const [since, setSince] = useState<"24h" | "7d" | "30d" | "all">("7d");

  // Lookup
  const [lookupQ, setLookupQ] = useState("");
  const [dossier, setDossier] = useState<Awaited<ReturnType<typeof adminLookupTarget>> | null>(null);
  const [busy, setBusy] = useState(false);

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
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { if (isOwner) refresh(); /* eslint-disable-next-line */ }, [isOwner]);

  const sinceIso = useMemo(() => {
    const now = Date.now();
    const ms = since === "24h" ? 86400000 : since === "7d" ? 7 * 86400000 : since === "30d" ? 30 * 86400000 : 0;
    return ms ? new Date(now - ms).toISOString() : null;
  }, [since]);

  const filteredSessions = useMemo(() => sessions.filter((s) => {
    if (vpnOnly && !s.is_vpn && !s.is_proxy && !s.is_tor) return false;
    if (country && s.country !== country.toUpperCase()) return false;
    if (sinceIso && s.last_seen_at < sinceIso) return false;
    return true;
  }), [sessions, vpnOnly, country, sinceIso]);

  const points = useMemo(() => filteredSessions
    .filter((s) => typeof s.latitude === "number" && typeof s.longitude === "number")
    .map((s) => ({
      lat: s.latitude!, lng: s.longitude!,
      label: `${s.username ?? "guest"} · ${s.city ?? "?"} ${s.country ?? ""}`,
      color: s.is_vpn || s.is_proxy || s.is_tor ? "#ef4444" : s.user_id ? "#22d3ee" : "#a3a3a3",
      size: Math.min(1.2, 0.25 + Math.log10((s.visit_count ?? 1) + 1) * 0.4),
      session: s,
    })), [filteredSessions]);

  const banPoints = useMemo(() => events
    .filter((e) => e.kind === "blocked_access" && e.latitude && e.longitude)
    .slice(0, 80)
    .map((e) => ({ startLat: e.latitude!, startLng: e.longitude!, endLat: e.latitude! + 0.01, endLng: e.longitude! + 0.01, color: ["#ef4444", "#f97316"] })),
    [events]);

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
      const d = await fnLookup({ data: {
        query: lookupQ.trim(),
        filters: { country: country || undefined, vpnOnly: vpnOnly || undefined, since: sinceIso ?? undefined },
      }});
      setDossier(d);
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-[#04050b] text-white overflow-hidden">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-red-500/20 bg-black/70 px-6 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate({ to: "/admin" })} className="rounded-lg p-1.5 text-white/60 hover:bg-white/10">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <Shield className="h-6 w-6 text-red-400" />
          <div>
            <div className="text-[10px] uppercase tracking-[0.4em] text-red-300/80">Classified · Owner only</div>
            <h1 className="font-mono text-xl font-black">SECURITY HQ</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Stat label="Active bans" v={stats?.activeBans ?? 0} accent="red" />
          <Stat label="Blocked 24h" v={stats?.blocked24h ?? 0} accent="red" />
          <Stat label="VPN hits 24h" v={stats?.vpnAttempts24h ?? 0} accent="amber" />
          <Stat label="New devices 24h" v={stats?.newDevices24h ?? 0} />
          <Stat label="Total sessions" v={stats?.totalSessions ?? 0} />
          <button onClick={refresh} className="rounded-lg bg-white/5 p-1.5 hover:bg-white/10" title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[340px_1fr_360px]">
        {/* LEFT: My IP + Filters + Lookup */}
        <aside className="flex flex-col gap-3 overflow-y-auto border-r border-white/10 bg-black/40 p-4">
          <section className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-cyan-300">
              <Crosshair className="h-3 w-3" /> Your Connection
            </div>
            <div className="mt-2 font-mono text-lg font-bold tabular-nums">{me?.ip || "—"}</div>
            {me?.geo ? (
              <div className="mt-2 space-y-1 text-xs text-white/70">
                <Row k="Location" v={`${me.geo.city ?? "?"}, ${me.geo.region ?? ""} ${me.geo.country ?? ""}`} />
                <Row k="ISP" v={me.geo.org ?? "—"} />
                <Row k="ASN" v={me.geo.asn ?? "—"} />
                <Row k="Hostname" v={me.geo.hostname ?? "—"} />
                <Row k="Timezone" v={me.geo.timezone ?? "—"} />
                <Row k="Coords" v={me.geo.latitude && me.geo.longitude ? `${me.geo.latitude.toFixed(3)}, ${me.geo.longitude.toFixed(3)}` : "—"} />
                <div className="flex flex-wrap gap-1 pt-1">
                  {me.geo.is_vpn && <Tag c="red">VPN</Tag>}
                  {me.geo.is_proxy && <Tag c="red">Proxy</Tag>}
                  {me.geo.is_tor && <Tag c="red">Tor</Tag>}
                  {me.geo.is_hosting && <Tag c="amber">Hosting</Tag>}
                  {!me.geo.is_vpn && !me.geo.is_proxy && !me.geo.is_tor && <Tag c="emerald">Clean</Tag>}
                </div>
              </div>
            ) : (
              <div className="mt-2 text-xs text-white/40">Geo lookup unavailable</div>
            )}
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-white/55">
              <Filter className="h-3 w-3" /> Advanced Filters
            </div>
            <label className="mt-3 flex items-center gap-2 text-xs">
              <input type="checkbox" checked={vpnOnly} onChange={(e) => setVpnOnly(e.target.checked)} />
              VPN / Proxy / Tor only
            </label>
            <div className="mt-2">
              <div className="text-[10px] uppercase tracking-wider text-white/45">Country (ISO-2)</div>
              <input value={country} onChange={(e) => setCountry(e.target.value.toUpperCase().slice(0, 2))} placeholder="US" maxLength={2}
                className="mt-1 w-full rounded-lg bg-white/5 px-2 py-1.5 text-xs uppercase outline-none ring-1 ring-white/10 focus:ring-cyan-500/50" />
            </div>
            <div className="mt-2">
              <div className="text-[10px] uppercase tracking-wider text-white/45">Time window</div>
              <div className="mt-1 grid grid-cols-4 gap-1">
                {(["24h", "7d", "30d", "all"] as const).map((w) => (
                  <button key={w} onClick={() => setSince(w)}
                    className={`rounded-md px-2 py-1 text-[11px] ${since === w ? "bg-cyan-500/30 text-cyan-100" : "bg-white/5 text-white/60 hover:bg-white/10"}`}>{w}</button>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-red-300">
              <Search className="h-3 w-3" /> FBI Lookup
            </div>
            <p className="mt-1 text-[11px] text-white/55">Username, user UUID, IP, or device fingerprint.</p>
            <div className="mt-2 flex gap-1">
              <input value={lookupQ} onChange={(e) => setLookupQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runLookup()}
                placeholder="e.g. johndoe or 1.2.3.4"
                className="w-full rounded-lg bg-black/50 px-2 py-1.5 font-mono text-xs outline-none ring-1 ring-red-500/30 focus:ring-red-500/60" />
              <button onClick={runLookup} disabled={busy} className="rounded-lg bg-red-500/30 px-3 text-xs font-bold text-red-100 hover:bg-red-500/50 disabled:opacity-40">
                Run
              </button>
            </div>
          </section>
        </aside>

        {/* CENTER: Globe + Dossier */}
        <main className="relative overflow-hidden bg-[radial-gradient(circle_at_50%_30%,#0c1230,#04050b_70%)]">
          <Suspense fallback={<div className="grid h-full place-items-center text-white/30">Loading globe…</div>}>
            <Globe
              globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
              bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
              backgroundColor="rgba(0,0,0,0)"
              atmosphereColor="#3b82f6"
              atmosphereAltitude={0.15}
              pointsData={points}
              pointLat="lat"
              pointLng="lng"
              pointColor="color"
              pointAltitude={0.02}
              pointRadius="size"
              pointLabel="label"
              onPointClick={(p) => setSelected((p as { session: Session }).session)}
              ringsData={banPoints.map((b) => ({ lat: b.startLat, lng: b.startLng }))}
              ringLat="lat"
              ringLng="lng"
              ringColor={() => "#ef4444"}
              ringMaxRadius={2}
              ringPropagationSpeed={2}
              ringRepeatPeriod={1200}
            />
          </Suspense>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-[11px] backdrop-blur">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><Dot c="#22d3ee" /> Logged in</span>
              <span className="flex items-center gap-1"><Dot c="#a3a3a3" /> Guest</span>
              <span className="flex items-center gap-1"><Dot c="#ef4444" /> VPN/Proxy</span>
              <span className="flex items-center gap-1"><Dot c="#ef4444" ring /> Block hit</span>
            </div>
          </div>

          {/* Dossier overlay */}
          {dossier && (
            <div className="absolute inset-x-4 top-4 max-h-[80%] overflow-y-auto rounded-2xl border border-red-500/30 bg-black/85 p-4 text-xs backdrop-blur-xl">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Fingerprint className="h-4 w-4 text-red-400" />
                  <div className="font-mono text-sm font-bold">DOSSIER · {lookupQ}</div>
                </div>
                <button onClick={() => setDossier(null)} className="rounded bg-white/10 px-2 py-0.5 text-[10px] hover:bg-white/20">Close</button>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <Card title="Profile">
                  {dossier.profile ? (
                    <>
                      <Row k="Username" v={`@${dossier.profile.username ?? "—"}`} />
                      <Row k="ID" v={String(dossier.profile.id).slice(0, 8) + "…"} />
                      <Row k="Owner" v={dossier.profile.is_owner ? "yes" : "no"} />
                      <Row k="Banned" v={dossier.profile.is_banned ? "yes" : "no"} />
                    </>
                  ) : <div className="text-white/40">No profile match</div>}
                </Card>
                <Card title="Identifiers">
                  <Row k="IPs" v={dossier.summary.ips.length} />
                  <Row k="Devices" v={dossier.summary.fingerprints.length} />
                  <Row k="Countries" v={dossier.summary.countries.join(", ") || "—"} />
                  <Row k="ASNs" v={dossier.summary.asns.slice(0, 3).join(", ") || "—"} />
                  <Row k="VPN hits" v={dossier.summary.vpnHits} />
                </Card>
                <Card title="Bans hit">
                  {dossier.bans.length === 0 ? <div className="text-white/40">None</div> :
                    dossier.bans.slice(0, 5).map((t, i) => {
                      const obj = t as { id: string; scope: string; value: string; bans?: { type?: string; status?: string } };
                      return (
                        <div key={i} className="rounded bg-white/5 px-2 py-1">
                          <span className="font-mono">{obj.scope}</span> · {obj.bans?.type ?? "?"} · {obj.bans?.status ?? "?"}
                        </div>
                      );
                    })}
                </Card>
              </div>

              <div className="mt-3 max-h-48 overflow-y-auto rounded-xl border border-white/10">
                <table className="w-full text-[11px]">
                  <thead className="sticky top-0 bg-black/80 text-left text-white/55"><tr>
                    <th className="px-2 py-1">When</th><th className="px-2 py-1">IP</th><th className="px-2 py-1">Geo</th>
                    <th className="px-2 py-1">ASN</th><th className="px-2 py-1">UA</th><th className="px-2 py-1">Flags</th>
                  </tr></thead>
                  <tbody>
                    {dossier.sessions.slice(0, 50).map((s) => (
                      <tr key={s.id} className="border-t border-white/5">
                        <td className="px-2 py-1 text-white/50">{new Date(s.last_seen_at).toLocaleString()}</td>
                        <td className="px-2 py-1 font-mono">{s.ip ?? "—"}</td>
                        <td className="px-2 py-1">{[s.city, s.country].filter(Boolean).join(", ") || "—"}</td>
                        <td className="px-2 py-1 text-white/60">{s.asn ?? "—"}</td>
                        <td className="px-2 py-1 text-white/40">{s.browser} · {s.os}</td>
                        <td className="px-2 py-1">{s.is_vpn ? "🛡VPN " : ""}{s.is_proxy ? "🔁Proxy " : ""}{s.is_tor ? "🧅Tor" : ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>

        {/* RIGHT: Live feed + Selected + Bans */}
        <aside className="flex flex-col gap-3 overflow-y-auto border-l border-white/10 bg-black/40 p-4">
          {selected && (
            <section className="rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-3">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-cyan-300">
                <MapPin className="h-3 w-3" /> Pin selected
              </div>
              <div className="mt-1 font-mono text-sm">@{selected.username ?? "guest"}</div>
              <div className="space-y-0.5 text-[11px]">
                <Row k="IP" v={selected.ip ?? "—"} />
                <Row k="Geo" v={`${selected.city ?? "?"}, ${selected.country ?? ""}`} />
                <Row k="Device" v={`${selected.browser ?? "?"} · ${selected.os ?? ""}`} />
                <Row k="Fingerprint" v={selected.device_fingerprint.slice(0, 16) + "…"} />
                <Row k="Visits" v={selected.visit_count} />
              </div>
              <button onClick={() => { setLookupQ(selected.username || selected.ip || selected.device_fingerprint); runLookup(); }}
                className="mt-2 w-full rounded-lg bg-red-500/30 px-2 py-1 text-[11px] font-bold text-red-100 hover:bg-red-500/50">
                <Search className="mr-1 inline h-3 w-3" /> Pull dossier
              </button>
            </section>
          )}

          <section>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-white/55">
              <Activity className="h-3 w-3" /> Live event feed
            </div>
            <div className="mt-2 space-y-1.5">
              {events.slice(0, 40).map((e) => (
                <div key={e.id} className="rounded-lg border border-white/5 bg-white/[0.03] px-2 py-1.5 text-[11px]">
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
                  <div className="mt-1 flex gap-1">
                    <button disabled={busy} onClick={() => quickBan(e.id, "full_site", ["user", "ip", "device"])}
                      className="rounded bg-red-500/30 px-1.5 py-0.5 text-[10px] text-red-100 hover:bg-red-500/50 disabled:opacity-40">Full ban</button>
                    <button disabled={busy} onClick={() => quickBan(e.id, "chat_only", ["user"])}
                      className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-100 hover:bg-amber-500/40 disabled:opacity-40">Chat ban</button>
                    <button disabled={busy} onClick={() => quickBan(e.id, "shadow", ["user", "device"])}
                      className="rounded bg-violet-500/20 px-1.5 py-0.5 text-[10px] text-violet-100 hover:bg-violet-500/40 disabled:opacity-40">Shadow</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-white/55">
              <Wifi className="h-3 w-3" /> Active bans ({bans.filter((b) => b.status === "active").length})
            </div>
            <div className="mt-2 space-y-1">
              {bans.filter((b) => b.status === "active").slice(0, 20).map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.03] px-2 py-1.5 text-[11px]">
                  <div>
                    <div className="font-mono">{b.type}</div>
                    <div className="text-white/55 line-clamp-1">{b.reason}</div>
                  </div>
                  <button onClick={async () => { await fnLift({ data: { banId: b.id, reason: "Lifted from HQ" } }); refresh(); }}
                    className="rounded bg-white/10 px-2 py-1 text-[10px] hover:bg-white/20">Lift</button>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, v, accent }: { label: string; v: number; accent?: "red" | "amber" }) {
  const cls = accent === "red" ? "text-red-300" : accent === "amber" ? "text-amber-300" : "text-white/80";
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1">
      <div className="text-[9px] uppercase tracking-wider text-white/45">{label}</div>
      <div className={`font-mono text-sm font-bold tabular-nums ${cls}`}>{v.toLocaleString()}</div>
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
function Dot({ c, ring }: { c: string; ring?: boolean }) {
  return <span className={`inline-block h-2 w-2 rounded-full ${ring ? "ring-2 ring-offset-1 ring-offset-black" : ""}`} style={{ background: c, boxShadow: ring ? `0 0 0 2px ${c}40` : undefined }} />;
}
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2">
      <div className="mb-1 text-[10px] uppercase tracking-wider text-white/45">{title}</div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}