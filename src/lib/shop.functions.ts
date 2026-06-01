import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getShopState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
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
      user_id: userId, kind: "quest", coins_delta: quest.reward_coins ?? 0,
      reference: quest.id, meta: { name: quest.name } as never,
    });
    return { ok: true, coins: newCoins };
  });