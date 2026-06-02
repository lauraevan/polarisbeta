import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertOwner(userId: string): Promise<string> {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("is_owner")
    .eq("id", userId)
    .maybeSingle();
  if (!profile?.is_owner) throw new Error("Forbidden — owner only");
  return userId;
}

async function getMyUsername(userId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();
  return data?.username ?? null;
}

function clientIp(): string {
  const cf = getRequestHeader("cf-connecting-ip");
  if (cf) return cf;
  const xri = getRequestHeader("x-real-ip");
  if (xri) return xri;
  const xff = getRequestHeader("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return getRequestIP({ xForwardedFor: true }) ?? "";
}

async function geo(ip: string) {
  const token = process.env.IPINFO_TOKEN;
  if (!ip || !token) return null;
  try {
    const r = await fetch(`https://ipinfo.io/${ip}?token=${token}`);
    if (!r.ok) return null;
    const j = (await r.json()) as Record<string, unknown>;
    const [lat, lon] = String(j.loc ?? ",").split(",").map((v) => Number(v) || null);
    const priv = (j.privacy as { vpn?: boolean; proxy?: boolean; tor?: boolean; hosting?: boolean } | undefined);
    return {
      country: (j.country as string) ?? null,
      region: (j.region as string) ?? null,
      city: (j.city as string) ?? null,
      postal: (j.postal as string) ?? null,
      timezone: (j.timezone as string) ?? null,
      org: (j.org as string) ?? null,
      asn: ((j.org as string) ?? "").split(" ")[0] || null,
      hostname: (j.hostname as string) ?? null,
      latitude: lat,
      longitude: lon,
      is_vpn: priv?.vpn ?? false,
      is_proxy: priv?.proxy ?? false,
      is_tor: priv?.tor ?? false,
      is_hosting: priv?.hosting ?? false,
    };
  } catch {
    return null;
  }
}

/** "Your IP" card — owner-only. */
export const whoAmI = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertOwner(context.userId);
    const ip = clientIp();
    const ua = getRequestHeader("user-agent") ?? "";
    const lang = getRequestHeader("accept-language") ?? "";
    const g = await geo(ip);
    return { ip, userAgent: ua, language: lang, geo: g };
  });

/** FBI-style dossier on any target. Searches by username, user id, IP, or device fingerprint. */
export const adminLookupTarget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        query: z.string().min(1).max(255),
        filters: z
          .object({
            country: z.string().max(8).optional(),
            vpnOnly: z.boolean().optional(),
            since: z.string().datetime().optional(),
          })
          .optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertOwner(context.userId);
    const q = data.query.trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(q);
    const looksLikeIp = /^[0-9a-f.:]+$/i.test(q) && (q.includes(".") || q.includes(":"));

    // Resolve to a profile when possible
    let profile: Record<string, unknown> | null = null;
    if (isUuid) {
      const r = await supabaseAdmin.from("profiles").select("*").eq("id", q).maybeSingle();
      profile = r.data;
    }
    if (!profile) {
      const r = await supabaseAdmin.from("profiles").select("*").ilike("username", q).maybeSingle();
      profile = r.data;
    }

    // Sessions: by user_id, username, ip, or fingerprint
    let sessQ = supabaseAdmin.from("device_sessions").select("*").order("last_seen_at", { ascending: false }).limit(500);
    if (profile?.id) sessQ = sessQ.eq("user_id", profile.id as string);
    else if (looksLikeIp) sessQ = sessQ.eq("ip", q);
    else sessQ = sessQ.or(`username.ilike.${q},device_fingerprint.eq.${q}`);
    if (data.filters?.country) sessQ = sessQ.eq("country", data.filters.country);
    if (data.filters?.vpnOnly) sessQ = sessQ.eq("is_vpn", true);
    if (data.filters?.since) sessQ = sessQ.gte("last_seen_at", data.filters.since);
    const { data: sessions } = await sessQ;

    // Events
    let evQ = supabaseAdmin.from("security_events").select("*").order("created_at", { ascending: false }).limit(500);
    if (profile?.id) evQ = evQ.eq("user_id", profile.id as string);
    else if (looksLikeIp) evQ = evQ.eq("ip", q);
    else evQ = evQ.or(`username.ilike.${q},device_fingerprint.eq.${q}`);
    if (data.filters?.since) evQ = evQ.gte("created_at", data.filters.since);
    const { data: events } = await evQ;

    // Distinct identifiers
    const ips = Array.from(new Set((sessions ?? []).map((s) => s.ip).filter(Boolean))) as string[];
    const fps = Array.from(new Set((sessions ?? []).map((s) => s.device_fingerprint).filter(Boolean))) as string[];
    const countries = Array.from(new Set((sessions ?? []).map((s) => s.country).filter(Boolean))) as string[];
    const asns = Array.from(new Set((sessions ?? []).map((s) => s.asn).filter(Boolean))) as string[];

    // Related bans
    const orParts: string[] = [];
    if (profile?.id) orParts.push(`and(scope.eq.user,value.eq.${profile.id})`);
    for (const ip of ips) orParts.push(`and(scope.eq.ip,value.eq.${ip})`);
    for (const fp of fps) orParts.push(`and(scope.eq.device,value.eq.${fp})`);
    let bans: unknown[] = [];
    if (orParts.length) {
      const { data: targets } = await supabaseAdmin
        .from("ban_targets")
        .select("*, bans(*)")
        .or(orParts.join(","));
      bans = targets ?? [];
    }

    return {
      profile,
      sessions: sessions ?? [],
      events: events ?? [],
      bans,
      summary: {
        ips,
        fingerprints: fps,
        countries,
        asns,
        vpnHits: (sessions ?? []).filter((s) => s.is_vpn || s.is_proxy || s.is_tor).length,
        sessionCount: sessions?.length ?? 0,
        eventCount: events?.length ?? 0,
      },
    };
  });

/** List recent bans with their targets (joined). */
export const adminListBans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertOwner(context.userId);
    const { data: bans, error } = await supabaseAdmin
      .from("bans")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    const { data: targets } = await supabaseAdmin
      .from("ban_targets")
      .select("*")
      .in("ban_id", (bans ?? []).map((b) => b.id));
    return {
      bans: bans ?? [],
      targets: targets ?? [],
    };
  });

/** Live security event feed (latest N). */
export const adminListEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ limit: z.number().int().min(1).max(1000).default(250) }).parse(input ?? {}),
  )
  .handler(async ({ context, data }) => {
    await assertOwner(context.userId);
    const { data: events, error } = await supabaseAdmin
      .from("security_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(error.message);
    return events ?? [];
  });

/** Every device that ever touched the site. */
export const adminListSessions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertOwner(context.userId);
    const { data, error } = await supabaseAdmin
      .from("device_sessions")
      .select("*")
      .order("last_seen_at", { ascending: false })
      .limit(1000);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/** Create a ban with N targets and optional expiry. */
export const adminCreateBan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        type: z.enum(["full_site", "chat_only", "dm_only", "shadow"]),
        reason: z.string().min(1).max(500),
        notes: z.string().max(2000).optional(),
        expiresAt: z.string().datetime().nullable().optional(),
        targets: z
          .array(
            z.object({
              scope: z.enum(["user", "ip", "ip_range", "device", "asn", "country"]),
              value: z.string().min(1).max(255),
            }),
          )
          .min(1)
          .max(50),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertOwner(context.userId);
    const meUsername = await getMyUsername(context.userId);

    const { data: ban, error } = await supabaseAdmin
      .from("bans")
      .insert({
        type: data.type,
        reason: data.reason,
        notes: data.notes ?? null,
        expires_at: data.expiresAt ?? null,
        issued_by: context.userId,
        issued_by_username: meUsername,
      })
      .select()
      .single();
    if (error || !ban) throw new Error(error?.message ?? "Failed to create ban");

    // For user-scope targets, also flip the legacy profiles.is_banned flag
    // so existing chat surfaces still see them as banned.
    const userIds = data.targets.filter((t) => t.scope === "user").map((t) => t.value);
    if (userIds.length) {
      await supabaseAdmin
        .from("profiles")
        .update({ is_banned: true, ban_reason: data.reason })
        .in("id", userIds);
    }

    // Enrich targets with geo from latest matching device_sessions / events
    const enriched = await Promise.all(
      data.targets.map(async (t) => {
        let geo: {
          country: string | null; region: string | null; city: string | null;
          latitude: number | null; longitude: number | null;
          asn: string | null; org: string | null;
          is_vpn: boolean; is_proxy: boolean; is_tor: boolean;
        } = {
          country: null, region: null, city: null,
          latitude: null, longitude: null, asn: null, org: null,
          is_vpn: false, is_proxy: false, is_tor: false,
        };
        const q = supabaseAdmin
          .from("device_sessions")
          .select("country, region, city, latitude, longitude, asn, org, is_vpn, is_proxy, is_tor")
          .order("last_seen_at", { ascending: false })
          .limit(1);
        const { data: row } =
          t.scope === "user" ? await q.eq("user_id", t.value).maybeSingle()
          : t.scope === "ip" ? await q.eq("ip", t.value).maybeSingle()
          : t.scope === "device" ? await q.eq("device_fingerprint", t.value).maybeSingle()
          : { data: null };
        if (row) geo = { ...geo, ...row };
        return {
          ban_id: ban.id,
          scope: t.scope,
          value: t.value,
          ...geo,
        };
      }),
    );

    const { error: tErr } = await supabaseAdmin.from("ban_targets").insert(enriched);
    if (tErr) throw new Error(tErr.message);

    await supabaseAdmin.from("security_events").insert({
      kind: "ban_issued",
      severity: "high",
      user_id: context.userId,
      username: meUsername,
      ban_id: ban.id,
      detail: { type: data.type, targetCount: data.targets.length, reason: data.reason },
    });

    return { banId: ban.id };
  });

/** Lift (deactivate) a ban. */
export const adminLiftBan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ banId: z.string().uuid(), reason: z.string().max(500).optional() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertOwner(context.userId);
    const { error } = await supabaseAdmin
      .from("bans")
      .update({
        status: "lifted",
        lifted_at: new Date().toISOString(),
        lifted_by: context.userId,
        lifted_reason: data.reason ?? null,
      })
      .eq("id", data.banId);
    if (error) throw new Error(error.message);

    // Also flip user profiles back if they were user-scope
    const { data: targets } = await supabaseAdmin
      .from("ban_targets")
      .select("scope, value")
      .eq("ban_id", data.banId);
    const userIds = (targets ?? []).filter((t) => t.scope === "user").map((t) => t.value);
    if (userIds.length) {
      await supabaseAdmin
        .from("profiles")
        .update({ is_banned: false, ban_reason: null })
        .in("id", userIds);
    }

    await supabaseAdmin.from("security_events").insert({
      kind: "ban_lifted",
      severity: "info",
      user_id: context.userId,
      ban_id: data.banId,
      detail: { reason: data.reason ?? null },
    });
    return { ok: true };
  });

/** Quick-ban from the events feed: ban whichever signal you click. */
export const adminQuickBan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        eventId: z.string().uuid(),
        type: z.enum(["full_site", "chat_only", "shadow"]).default("full_site"),
        scopes: z.array(z.enum(["user", "ip", "device"])).min(1).default(["user", "ip", "device"]),
        reason: z.string().min(1).max(500).default("Quick-banned from security feed"),
        expiresAt: z.string().datetime().nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertOwner(context.userId);
    const { data: ev } = await supabaseAdmin
      .from("security_events")
      .select("*")
      .eq("id", data.eventId)
      .maybeSingle();
    if (!ev) throw new Error("Event not found");

    const targets: Array<{ scope: "user" | "ip" | "device"; value: string }> = [];
    if (data.scopes.includes("user") && ev.user_id) targets.push({ scope: "user", value: ev.user_id });
    if (data.scopes.includes("ip") && ev.ip) targets.push({ scope: "ip", value: ev.ip });
    if (data.scopes.includes("device") && ev.device_fingerprint)
      targets.push({ scope: "device", value: ev.device_fingerprint });
    if (!targets.length) throw new Error("Event has no bannable identifiers");

    return adminCreateBan({
      data: {
        type: data.type,
        reason: data.reason,
        expiresAt: data.expiresAt ?? null,
        targets,
      },
    });
  });

/** Top-line stats for the security dashboard. */
export const adminSecurityStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertOwner(context.userId);
    const [bansRes, eventsRes, sessionsRes, appealsRes] = await Promise.all([
      supabaseAdmin.from("bans").select("status", { count: "exact", head: false }),
      supabaseAdmin
        .from("security_events")
        .select("kind, is_vpn", { count: "exact", head: false })
        .gte("created_at", new Date(Date.now() - 24 * 3600 * 1000).toISOString()),
      supabaseAdmin.from("device_sessions").select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("ban_appeals")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
    ]);
    const bans = bansRes.data ?? [];
    const events = eventsRes.data ?? [];
    return {
      activeBans: bans.filter((b) => b.status === "active").length,
      totalBans: bans.length,
      events24h: events.length,
      blocked24h: events.filter((e) => e.kind === "blocked_access").length,
      newDevices24h: events.filter((e) => e.kind === "new_device").length,
      vpnAttempts24h: events.filter((e) => e.is_vpn).length,
      totalSessions: sessionsRes.count ?? 0,
      pendingAppeals: appealsRes.count ?? 0,
    };
  });