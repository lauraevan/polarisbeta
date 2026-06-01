import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth-context";
import { useAdmin } from "@/lib/admin-context";
import {
  adminListUsers, adminListChannels, adminGrantCoins, adminGrantCredits,
  adminPostAnnouncement, adminBanUser, adminUnbanUser, adminKickUser,
  adminDeleteChannel, adminRevokeOwner,
} from "@/lib/admin.functions";
import {
  Shield, Coins, Sparkles, Megaphone, Ban, UserX, Hash, LogOut,
  Crown, Users, Trash2, RefreshCw, Search,
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
type AdminChannel = { id: string; slug: string; name: string; emoji: string | null };

function AdminPage() {
  const { user, loading } = useAuth();
  const { isAdmin, lock } = useAdmin();
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
  const revoke = useServerFn(adminRevokeOwner);

  const [tab, setTab] = useState<"users" | "economy" | "announce" | "channels">("users");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [channels, setChannels] = useState<AdminChannel[]>([]);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  // Economy form
  const [ecoUser, setEcoUser] = useState(""); const [ecoCoins, setEcoCoins] = useState(100);
  const [credUser, setCredUser] = useState(""); const [credTier, setCredTier] = useState<"basic" | "premium">("basic");
  const [credAmt, setCredAmt] = useState(10);
  // Announce form
  const [annTitle, setAnnTitle] = useState(""); const [annBody, setAnnBody] = useState("");
  const [annKind, setAnnKind] = useState<"announcement" | "update" | "alert">("announcement");
  // Ban form
  const [banReason, setBanReason] = useState("");

  const refresh = async () => {
    try {
      const [u, c] = await Promise.all([listUsers(), listChannels()]);
      setUsers(u as AdminUser[]);
      setChannels(c as AdminChannel[]);
    } catch (e) {
      setMsg((e as Error).message);
    }
  };

  useEffect(() => { if (isAdmin) refresh(); /* eslint-disable-next-line */ }, [isAdmin]);

  if (loading) return null;
  if (!user) return <Navigate to="/" />;
  if (!isAdmin) return <Navigate to="/settings" />;

  async function run(fn: () => Promise<unknown>, ok: string) {
    setMsg(null);
    try { await fn(); setMsg(ok); refresh(); }
    catch (e) { setMsg((e as Error).message); }
  }

  const filtered = users.filter((u) =>
    !q.trim() || u.username.toLowerCase().includes(q.toLowerCase())
    || u.display_name?.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-[#06060a] text-white overflow-y-auto">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-black/60 px-6 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-red-400" />
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-red-300/80">Restricted</div>
            <h1 className="text-xl font-black">Polaris Admin Panel</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refresh} className="rounded-lg p-2 text-white/70 hover:bg-white/10" title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button onClick={() => navigate({ to: "/" })}
            className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20">
            Back to App
          </button>
          <button
            onClick={async () => { await revoke(); lock(); navigate({ to: "/settings" }); }}
            className="flex items-center gap-1.5 rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-200 hover:bg-red-500/30"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out of Admin
          </button>
        </div>
      </header>

      {/* Tabs */}
      <nav className="flex gap-1 border-b border-white/10 bg-black/40 px-4">
        {([
          { id: "users", label: "Users", icon: Users },
          { id: "economy", label: "Economy", icon: Coins },
          { id: "announce", label: "Announcements", icon: Megaphone },
          { id: "channels", label: "Channels", icon: Hash },
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
        <div className="mx-6 mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm">
          {msg}
        </div>
      )}

      <main className="flex-1 p-6">
        {tab === "users" && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-white/50" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by username…"
                className="w-full max-w-md rounded-xl bg-white/5 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-white/30" />
              <span className="text-xs text-white/50">{filtered.length} users</span>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full text-sm">
                <thead className="bg-white/5 text-left text-[11px] uppercase tracking-wider text-white/55">
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
                        <div className="flex justify-end gap-1">
                          {u.is_banned ? (
                            <button onClick={() => run(() => unbanUser({ data: { username: u.username } }), "Unbanned")}
                              className="rounded bg-white/10 px-2 py-1 text-[11px] hover:bg-white/20">Unban</button>
                          ) : (
                            <button
                              onClick={() => {
                                const r = window.prompt(`Ban reason for ${u.username}?`, "Violating community rules");
                                if (r) run(() => banUser({ data: { username: u.username, reason: r } }), `Banned ${u.username}`);
                              }}
                              className="rounded bg-red-500/20 px-2 py-1 text-[11px] text-red-200 hover:bg-red-500/30">
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
            <div className="text-xs text-white/45">Banned users see a ban screen in chat and cannot send messages or DMs.</div>
            <input className="hidden" value={banReason} onChange={(e) => setBanReason(e.target.value)} />
          </section>
        )}

        {tab === "economy" && (
          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
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
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
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
          <section className="mx-auto max-w-2xl space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
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
            {channels.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{c.emoji || "💬"}</span>
                  <div>
                    <div className="font-semibold">#{c.slug}</div>
                    <div className="text-[11px] text-white/45">{c.name}</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm(`Delete #${c.slug} and all messages?`))
                      run(() => delChannel({ data: { id: c.id } }), `Deleted #${c.slug}`);
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-200 hover:bg-red-500/30">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}