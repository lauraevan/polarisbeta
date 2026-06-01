import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type FriendEdge = {
  id: string;
  other_id: string;
  other_username: string;
  other_avatar_emoji: string | null;
  other_avatar_url: string | null;
  status: "pending" | "accepted";
  direction: "incoming" | "outgoing" | "mutual";
};

/** Send a friend request by username. */
export const sendFriendRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ username: z.string().min(1).max(60) }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: target } = await supabase
      .from("profiles").select("id").eq("username", data.username).maybeSingle();
    if (!target) throw new Error("User not found");
    if (target.id === userId) throw new Error("You can't friend yourself");
    // If reverse pending exists, auto-accept.
    const { data: reverse } = await supabase
      .from("friendships").select("id,status")
      .eq("requester_id", target.id).eq("addressee_id", userId).maybeSingle();
    if (reverse) {
      if (reverse.status !== "accepted") {
        await supabase.from("friendships").update({ status: "accepted" }).eq("id", reverse.id);
      }
      return { ok: true, accepted: true };
    }
    const { error } = await supabase.from("friendships")
      .insert({ requester_id: userId, addressee_id: target.id, status: "pending" });
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    return { ok: true, accepted: false };
  });

/** Accept a pending request you received. */
export const acceptFriendRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ friendshipId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("friendships").update({ status: "accepted" })
      .eq("id", data.friendshipId).eq("addressee_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Remove a friend or cancel/decline a request. */
export const removeFriend = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ otherId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase.from("friendships").delete()
      .or(`and(requester_id.eq.${userId},addressee_id.eq.${data.otherId}),and(requester_id.eq.${data.otherId},addressee_id.eq.${userId})`);
    return { ok: true };
  });

/** List my friends + pending requests (both directions). */
export const listFriends = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: rows } = await supabase
      .from("friendships").select("id,requester_id,addressee_id,status")
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
    const list = rows ?? [];
    const otherIds = Array.from(new Set(list.map((r) => r.requester_id === userId ? r.addressee_id : r.requester_id)));
    const { data: profs } = otherIds.length
      ? await supabase.from("profiles").select("id,username,avatar_emoji,avatar_url").in("id", otherIds)
      : { data: [] as Array<{ id: string; username: string; avatar_emoji: string | null; avatar_url: string | null }> };
    const pmap = new Map((profs ?? []).map((p) => [p.id, p]));
    const edges: FriendEdge[] = list.map((r) => {
      const otherId = r.requester_id === userId ? r.addressee_id : r.requester_id;
      const p = pmap.get(otherId);
      return {
        id: r.id,
        other_id: otherId,
        other_username: p?.username ?? "unknown",
        other_avatar_emoji: p?.avatar_emoji ?? null,
        other_avatar_url: p?.avatar_url ?? null,
        status: r.status as "pending" | "accepted",
        direction: r.status === "accepted"
          ? "mutual"
          : (r.requester_id === userId ? "outgoing" : "incoming"),
      };
    });
    return { edges };
  });

/** Get friendship status between me and a specific user. */
export const getFriendStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ otherId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (data.otherId === userId) return { state: "self" as const, id: null as string | null };
    const { data: rows } = await supabase
      .from("friendships").select("id,requester_id,addressee_id,status")
      .or(`and(requester_id.eq.${userId},addressee_id.eq.${data.otherId}),and(requester_id.eq.${data.otherId},addressee_id.eq.${userId})`)
      .limit(1);
    const r = rows?.[0];
    if (!r) return { state: "none" as const, id: null };
    if (r.status === "accepted") return { state: "friends" as const, id: r.id };
    return {
      state: (r.requester_id === userId ? "outgoing" : "incoming") as "outgoing" | "incoming",
      id: r.id,
    };
  });