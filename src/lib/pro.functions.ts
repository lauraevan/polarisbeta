import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

/** Redeem a Pro key for the signed-in user. */
export const redeemProKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ code: z.string().min(4).max(64) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const code = data.code.trim().toUpperCase();
    const { data: result, error } = await supabase.rpc("redeem_pro_key", {
      _code: code,
    });
    if (error) return { ok: false as const, error: error.message };
    return result as { ok: boolean; error?: string; tier?: string; pro_until?: string };
  });

/** Generate a new key (owner only). */
export const generateProKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        tier: z.enum(["monthly", "lifetime"]),
        duration_days: z.number().int().min(1).max(3650).optional(),
        source: z.string().max(64).optional(),
        note: z.string().max(200).optional(),
        expires_at: z.string().datetime().nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    // Verify owner
    const { data: prof } = await supabaseAdmin
      .from("profiles")
      .select("is_owner")
      .eq("id", userId)
      .maybeSingle();
    if (!prof?.is_owner) return { ok: false as const, error: "not_authorized" };

    // Random key: POL-XXXX-XXXX-XXXX
    const alpha = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const seg = () =>
      Array.from({ length: 4 }, () => alpha[Math.floor(Math.random() * alpha.length)]).join("");
    const code = `POL-${seg()}-${seg()}-${seg()}`;

    const { error } = await supabaseAdmin.from("pro_keys").insert({
      code,
      tier: data.tier,
      duration_days: data.tier === "monthly" ? data.duration_days ?? 30 : null,
      source: data.source ?? "manual",
      note: data.note ?? null,
      expires_at: data.expires_at ?? null,
    } as never);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, code };
  });
