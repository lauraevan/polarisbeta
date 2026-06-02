import { createServerFn } from "@tanstack/react-start";
import { getRequest, getRequestHeader, getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { parseUA } from "./device-fingerprint";

type GeoLookup = {
  ip: string;
  country?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  asn?: string;
  org?: string;
  is_vpn?: boolean;
  is_proxy?: boolean;
  is_tor?: boolean;
};

const geoCache = new Map<string, { at: number; data: GeoLookup }>();
const GEO_TTL = 1000 * 60 * 60 * 12; // 12h

async function geoLookup(ip: string): Promise<GeoLookup> {
  if (!ip || ip === "::1" || ip === "127.0.0.1") return { ip };
  const cached = geoCache.get(ip);
  if (cached && Date.now() - cached.at < GEO_TTL) return cached.data;
  const token = process.env.IPINFO_TOKEN;
  if (!token) return { ip };
  try {
    const res = await fetch(`https://ipinfo.io/${ip}?token=${token}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return { ip };
    const j = (await res.json()) as Record<string, string | undefined>;
    const [lat, lon] = (j.loc ?? ",").split(",").map((v) => Number(v) || undefined);
    const privacy = (j as Record<string, unknown>).privacy as
      | { vpn?: boolean; proxy?: boolean; tor?: boolean }
      | undefined;
    const data: GeoLookup = {
      ip,
      country: j.country,
      region: j.region,
      city: j.city,
      latitude: lat,
      longitude: lon,
      asn: (j.org ?? "").split(" ")[0] || undefined,
      org: j.org,
      is_vpn: privacy?.vpn ?? false,
      is_proxy: privacy?.proxy ?? false,
      is_tor: privacy?.tor ?? false,
    };
    geoCache.set(ip, { at: Date.now(), data });
    return data;
  } catch {
    return { ip };
  }
}

function clientIp(): string {
  // Prefer common edge headers, then fall back to TanStack helper.
  const cf = getRequestHeader("cf-connecting-ip");
  if (cf) return cf;
  const xri = getRequestHeader("x-real-ip");
  if (xri) return xri;
  const xff = getRequestHeader("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const helper = getRequestIP({ xForwardedFor: true });
  return helper ?? "";
}

/**
 * Record a visit + return the current ban status for this caller.
 * Called from BanGate on every app mount.
 */
export const recordVisitAndCheckBan = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        deviceFingerprint: z.string().min(4).max(128),
        userId: z.string().uuid().nullable().optional(),
        username: z.string().max(64).nullable().optional(),
        path: z.string().max(512).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const ip = clientIp();
    const ua = getRequestHeader("user-agent") ?? "";
    const { os, browser, deviceType } = parseUA(ua);
    const geo = await geoLookup(ip);

    // Upsert device session row
    const sessionRow = {
      user_id: data.userId ?? null,
      username: data.username ?? null,
      device_fingerprint: data.deviceFingerprint,
      ip: ip || null,
      user_agent: ua,
      browser,
      os,
      device_type: deviceType,
      country: geo.country ?? null,
      region: geo.region ?? null,
      city: geo.city ?? null,
      latitude: geo.latitude ?? null,
      longitude: geo.longitude ?? null,
      asn: geo.asn ?? null,
      org: geo.org ?? null,
      is_vpn: geo.is_vpn ?? false,
      is_proxy: geo.is_proxy ?? false,
      is_tor: geo.is_tor ?? false,
      last_seen_at: new Date().toISOString(),
    };

    // Look for existing row to detect "new device"
    const existingQuery = supabaseAdmin
      .from("device_sessions")
      .select("id, visit_count")
      .eq("device_fingerprint", data.deviceFingerprint);
    const { data: existing } = data.userId
      ? await existingQuery.eq("user_id", data.userId).maybeSingle()
      : await existingQuery.is("user_id", null).maybeSingle();

    let isNewDevice = false;
    if (existing) {
      await supabaseAdmin
        .from("device_sessions")
        .update({ ...sessionRow, visit_count: (existing.visit_count ?? 1) + 1 })
        .eq("id", existing.id);
    } else {
      isNewDevice = true;
      await supabaseAdmin.from("device_sessions").insert(sessionRow);
    }

    if (isNewDevice && data.userId) {
      await supabaseAdmin.from("security_events").insert({
        kind: "new_device",
        severity: "warn",
        user_id: data.userId,
        username: data.username ?? null,
        device_fingerprint: data.deviceFingerprint,
        ip: ip || null,
        user_agent: ua,
        country: geo.country ?? null,
        region: geo.region ?? null,
        city: geo.city ?? null,
        latitude: geo.latitude ?? null,
        longitude: geo.longitude ?? null,
        asn: geo.asn ?? null,
        org: geo.org ?? null,
        is_vpn: geo.is_vpn ?? false,
        is_proxy: geo.is_proxy ?? false,
        is_tor: geo.is_tor ?? false,
        path: data.path ?? null,
        detail: { browser, os, deviceType },
      });
    } else {
      await supabaseAdmin.from("security_events").insert({
        kind: data.userId ? "session_resumed" : "session_resumed",
        severity: "info",
        user_id: data.userId ?? null,
        username: data.username ?? null,
        device_fingerprint: data.deviceFingerprint,
        ip: ip || null,
        user_agent: ua,
        country: geo.country ?? null,
        region: geo.region ?? null,
        city: geo.city ?? null,
        latitude: geo.latitude ?? null,
        longitude: geo.longitude ?? null,
        asn: geo.asn ?? null,
        org: geo.org ?? null,
        is_vpn: geo.is_vpn ?? false,
        is_proxy: geo.is_proxy ?? false,
        is_tor: geo.is_tor ?? false,
        path: data.path ?? null,
        detail: {},
      });
    }

    // Check active bans against user / ip / device.
    // Types from generated client may not reflect nullable args yet; cast args.
    const { data: hits } = await supabaseAdmin.rpc("check_ban_status", {
      _user_id: (data.userId ?? null) as unknown as string,
      _ip: (ip || null) as unknown as string,
      _device_fingerprint: data.deviceFingerprint,
    });

    const matches = (hits ?? []) as Array<{
      ban_id: string;
      type: "full_site" | "chat_only" | "dm_only" | "shadow";
      reason: string;
      expires_at: string | null;
      created_at: string;
    }>;

    // Prioritize strongest ban
    const order = { full_site: 4, shadow: 3, chat_only: 2, dm_only: 1 } as const;
    matches.sort((a, b) => order[b.type] - order[a.type]);
    const top = matches[0] ?? null;

    if (top) {
      await supabaseAdmin.from("security_events").insert({
        kind: "blocked_access",
        severity: "high",
        user_id: data.userId ?? null,
        username: data.username ?? null,
        device_fingerprint: data.deviceFingerprint,
        ip: ip || null,
        user_agent: ua,
        country: geo.country ?? null,
        region: geo.region ?? null,
        city: geo.city ?? null,
        latitude: geo.latitude ?? null,
        longitude: geo.longitude ?? null,
        asn: geo.asn ?? null,
        org: geo.org ?? null,
        is_vpn: geo.is_vpn ?? false,
        is_proxy: geo.is_proxy ?? false,
        is_tor: geo.is_tor ?? false,
        path: data.path ?? null,
        ban_id: top.ban_id,
        detail: {
          type: top.type,
          allMatches: matches.length,
          ...(geo.is_vpn || geo.is_proxy || geo.is_tor
            ? { note: "Possible VPN/proxy evasion" }
            : {}),
        },
      });
    }

    return {
      isNewDevice,
      ban: top,
      geo: {
        country: geo.country ?? null,
        city: geo.city ?? null,
        is_vpn: geo.is_vpn ?? false,
        is_proxy: geo.is_proxy ?? false,
        is_tor: geo.is_tor ?? false,
      },
    };
  });

/** Public: submit an appeal (works even when banned). */
export const submitBanAppeal = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        banId: z.string().uuid(),
        deviceFingerprint: z.string().min(4).max(128),
        userId: z.string().uuid().nullable().optional(),
        message: z.string().min(10).max(2000),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const ip = clientIp();
    const { error } = await supabaseAdmin.from("ban_appeals").insert({
      ban_id: data.banId,
      user_id: data.userId ?? null,
      device_fingerprint: data.deviceFingerprint,
      ip: ip || null,
      message: data.message,
    });
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("security_events").insert({
      kind: "appeal_submitted",
      severity: "info",
      user_id: data.userId ?? null,
      device_fingerprint: data.deviceFingerprint,
      ip: ip || null,
      ban_id: data.banId,
      detail: { messageLength: data.message.length },
    });
    return { ok: true };
  });