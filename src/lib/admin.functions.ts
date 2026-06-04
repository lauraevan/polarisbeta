import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** Owner-guard helper: throws if calling user is not flagged is_owner. */
async function requireOwner(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("is_owner")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data?.is_owner) throw new Error("Forbidden: owner only");
}

/** Verify the admin key. On success, marks the calling user as owner. */
export const verifyAdminKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        key: z.string().min(1).max(200),
        key2: z.string().min(1).max(200),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const expected = process.env.POLARIS_ADMIN_KEY;
    const expected2 = process.env.POLARIS_ADMIN_KEY_2;
    const allowlist = (process.env.POLARIS_OWNER_USERNAMES ?? "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (!expected || !expected2) throw new Error("Admin not configured");

    // Constant-time compare to avoid timing leaks.
    const eq = (a: string, b: string) => {
      if (a.length !== b.length) return false;
      let r = 0;
      for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
      return r === 0;
    };

    // Always pay the latency cost so failures don't leak which factor failed.
    await new Promise((r) => setTimeout(r, 800));

    // Username allowlist gate.
    const { data: me } = await supabaseAdmin
      .from("profiles")
      .select("username")
      .eq("id", context.userId)
      .maybeSingle();
    const uname = (me?.username ?? "").toLowerCase();
    const usernameOk = allowlist.length === 0 ? true : allowlist.includes(uname);

    const ok = usernameOk && eq(data.key, expected) && eq(data.key2, expected2);
    if (!ok) throw new Error("Invalid credentials");

    await supabaseAdmin
      .from("profiles")
      .update({ is_owner: true, custom_role: "Owner" })
      .eq("id", context.userId);
    return { ok: true };
  });

/** Grant or set coins on a user (owner only). */
export const adminGrantCoins = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      username: z.string().min(1).max(60),
      amount: z.number().int().min(-1_000_000).max(1_000_000),
      mode: z.enum(["add", "set"]).default("add"),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireOwner(context.userId);
    const { data: target } = await supabaseAdmin
      .from("profiles").select("id").eq("username", data.username).maybeSingle();
    if (!target) throw new Error("User not found");
    const { data: wallet } = await supabaseAdmin
      .from("user_wallet").select("coins").eq("user_id", target.id).maybeSingle();
    const current = wallet?.coins ?? 0;
    const next = data.mode === "set" ? data.amount : current + data.amount;
    if (wallet) {
      await supabaseAdmin.from("user_wallet").update({ coins: next }).eq("user_id", target.id);
    } else {
      await supabaseAdmin.from("user_wallet").insert({ user_id: target.id, coins: next });
    }
    await supabaseAdmin.from("coin_transactions").insert({
      user_id: target.id, kind: "admin_grant", coins_delta: next - current,
      reference: "owner", meta: { by: context.userId } as never,
    });
    return { ok: true, coins: next };
  });

/** Grant AI credits (owner only). */
export const adminGrantCredits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      username: z.string().min(1).max(60),
      tier: z.enum(["basic", "premium"]),
      amount: z.number().int().min(-10_000).max(10_000),
      mode: z.enum(["add", "set"]).default("add"),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireOwner(context.userId);
    const { data: target } = await supabaseAdmin
      .from("profiles").select("id").eq("username", data.username).maybeSingle();
    if (!target) throw new Error("User not found");
    const field = data.tier === "basic" ? "basic_credits" : "premium_credits";
    const { data: wallet } = await supabaseAdmin
      .from("user_wallet").select("basic_credits, premium_credits")
      .eq("user_id", target.id).maybeSingle();
    const current = (wallet?.[field] as number | undefined) ?? 0;
    const next = data.mode === "set" ? data.amount : current + data.amount;
    const patch = data.tier === "basic" ? { basic_credits: next } : { premium_credits: next };
    if (wallet) {
      await supabaseAdmin.from("user_wallet").update(patch).eq("user_id", target.id);
    } else {
      await supabaseAdmin.from("user_wallet").insert({ user_id: target.id, ...patch });
    }
    return { ok: true, value: next };
  });

/** Post an announcement (owner only). Also posts into the 'announcements' chat channel if it exists. */
export const adminPostAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      title: z.string().min(1).max(120),
      body: z.string().min(1).max(4000),
      kind: z.enum(["announcement", "update", "alert"]).default("announcement"),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireOwner(context.userId);
    const { data: profile } = await supabaseAdmin
      .from("profiles").select("username, avatar_emoji, avatar_url, accent_color")
      .eq("id", context.userId).maybeSingle();
    await supabaseAdmin.from("announcements").insert({
      title: data.title, body: data.body, kind: data.kind,
      posted_by: context.userId, posted_by_username: profile?.username ?? null,
    });
    // Also fan-out into the chat 'announcements' channel for visibility.
    const { data: channel } = await supabaseAdmin
      .from("chat_channels").select("id").eq("slug", "announcements").maybeSingle();
    if (channel && profile) {
      const content = `📢 **${data.title}**\n${data.body}`;
      await supabaseAdmin.from("chat_messages").insert({
        channel_id: channel.id, user_id: context.userId,
        username: profile.username, avatar_emoji: profile.avatar_emoji,
        avatar_url: profile.avatar_url, accent_color: profile.accent_color,
        content, attachments: [] as never,
      });
    }
    return { ok: true };
  });

/** Ban a user (soft — chat is blocked, ban screen shown in chat). */
export const adminBanUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      username: z.string().min(1).max(60),
      reason: z.string().min(1).max(500),
      /** "perm" or a number of hours (e.g. 24 = 1 day, 72 = 3 day, 168 = 7 day). */
      durationHours: z.union([z.literal("perm"), z.number().int().min(1).max(24 * 365)]).default("perm"),
      type: z.enum(["full_site", "chat_only", "dm_only", "shadow"]).default("full_site"),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireOwner(context.userId);
    const { data: target, error: terr } = await supabaseAdmin
      .from("profiles").select("id, username").eq("username", data.username).maybeSingle();
    if (terr) throw new Error(terr.message);
    if (!target) throw new Error("User not found");

    const expires_at =
      data.durationHours === "perm"
        ? null
        : new Date(Date.now() + data.durationHours * 3600_000).toISOString();

    // Create a proper ban row + user target so BanGate picks it up immediately.
    const { data: ban, error: berr } = await supabaseAdmin
      .from("bans")
      .insert({
        type: data.type, reason: data.reason, issued_by: context.userId, expires_at,
        status: "active",
      } as never)
      .select("id").single();
    if (berr) throw new Error(berr.message);
    await supabaseAdmin.from("ban_targets").insert({
      ban_id: ban.id, scope: "user", value: target.id,
    } as never);

    // Mirror onto the profile flag (used by simpler UI checks).
    const { error } = await supabaseAdmin.from("profiles")
      .update({
        is_banned: true,
        ban_reason: data.reason,
        banned_at: new Date().toISOString(),
        force_logout_at: new Date().toISOString(),
      } as never)
      .eq("id", target.id);
    if (error) throw new Error(error.message);

    return { ok: true, ban_id: ban.id, expires_at };
  });

export const adminUnbanUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ username: z.string().min(1).max(60) }).parse(input))
  .handler(async ({ data, context }) => {
    await requireOwner(context.userId);
    const { data: target } = await supabaseAdmin
      .from("profiles").select("id").eq("username", data.username).maybeSingle();
    if (!target) throw new Error("User not found");
    // Lift any active bans on this user.
    const { data: targets } = await supabaseAdmin
      .from("ban_targets").select("ban_id").eq("scope", "user").eq("value", target.id);
    const banIds = (targets ?? []).map((t) => t.ban_id);
    if (banIds.length) {
      await supabaseAdmin.from("bans")
        .update({ status: "lifted", lifted_at: new Date().toISOString() } as never)
        .in("id", banIds);
    }
    await supabaseAdmin.from("profiles")
      .update({ is_banned: false, ban_reason: null, banned_at: null })
      .eq("id", target.id);
    return { ok: true };
  });

/** Mute a user for a duration in minutes (or permanently). Enforced client-side in chat. */
export const adminMuteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      username: z.string().min(1).max(60),
      reason: z.string().max(500).optional(),
      durationMinutes: z.union([z.literal("perm"), z.number().int().min(1).max(60 * 24 * 365)]).default(60),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireOwner(context.userId);
    const muted_until =
      data.durationMinutes === "perm"
        ? new Date("9999-12-31T00:00:00Z").toISOString()
        : new Date(Date.now() + data.durationMinutes * 60_000).toISOString();
    const { error } = await supabaseAdmin.from("profiles")
      .update({ muted_until, mute_reason: data.reason ?? null } as never)
      .eq("username", data.username);
    if (error) throw new Error(error.message);
    return { ok: true, muted_until };
  });

export const adminUnmuteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ username: z.string().min(1).max(60) }).parse(input))
  .handler(async ({ data, context }) => {
    await requireOwner(context.userId);
    await supabaseAdmin.from("profiles")
      .update({ muted_until: null, mute_reason: null } as never)
      .eq("username", data.username);
    return { ok: true };
  });

/** Bulk-delete the most recent N messages in a channel (by id or slug). */
export const adminPurgeMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      channelId: z.string().uuid().optional(),
      channelSlug: z.string().min(1).max(80).optional(),
      count: z.number().int().min(1).max(500).default(10),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireOwner(context.userId);
    let channelId = data.channelId ?? null;
    if (!channelId && data.channelSlug) {
      const { data: ch } = await supabaseAdmin
        .from("chat_channels").select("id").eq("slug", data.channelSlug).maybeSingle();
      channelId = ch?.id ?? null;
    }
    if (!channelId) throw new Error("Channel not found");
    const { data: latest } = await supabaseAdmin
      .from("chat_messages").select("id")
      .eq("channel_id", channelId)
      .order("created_at", { ascending: false })
      .limit(data.count);
    const ids = (latest ?? []).map((r) => r.id as string);
    if (!ids.length) return { ok: true, deleted: 0 };
    const { error } = await supabaseAdmin.from("chat_messages").delete().in("id", ids);
    if (error) throw new Error(error.message);
    return { ok: true, deleted: ids.length };
  });

/** Lock or unlock a channel for a role (by slug or id). Pass role=null to unlock. */
export const adminLockChannel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      channelId: z.string().uuid().optional(),
      channelSlug: z.string().min(1).max(80).optional(),
      role: z.string().max(40).nullable().default("Owner"),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireOwner(context.userId);
    let q = supabaseAdmin.from("chat_channels").update({ allowed_role: data.role } as never);
    q = data.channelId ? q.eq("id", data.channelId) : q.eq("slug", data.channelSlug ?? "");
    const { error } = await q;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Kick = sign-out enforced by deleting all sessions (admin API). */
export const adminKickUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ username: z.string().min(1).max(60) }).parse(input))
  .handler(async ({ data, context }) => {
    await requireOwner(context.userId);
    const { data: target } = await supabaseAdmin
      .from("profiles").select("id").eq("username", data.username).maybeSingle();
    if (!target) throw new Error("User not found");
    // Force the client to sign out on next realtime tick. The Supabase JS
    // `auth.admin.signOut(jwt)` API takes a JWT (not a user id), so we can't
    // remotely revoke from the user id alone — instead we flip a profile
    // timestamp and the auth-context subscribes to it and signs out.
    await supabaseAdmin
      .from("profiles")
      .update({ force_logout_at: new Date().toISOString() } as never)
      .eq("id", target.id);
    return { ok: true };
  });

export const adminDeleteMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireOwner(context.userId);
    await supabaseAdmin.from("chat_messages").delete().eq("id", data.id);
    return { ok: true };
  });

export const adminDeleteChannel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireOwner(context.userId);
    await supabaseAdmin.from("chat_messages").delete().eq("channel_id", data.id);
    await supabaseAdmin.from("chat_channels").delete().eq("id", data.id);
    return { ok: true };
  });

/** List recent users with key stats for the admin panel. */
export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireOwner(context.userId);
    const [{ data: profiles }, { data: wallets }] = await Promise.all([
      supabaseAdmin.from("profiles")
        .select("id, username, display_name, avatar_emoji, avatar_url, is_owner, is_banned, ban_reason, created_at")
        .order("created_at", { ascending: false }).limit(200),
      supabaseAdmin.from("user_wallet").select("user_id, coins, basic_credits, premium_credits"),
    ]);
    const wmap = new Map((wallets ?? []).map((w) => [w.user_id, w]));
    return (profiles ?? []).map((p) => ({
      ...p,
      wallet: wmap.get(p.id) ?? { coins: 0, basic_credits: 0, premium_credits: 0 },
    }));
  });

export const adminListChannels = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireOwner(context.userId);
    const { data } = await supabaseAdmin.from("chat_channels")
      .select("*").order("created_at", { ascending: true });
    return data ?? [];
  });

export const adminRevokeOwner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Anyone can revoke their OWN owner flag (used by Sign Out of admin).
    await supabaseAdmin.from("profiles")
      .update({ is_owner: false, custom_role: null }).eq("id", context.userId);
    return { ok: true };
  });

/** Rename a user everywhere: profile + all past chat messages + DMs. */
export const adminRenameUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      from: z.string().min(1).max(60),
      to: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireOwner(context.userId);
    const { data: target } = await supabaseAdmin
      .from("profiles").select("id").eq("username", data.from).maybeSingle();
    if (!target) throw new Error("User not found");
    const { data: clash } = await supabaseAdmin
      .from("profiles").select("id").eq("username", data.to).maybeSingle();
    if (clash) throw new Error("Target username already taken");
    await supabaseAdmin.from("profiles").update({ username: data.to }).eq("id", target.id);
    await supabaseAdmin.from("chat_messages").update({ username: data.to }).eq("user_id", target.id);
    await supabaseAdmin.from("direct_messages").update({ sender_username: data.to }).eq("sender_id", target.id);
    return { ok: true };
  });

/** Update a channel's filter / role-restriction settings. */
export const adminUpdateChannel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      id: z.string().uuid(),
      filter_enabled: z.boolean().optional(),
      allowed_role: z.string().max(40).nullable().optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireOwner(context.userId);
    const patch: { filter_enabled?: boolean; allowed_role?: string | null } = {};
    if (typeof data.filter_enabled === "boolean") patch.filter_enabled = data.filter_enabled;
    if (data.allowed_role !== undefined) patch.allowed_role = data.allowed_role?.trim() || null;
    if (!Object.keys(patch).length) return { ok: true };
    const { error } = await supabaseAdmin.from("chat_channels").update(patch as never).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Set per-channel slow-mode delay in seconds (0 to disable, max 6h). */
export const adminSetSlowMode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      channelId: z.string().uuid().optional(),
      channelSlug: z.string().min(1).max(80).optional(),
      seconds: z.number().int().min(0).max(21600),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireOwner(context.userId);
    let q = supabaseAdmin.from("chat_channels").update({ slow_mode_seconds: data.seconds } as never);
    q = data.channelId ? q.eq("id", data.channelId) : q.eq("slug", data.channelSlug ?? "");
    const { error } = await q;
    if (error) throw new Error(error.message);
    return { ok: true, seconds: data.seconds };
  });

/** Delete a user's messages — optionally restricted to one channel and N most recent. */
export const adminClearUserMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      username: z.string().min(1).max(60),
      channelId: z.string().uuid().optional(),
      channelSlug: z.string().min(1).max(80).optional(),
      count: z.number().int().min(1).max(1000).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireOwner(context.userId);
    const { data: target } = await supabaseAdmin
      .from("profiles").select("id").eq("username", data.username).maybeSingle();
    if (!target) throw new Error("User not found");
    let channelId = data.channelId ?? null;
    if (!channelId && data.channelSlug) {
      const { data: ch } = await supabaseAdmin
        .from("chat_channels").select("id").eq("slug", data.channelSlug).maybeSingle();
      channelId = ch?.id ?? null;
    }
    let q = supabaseAdmin.from("chat_messages").select("id")
      .eq("user_id", target.id).order("created_at", { ascending: false }).limit(data.count ?? 500);
    if (channelId) q = q.eq("channel_id", channelId);
    const { data: rows } = await q;
    const ids = (rows ?? []).map((r) => r.id as string);
    if (!ids.length) return { ok: true, deleted: 0 };
    const { error } = await supabaseAdmin.from("chat_messages").delete().in("id", ids);
    if (error) throw new Error(error.message);
    return { ok: true, deleted: ids.length };
  });

/** IP-ban a user: look up their recent IPs from device_sessions, add ip targets. */
export const adminIpBanUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      username: z.string().min(1).max(60),
      reason: z.string().min(1).max(500).default("IP ban"),
      durationHours: z.union([z.literal("perm"), z.number().int().min(1).max(24 * 365)]).default("perm"),
      includeDevice: z.boolean().default(true),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireOwner(context.userId);
    const { data: target } = await supabaseAdmin
      .from("profiles").select("id, username").eq("username", data.username).maybeSingle();
    if (!target) throw new Error("User not found");
    const { data: sessions } = await supabaseAdmin
      .from("device_sessions")
      .select("ip, device_fingerprint")
      .eq("user_id", target.id)
      .order("last_seen_at", { ascending: false })
      .limit(20);
    const ips = Array.from(new Set((sessions ?? []).map((s) => s.ip).filter(Boolean) as string[]));
    const fps = data.includeDevice
      ? Array.from(new Set((sessions ?? []).map((s) => s.device_fingerprint).filter(Boolean) as string[]))
      : [];
    if (ips.length === 0 && fps.length === 0) {
      throw new Error("No recent IP/device on file for this user — fall back to /ban");
    }
    const expires_at =
      data.durationHours === "perm" ? null
        : new Date(Date.now() + data.durationHours * 3600_000).toISOString();
    const { data: ban, error: berr } = await supabaseAdmin
      .from("bans").insert({
        type: "full_site", reason: data.reason, issued_by: context.userId,
        expires_at, status: "active",
      } as never).select("id").single();
    if (berr) throw new Error(berr.message);
    const targets = [
      { ban_id: ban.id, scope: "user" as const, value: target.id },
      ...ips.map((ip) => ({ ban_id: ban.id, scope: "ip" as const, value: ip })),
      ...fps.map((fp) => ({ ban_id: ban.id, scope: "device" as const, value: fp })),
    ];
    await supabaseAdmin.from("ban_targets").insert(targets as never);
    await supabaseAdmin.from("profiles")
      .update({
        is_banned: true, ban_reason: data.reason,
        banned_at: new Date().toISOString(),
        force_logout_at: new Date().toISOString(),
      } as never)
      .eq("id", target.id);
    return { ok: true, ban_id: ban.id, ips: ips.length, devices: fps.length };
  });

/** Aggregate stats for the admin home: my profile, my coins, my spend, totals across the app. */
export const adminGetStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireOwner(context.userId);
    const [me, wallet, totals, msgCount, chCount, bannedCount, recent] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").eq("id", context.userId).maybeSingle(),
      supabaseAdmin.from("user_wallet").select("*").eq("user_id", context.userId).maybeSingle(),
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("chat_messages").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("chat_channels").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).eq("is_banned", true),
      supabaseAdmin.from("chat_messages").select("id, username, content, created_at, channel_id").order("created_at", { ascending: false }).limit(20),
    ]);
    return {
      me: me.data,
      wallet: wallet.data ?? { coins: 0, basic_credits: 0, premium_credits: 0 },
      totals: {
        users: totals.count ?? 0,
        messages: msgCount.count ?? 0,
        channels: chCount.count ?? 0,
        banned: bannedCount.count ?? 0,
      },
      recentMessages: recent.data ?? [],
    };
  });