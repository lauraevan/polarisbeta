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
  .inputValidator((input) => z.object({ key: z.string().min(1).max(200) }).parse(input))
  .handler(async ({ data, context }) => {
    const expected = process.env.POLARIS_ADMIN_KEY;
    if (!expected) throw new Error("Admin key not configured");
    if (data.key !== expected) {
      // Tiny delay to discourage brute force.
      await new Promise((r) => setTimeout(r, 600));
      throw new Error("Invalid key");
    }
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
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireOwner(context.userId);
    const { error } = await supabaseAdmin.from("profiles")
      .update({ is_banned: true, ban_reason: data.reason, banned_at: new Date().toISOString() })
      .eq("username", data.username);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminUnbanUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ username: z.string().min(1).max(60) }).parse(input))
  .handler(async ({ data, context }) => {
    await requireOwner(context.userId);
    await supabaseAdmin.from("profiles")
      .update({ is_banned: false, ban_reason: null, banned_at: null })
      .eq("username", data.username);
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
    // Best effort: revoke sessions through admin API
    try {
      await supabaseAdmin.auth.admin.signOut(target.id, "global");
    } catch (e) { console.error("kick signOut", e); }
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