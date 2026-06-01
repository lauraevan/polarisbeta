import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Derive quest completion from real data and upsert into user_quest_progress.
 * Called by Shop on open so achievements actually reflect activity instead of
 * sitting at "in progress" forever.
 */
async function evaluateQuestProgress(userId: string) {
  const { data: quests } = await supabaseAdmin
    .from("quests").select("*").eq("is_active", true);
  if (!quests?.length) return;

  const { data: progressRows } = await supabaseAdmin
    .from("user_quest_progress").select("*").eq("user_id", userId);
  const progress = new Map((progressRows ?? []).map((p) => [p.quest_id, p]));

  // Pull the few metrics we need once.
  const [{ count: chatCount }, { data: profile }, { count: inventoryCount }] = await Promise.all([
    supabaseAdmin.from("chat_messages").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabaseAdmin.from("profiles").select("display_name, about_me, avatar_emoji, avatar_url").eq("id", userId).maybeSingle(),
    supabaseAdmin.from("user_inventory").select("id", { count: "exact", head: true }).eq("user_id", userId),
  ]);

  const today = new Date().toISOString().slice(0, 10);

  for (const q of quests) {
    const existing = progress.get(q.id);
    // For repeatable quests, if already claimed today skip re-marking complete.
    if (q.repeatable && existing?.claimed_at && existing.claimed_at.slice(0, 10) === today) continue;
    // For non-repeatable claimed quests, skip.
    if (!q.repeatable && existing?.claimed) continue;

    let completed = false;
    const target = (q.target ?? {}) as { count?: number };
    switch (q.kind) {
      case "daily_login":
      case "shop_visit":
        completed = true; // visiting the shop counts.
        break;
      case "chat_messages":
        completed = (chatCount ?? 0) >= (target.count ?? 10);
        break;
      case "customize_profile":
        completed = !!(profile && (profile.avatar_url || (profile.about_me && profile.about_me.length > 0) || (profile.display_name && profile.display_name.length > 0)));
        break;
      case "shop_purchase":
        completed = (inventoryCount ?? 0) > 0;
        break;
      // watch / play / wallpaper quests still need their dedicated trackers
      default:
        completed = existing?.completed ?? false;
    }

    const payload = {
      user_id: userId,
      quest_id: q.id,
      completed,
      completed_at: completed ? (existing?.completed_at ?? new Date().toISOString()) : null,
      progress: existing?.progress ?? {},
      claimed: existing?.claimed ?? false,
      claimed_at: existing?.claimed_at ?? null,
      updated_at: new Date().toISOString(),
    };
    await supabaseAdmin.from("user_quest_progress").upsert(payload, { onConflict: "user_id,quest_id" } as never);
  }
}

export const getShopState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    // Refresh achievement progress every time the shop opens so claimable
    // quests light up as soon as the underlying metric is met.
    try { await evaluateQuestProgress(userId); } catch (e) { console.error("quest eval", e); }

    const [items, wallet, inv, quests, progress] = await Promise.all([
      supabaseAdmin.from("shop_items").select("*").eq("is_active", true).order("sort_order"),
      supabaseAdmin.from("user_wallet").select("*").eq("user_id", userId).maybeSingle(),
      supabaseAdmin.from("user_inventory").select("*").eq("user_id", userId),
      supabaseAdmin.from("quests").select("*").eq("is_active", true).order("sort_order"),
      supabaseAdmin.from("user_quest_progress").select("*").eq("user_id", userId),
    ]);
    return {
      items: items.data ?? [],
      wallet: wallet.data ?? { coins: 0, basic_credits: 0, premium_credits: 0 },
      inventory: inv.data ?? [],
      quests: quests.data ?? [],
      progress: progress.data ?? [],
    };
  });

export const purchaseItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ itemId: z.string().min(1).max(100) }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: item, error: itemErr } = await supabaseAdmin
      .from("shop_items").select("*").eq("id", data.itemId).eq("is_active", true).maybeSingle();
    if (itemErr || !item) throw new Error("Item not found");
    if (!item.price_coins || item.price_coins <= 0) throw new Error("Item not purchasable with coins");

    const { data: owned } = await supabaseAdmin.from("user_inventory")
      .select("id").eq("user_id", userId).eq("item_id", item.id).maybeSingle();
    if (owned) throw new Error("Already owned");

    const { data: wallet } = await supabaseAdmin.from("user_wallet")
      .select("coins").eq("user_id", userId).maybeSingle();
    const coins = wallet?.coins ?? 0;
    if (coins < item.price_coins) throw new Error("Not enough coins");

    // Atomic-ish: deduct then insert. Worst case duplicate insert blocked by future unique idx.
    const newCoins = coins - item.price_coins;
    const { error: wErr } = await supabaseAdmin.from("user_wallet")
      .update({ coins: newCoins, updated_at: new Date().toISOString() })
      .eq("user_id", userId);
    if (wErr) throw new Error(wErr.message);

    const toInsert = [{ user_id: userId, item_id: item.id, equipped: false }];
    if (item.kind === "bundle" && Array.isArray(item.bundle_contents)) {
      for (const child of item.bundle_contents) {
        toInsert.push({ user_id: userId, item_id: child, equipped: false });
      }
    }
    await supabaseAdmin.from("user_inventory").upsert(toInsert, { onConflict: "user_id,item_id", ignoreDuplicates: true } as never);
    await supabaseAdmin.from("coin_transactions").insert({
      user_id: userId, kind: "purchase", coins_delta: -item.price_coins,
      reference: item.id, meta: { name: item.name } as never,
    });
    return { ok: true, coins: newCoins };
  });

export const claimQuest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ questId: z.string().min(1).max(100) }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: quest } = await supabaseAdmin.from("quests")
      .select("*").eq("id", data.questId).eq("is_active", true).maybeSingle();
    if (!quest) throw new Error("Quest not found");

    // Re-evaluate first so manual claim attempts succeed when the user just
    // crossed the threshold but the cached progress row was stale.
    await evaluateQuestProgress(userId);

    const { data: prog } = await supabaseAdmin.from("user_quest_progress")
      .select("*").eq("user_id", userId).eq("quest_id", quest.id).maybeSingle();
    if (!prog || !prog.completed) throw new Error("Quest not completed yet");
    if (prog.claimed && !quest.repeatable) throw new Error("Already claimed");

    const { data: wallet } = await supabaseAdmin.from("user_wallet")
      .select("coins").eq("user_id", userId).maybeSingle();
    const newCoins = (wallet?.coins ?? 0) + (quest.reward_coins ?? 0);
    await supabaseAdmin.from("user_wallet").update({ coins: newCoins }).eq("user_id", userId);
    await supabaseAdmin.from("user_quest_progress").update({
      claimed: true, claimed_at: new Date().toISOString(),
      // For repeatable quests, reset completion so user can earn again next cycle.
      ...(quest.repeatable ? { completed: false, completed_at: null, progress: {} } : {}),
    }).eq("id", prog.id);
    await supabaseAdmin.from("coin_transactions").insert({
      user_id: userId, kind: "quest_reward", coins_delta: quest.reward_coins ?? 0,
      reference: quest.id, meta: { name: quest.name } as never,
    });
    return { ok: true, coins: newCoins };
  });

/**
 * Trade coins for AI credits. Credits are ONLY for AI usage (never for items):
 *   - 25 coins → 1 basic credit  (free-tier models)
 *   - 50 coins → 1 premium credit (premium models)
 */
export const exchangeCoinsForCredits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      tier: z.enum(["basic", "premium"]),
      amount: z.number().int().min(1).max(200),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const rate = data.tier === "basic" ? 25 : 50;
    const cost = rate * data.amount;

    const { data: wallet } = await supabaseAdmin
      .from("user_wallet")
      .select("coins, basic_credits, premium_credits")
      .eq("user_id", userId).maybeSingle();
    const coins = wallet?.coins ?? 0;
    if (coins < cost) throw new Error(`Need ${cost} coins (have ${coins})`);

    const newCoins = coins - cost;
    const newBasic = (wallet?.basic_credits ?? 0) + (data.tier === "basic" ? data.amount : 0);
    const newPremium = (wallet?.premium_credits ?? 0) + (data.tier === "premium" ? data.amount : 0);

    await supabaseAdmin.from("user_wallet").update({
      coins: newCoins,
      basic_credits: newBasic,
      premium_credits: newPremium,
      updated_at: new Date().toISOString(),
    }).eq("user_id", userId);

    await supabaseAdmin.from("coin_transactions").insert({
      user_id: userId,
      kind: "exchange",
      coins_delta: -cost,
      basic_credits_delta: data.tier === "basic" ? data.amount : 0,
      premium_credits_delta: data.tier === "premium" ? data.amount : 0,
      reference: `coin->${data.tier}`,
      meta: { rate, amount: data.amount } as never,
    });
    return { ok: true, coins: newCoins, basic_credits: newBasic, premium_credits: newPremium };
  });

export const getAiWallet = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: wallet } = await supabaseAdmin
      .from("user_wallet")
      .select("coins, basic_credits, premium_credits")
      .eq("user_id", context.userId).maybeSingle();
    return wallet ?? { coins: 0, basic_credits: 0, premium_credits: 0 };
  });

/**
 * Burn one AI credit of the requested tier. Used by the AI chat when the
 * daily free quota is exhausted but the user has banked credits.
 */
export const consumeAiCredit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ tier: z.enum(["basic", "premium"]) }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: wallet } = await supabaseAdmin
      .from("user_wallet").select("coins, basic_credits, premium_credits")
      .eq("user_id", userId).maybeSingle();
    const field = data.tier === "basic" ? "basic_credits" : "premium_credits";
    const have = (wallet?.[field] as number | undefined) ?? 0;
    if (have < 1) throw new Error(`No ${data.tier} credits`);
    const update = data.tier === "basic"
      ? { basic_credits: have - 1 }
      : { premium_credits: have - 1 };
    await supabaseAdmin.from("user_wallet")
      .update({ ...update, updated_at: new Date().toISOString() })
      .eq("user_id", userId);
    return {
      ok: true,
      coins: wallet?.coins ?? 0,
      basic_credits: data.tier === "basic" ? have - 1 : wallet?.basic_credits ?? 0,
      premium_credits: data.tier === "premium" ? have - 1 : wallet?.premium_credits ?? 0,
    };
  });