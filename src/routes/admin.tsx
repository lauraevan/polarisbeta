import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth-context";
import { useAdmin } from "@/lib/admin-context";
import {
  adminListUsers, adminListChannels, adminGrantCoins, adminGrantCredits,
  adminPostAnnouncement, adminBanUser, adminUnbanUser, adminKickUser,
  adminDeleteChannel, adminRevokeOwner, adminRenameUser, adminUpdateChannel,
  adminGetStats, adminDeleteMessage,
} from "@/lib/admin.functions";
import {
  Shield, Coins, Sparkles, Megaphone, Ban, UserX, Hash, LogOut,
  Crown, Users, Trash2, RefreshCw, Search, Home, Pencil, Filter, Lock, Globe2,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Polaris One" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

type AdminUser = {
  id: string; username: string; display_name: string | null;
  avatar_emoji: string | null; avatar_url: string | null;
  is_owner: boolean; is_banned: boolean; ban_reason: string | null; created_at: string;
  wallet: { coins: number; basic_credits: number; premium_credits: number };
};
type AdminChannel = {
  id: string; slug: string; name: string; emoji: string | null;
  filter_enabled?: boolean; allowed_role?: string | null;
};
type AdminStats = {
  me: {
    id: string; username: string; display_name: string | null; created_at: string;
    avatar_emoji: string | null; avatar_url: string | null; banner_url?: string | null;
    banner_color: string; accent_color: string; about_me: string | null;
    custom_role: string | null; spent_coins?: number;
  } | null;
  wallet: { coins: number; basic_credits: number; premium_credits: number };
  totals: { users: number; messages: number; channels: number; banned: number };
  recentMessages: Array<{ id: string; username: string; content: string | null; created_at: string; channel_id: string }>;
};

function AdminPage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const { isAdmin, isOwner, unlock, lock } = useAdmin();
  const navigate = useNavigate();

  const listUsers = useServerFn(adminListUsers);
  const listChannels = useServerFn(adminListChannels);
  const grantCoins = useServerFn(adminGrantCoins);
  const grantCredits = useServerFn(adminGrantCredits);
  const postAnn = useServerFn(adminPostAnnouncement);
  const banUser = useServerFn(adminBanUser);
  const unbanUser = useServerFn(adminUnbanUser);
  const kickUser = useServerFn(adminKickUser);
  const delChannel = useServerFn(adminDeleteChannel);
  const updChannel = useServerFn(adminUpdateChannel);
  const renameUser = useServerFn(adminRenameUser);
  const getStats = useServerFn(adminGetStats);
  const delMessage = useServerFn(adminDeleteMessage);
  const revoke = useServerFn(adminRevokeOwner);

  const [tab, setTab] = useState<"home" | "users" | "economy" | "announce" | "channels" | "moderation">("home");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [channels, setChannels] = useState<AdminChannel[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const [ecoUser, setEcoUser] = useState(""); const [ecoCoins, setEcoCoins] = useState(100);
  const [credUser, setCredUser] = useState(""); const [credTier, setCredTier] = useState<"basic" | "premium">("basic");
  const [credAmt, setCredAmt] = useState(10);
  const [annTitle, setAnnTitle] = useState(""); const [annBody, setAnnBody] = useState("");
  const [annKind, setAnnKind] = useState<"announcement" | "update" | "alert">("announcement");

  const refresh = async () => {
    try {
      const [u, c, s] = await Promise.all([listUsers(), listChannels(), getStats()]);
      setUsers(u as AdminUser[]);
      setChannels(c as AdminChannel[]);
      setStats(s as AdminStats);
    } catch (e) { setMsg((e as Error).message); }
  };

  useEffect(() => { if (user) refreshProfile(); /* eslint-disable-next-line */ }, [user]);
  // Server profile says owner? Auto-unlock the device flag so the panel works
  // even if localStorage was cleared or the user landed here from a fresh tab.
  useEffect(() => { if (isOwner && !isAdmin) unlock(); }, [isOwner, isAdmin, unlock]);
  useEffect(() => { if (isAdmin || isOwner) refresh(); /* eslint-disable-next-line */ }, [isAdmin, isOwner]);

  if (loading) return null;
  if (!user) return <Navigate to="/" />;
  if (!profile) return <div className="fixed inset-0 grid place-items-center bg-[#06060a] text-white/60 text-sm">Loading admin…</div>;
  // Owner === access. Device flag is a UX convenience, not the gate.
  if (!isOwner) return <Navigate to="/settings" />;

  async function run(fn: () => Promise<unknown>, ok: string) {
    setMsg(null);
    try { await fn(); setMsg(ok); refresh(); }
    catch (e) { setMsg((e as Error).message); }
  }

  const filtered = users.filter((u) =>
    !q.trim() || u.username.toLowerCase().includes(q.toLowerCase())
    || u.display_name?.toLowerCase().includes(q.toLowerCase()),
  );

  const panelStyle = { background: "#06060a" };
  const cardStyle = { background: "rgba(255,255,255,0.04)" };
  const headerStyle = { background: "rgba(0,0,0,0.7)" };
  const navStyle = { background: "rgba(0,0,0,0.55)" };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col text-white overflow-y-auto" style={panelStyle}>
      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-6 py-4 backdrop-blur-2xl"
        style={headerStyle}>
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-red-400" />
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-red-300/80">Restricted</div>
            <h1 className="text-xl font-black">Polaris Admin Panel</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={refresh} className="rounded-lg p-2 text-white/70 hover:bg-white/10" title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button onClick={() => navigate({ to: "/security" })}
            className="flex items-center gap-1.5 rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-200 hover:bg-red-500/25">
            <Globe2 className="h-3.5 w-3.5" /> Security HQ
          </button>
          <button onClick={() => navigate({ to: "/" })}
            className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20">
            Back to App
          </button>
          <button onClick={async () => { await revoke(); lock(); navigate({ to: "/settings" }); }}
            className="flex items-center gap-1.5 rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-200 hover:bg-red-500/30">
            <LogOut className="h-3.5 w-3.5" /> Sign out of Admin
          </button>
        </div>
      </header>

      <nav className="flex flex-wrap gap-1 border-b border-white/10 px-4 backdrop-blur-xl"
        style={navStyle}>
        {([
          { id: "home", label: "Home", icon: Home },
          { id: "users", label: "Users", icon: Users },
          { id: "economy", label: "Economy", icon: Coins },
          { id: "announce", label: "Announcements", icon: Megaphone },
          { id: "channels", label: "Channels", icon: Hash },
          { id: "moderation", label: "Moderation", icon: Trash2 },
        ] as const).map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
              tab === t.id ? "border-red-400 text-white" : "border-transparent text-white/55 hover:text-white"
            }`}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </nav>

      {msg && (
        <div className="mx-6 mt-4 rounded-xl border border-white/10 px-4 py-2 text-sm backdrop-blur-md" style={cardStyle}>
          {msg}
        </div>
      )}

      <main className="flex-1 p-6">
        {tab === "home" && stats && (
          <section className="space-y-6">
            <div className="overflow-hidden rounded-3xl border border-white/10 backdrop-blur-xl" style={cardStyle}>
              <div className="h-32 w-full"
                style={{
                  background: stats.me?.banner_url
                    ? `url(${stats.me.banner_url}) center/cover no-repeat`
                    : `linear-gradient(135deg, rgb(${stats.me?.banner_color ?? "230 110 50"}), rgb(${stats.me?.accent_color ?? "255 140 80"}))`,
                }} />
              <div className="-mt-12 flex flex-wrap items-end gap-4 p-6">
                <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-full text-4xl shadow-2xl"
                  style={{ background: `rgb(${stats.me?.accent_color ?? "255 140 80"})`, boxShadow: "0 0 0 4px rgba(0,0,0,0.85)" }}>
                  {stats.me?.avatar_url
                    ? <img src={stats.me.avatar_url} alt="" className="h-full w-full object-cover" />
                    : <span>{stats.me?.avatar_emoji ?? stats.me?.username?.[0]?.toUpperCase() ?? "?"}</span>}
                </div>
                <div className="min-w-0 flex-1 pb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-black">{stats.me?.display_name || stats.me?.username}</h2>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-bold text-amber-200">
                      <Crown className="h-3 w-3" /> Owner
                    </span>
                  </div>
                  <div className="text-sm text-white/55">@{stats.me?.username}</div>
                  {stats.me?.about_me && <p className="mt-2 max-w-lg text-sm text-white/75">{stats.me.about_me}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-px bg-white/5 sm:grid-cols-4">
                <Stat label="Joined" value={stats.me ? new Date(stats.me.created_at).toLocaleDateString() : "—"} />
                <Stat label="Coins" value={stats.wallet.coins.toLocaleString()} />
                <Stat label="Coins spent" value={(stats.me?.spent_coins ?? 0).toLocaleString()} />
                <Stat label="AI credits" value={`${stats.wallet.basic_credits}b / ${stats.wallet.premium_credits}p`} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <BigStat icon={Users} label="Total users" value={stats.totals.users} />
              <BigStat icon={Hash} label="Channels" value={stats.totals.channels} />
              <BigStat icon={Megaphone} label="Messages" value={stats.totals.messages} />
              <BigStat icon={Ban} label="Banned" value={stats.totals.banned} accent="red" />
            </div>
          </section>
        )}

        {tab === "users" && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-white/50" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by username…"
                className="w-full max-w-md rounded-xl bg-white/5 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-white/30" />
              <span className="text-xs text-white/50">{filtered.length} users</span>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-white/10 backdrop-blur-md" style={cardStyle}>
              <table className="w-full text-sm">
                <thead className="text-left text-[11px] uppercase tracking-wider text-white/55" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <tr>
                    <th className="px-4 py-3">User</th><th className="px-4 py-3">Coins</th>
                    <th className="px-4 py-3">Credits</th><th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u.id} className="border-t border-white/5">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-sm">
                            {u.avatar_emoji || u.username[0]?.toUpperCase()}
                          </span>
                          <div>
                            <div className="font-semibold">{u.username} {u.is_owner && <Crown className="inline h-3 w-3 text-amber-300" />}</div>
                            <div className="text-[11px] text-white/45">{u.display_name || ""}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 tabular-nums">{u.wallet.coins}</td>
                      <td className="px-4 py-3 text-xs">{u.wallet.basic_credits}b / {u.wallet.premium_credits}p</td>
                      <td className="px-4 py-3">
                        {u.is_banned
                          ? <span className="rounded bg-red-500/20 px-2 py-0.5 text-[11px] text-red-200">Banned</span>
                          : <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-200">Active</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-wrap justify-end gap-1">
                          <button
                            onClick={() => {
                              const t = window.prompt(`Rename @${u.username} to:`, u.username);
                              if (t && t !== u.username) run(() => renameUser({ data: { from: u.username, to: t } }), `Renamed to @${t}`);
                            }}
                            className="rounded bg-white/10 px-2 py-1 text-[11px] hover:bg-white/20" title="Rename user">
                            <Pencil className="inline h-3 w-3" /> Rename
                          </button>
                          {u.is_banned ? (
                            <button onClick={() => run(() => unbanUser({ data: { username: u.username } }), "Unbanned")}
                              className="rounded bg-white/10 px-2 py-1 text-[11px] hover:bg-white/20">Unban</button>
                          ) : (
                            <button onClick={() => {
                              const r = window.prompt(`Ban reason for ${u.username}?`, "Violating community rules");
                              if (r) run(() => banUser({ data: { username: u.username, reason: r } }), `Banned ${u.username}`);
                            }} className="rounded bg-red-500/20 px-2 py-1 text-[11px] text-red-200 hover:bg-red-500/30">
                              <Ban className="inline h-3 w-3" /> Ban
                            </button>
                          )}
                          <button onClick={() => run(() => kickUser({ data: { username: u.username } }), `Kicked ${u.username}`)}
                            className="rounded bg-white/10 px-2 py-1 text-[11px] hover:bg-white/20">
                            <UserX className="inline h-3 w-3" /> Kick
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-xs text-white/45">Banned users see a ban screen in chat. Renaming a user also updates all their past message handles.</div>
          </section>
        )}

        {tab === "economy" && (
          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 p-5 backdrop-blur-md" style={cardStyle}>
              <h2 className="flex items-center gap-2 text-lg font-bold"><Coins className="h-4 w-4" /> Set / Add Coins</h2>
              <div className="mt-4 space-y-3">
                <input value={ecoUser} onChange={(e) => setEcoUser(e.target.value)} placeholder="Username"
                  className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm outline-none ring-1 ring-white/10" />
                <input type="number" value={ecoCoins} onChange={(e) => setEcoCoins(Number(e.target.value))}
                  className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm outline-none ring-1 ring-white/10" />
                <div className="flex gap-2">
                  <button onClick={() => run(() => grantCoins({ data: { username: ecoUser, amount: ecoCoins, mode: "add" } }), "Coins added")}
                    className="flex-1 rounded-xl bg-amber-500 px-3 py-2 text-sm font-bold text-black hover:bg-amber-400">Add</button>
                  <button onClick={() => run(() => grantCoins({ data: { username: ecoUser, amount: ecoCoins, mode: "set" } }), "Coins set")}
                    className="flex-1 rounded-xl bg-white/10 px-3 py-2 text-sm font-bold hover:bg-white/20">Set</button>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 p-5 backdrop-blur-md" style={cardStyle}>
              <h2 className="flex items-center gap-2 text-lg font-bold"><Sparkles className="h-4 w-4" /> AI Credits</h2>
              <div className="mt-4 space-y-3">
                <input value={credUser} onChange={(e) => setCredUser(e.target.value)} placeholder="Username"
                  className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm outline-none ring-1 ring-white/10" />
                <select value={credTier} onChange={(e) => setCredTier(e.target.value as "basic" | "premium")}
                  className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm outline-none ring-1 ring-white/10">
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                </select>
                <input type="number" value={credAmt} onChange={(e) => setCredAmt(Number(e.target.value))}
                  className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm outline-none ring-1 ring-white/10" />
                <div className="flex gap-2">
                  <button onClick={() => run(() => grantCredits({ data: { username: credUser, tier: credTier, amount: credAmt, mode: "add" } }), "Credits added")}
                    className="flex-1 rounded-xl bg-violet-500 px-3 py-2 text-sm font-bold hover:bg-violet-400">Add</button>
                  <button onClick={() => run(() => grantCredits({ data: { username: credUser, tier: credTier, amount: credAmt, mode: "set" } }), "Credits set")}
                    className="flex-1 rounded-xl bg-white/10 px-3 py-2 text-sm font-bold hover:bg-white/20">Set</button>
                </div>
              </div>
            </div>
          </section>
        )}

        {tab === "announce" && (
          <section className="mx-auto max-w-2xl space-y-4 rounded-2xl border border-white/10 p-6 backdrop-blur-md" style={cardStyle}>
            <h2 className="flex items-center gap-2 text-lg font-bold"><Megaphone className="h-4 w-4" /> Post Announcement</h2>
            <p className="text-xs text-white/55">Posts into the announcements chat channel and the notification center.</p>
            <select value={annKind} onChange={(e) => setAnnKind(e.target.value as typeof annKind)}
              className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm outline-none ring-1 ring-white/10">
              <option value="announcement">📢 Announcement</option>
              <option value="update">🚀 Update</option>
              <option value="alert">⚠️ Alert</option>
            </select>
            <input value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} placeholder="Title"
              className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm outline-none ring-1 ring-white/10" />
            <textarea value={annBody} onChange={(e) => setAnnBody(e.target.value)} placeholder="What's new?" rows={6}
              className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm outline-none ring-1 ring-white/10" />
            <button
              onClick={() => run(() => postAnn({ data: { title: annTitle, body: annBody, kind: annKind } }), "Announcement posted")}
              className="w-full rounded-xl bg-white px-3 py-2.5 text-sm font-bold text-black hover:bg-white/90">
              Post
            </button>
          </section>
        )}

        {tab === "channels" && (
          <section className="space-y-3">
            <p className="text-xs text-white/55">
              <Filter className="mr-1 inline h-3 w-3" /> Filter blocks links + flagged words.
              <Lock className="ml-3 mr-1 inline h-3 w-3" /> Restrict role: only users whose "Personal Tag" matches can read/post.
            </p>
            {channels.map((c) => (
              <div key={c.id} className="rounded-xl border border-white/10 px-4 py-3 backdrop-blur-md" style={cardStyle}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{c.emoji || "💬"}</span>
                    <div>
                      <div className="font-semibold">#{c.slug}</div>
                      <div className="text-[11px] text-white/45">{c.name}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2 py-1 text-[11px]">
                      <input type="checkbox" checked={!!c.filter_enabled}
                        onChange={(e) => run(() => updChannel({ data: { id: c.id, filter_enabled: e.target.checked } }), `Filter ${e.target.checked ? "on" : "off"} for #${c.slug}`)} />
                      <Filter className="h-3 w-3" /> Filter
                    </label>
                    <input defaultValue={c.allowed_role ?? ""} placeholder="Restrict to role (blank = open)"
                      onBlur={(e) => {
                        const next = e.target.value.trim() || null;
                        if ((c.allowed_role ?? null) !== next) {
                          run(() => updChannel({ data: { id: c.id, allowed_role: next } }), `Updated role lock for #${c.slug}`);
                        }
                      }}
                      className="w-48 rounded-lg bg-white/5 px-2 py-1 text-[11px] outline-none ring-1 ring-white/10" />
                    <button onClick={() => { if (window.confirm(`Delete #${c.slug} and all messages?`)) run(() => delChannel({ data: { id: c.id } }), `Deleted #${c.slug}`); }}
                      className="flex items-center gap-1.5 rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-200 hover:bg-red-500/30">
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        {tab === "moderation" && (
          <section className="space-y-3">
            <div className="text-xs text-white/55">Recent messages across all channels. Delete inline.</div>
            <div className="overflow-x-auto rounded-2xl border border-white/10 backdrop-blur-md" style={cardStyle}>
              <table className="w-full text-sm">
                <thead className="text-left text-[11px] uppercase tracking-wider text-white/55" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <tr><th className="px-4 py-3">When</th><th className="px-4 py-3">User</th><th className="px-4 py-3">Content</th><th className="px-4 py-3 text-right">Actions</th></tr>
                </thead>
                <tbody>
                  {(stats?.recentMessages ?? []).map((m) => (
                    <tr key={m.id} className="border-t border-white/5">
                      <td className="px-4 py-3 text-[11px] text-white/45">{new Date(m.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3 font-semibold">@{m.username}</td>
                      <td className="px-4 py-3 text-xs text-white/75">{(m.content ?? "").slice(0, 200)}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => { if (window.confirm("Delete this message?")) run(() => delMessage({ data: { id: m.id } }), "Message deleted"); }}
                          className="rounded bg-red-500/20 px-2 py-1 text-[11px] text-red-200 hover:bg-red-500/30">
                          <Trash2 className="inline h-3 w-3" /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-black/40 px-4 py-3 text-center">
      <div className="text-[10px] uppercase tracking-[0.2em] text-white/55">{label}</div>
      <div className="mt-1 text-base font-bold tabular-nums">{value}</div>
    </div>
  );
}

function BigStat({ icon: Icon, label, value, accent }: { icon: typeof Users; label: string; value: number; accent?: "red" }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md">
      <div className={`flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] ${accent === "red" ? "text-red-300/80" : "text-white/55"}`}>
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-1 text-2xl font-black tabular-nums">{value.toLocaleString()}</div>
    </div>
  );
}
