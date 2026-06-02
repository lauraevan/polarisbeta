import { supabase } from "@/integrations/supabase/client";

export type WatchParty = {
  id: string;
  code: string;
  host_id: string;
  kind: "movie" | "tv";
  tmdb_id: number;
  title: string;
  season: number | null;
  episode: number | null;
  position_seconds: number;
  is_playing: boolean;
  provider_idx: number;
  state_updated_at: string;
  created_at: string;
};

export type WatchPartyMember = {
  id: string;
  party_id: string;
  user_id: string;
  username: string;
  avatar_emoji: string | null;
  joined_at: string;
};

function genCode() {
  // 6-char base36, easy to share
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function createParty(opts: {
  kind: "movie" | "tv";
  tmdb_id: number;
  title: string;
  season?: number;
  episode?: number;
  provider_idx?: number;
}): Promise<WatchParty> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Sign in to start a watch party");
  // Retry on rare code collision
  for (let i = 0; i < 4; i++) {
    const code = genCode();
    const { data, error } = await supabase
      .from("watch_parties")
      .insert({
        code,
        host_id: auth.user.id,
        kind: opts.kind,
        tmdb_id: opts.tmdb_id,
        title: opts.title,
        season: opts.season ?? null,
        episode: opts.episode ?? null,
        provider_idx: opts.provider_idx ?? 0,
        is_playing: true,
      })
      .select()
      .single();
    if (!error && data) {
      await joinParty(data.id);
      return data as WatchParty;
    }
    if (error && !`${error.message}`.toLowerCase().includes("duplicate")) {
      throw new Error(error.message);
    }
  }
  throw new Error("Could not generate a unique code, try again");
}

export async function findPartyByCode(code: string): Promise<WatchParty | null> {
  const { data } = await supabase
    .from("watch_parties")
    .select("*")
    .eq("code", code.trim().toUpperCase())
    .maybeSingle();
  return (data as WatchParty) ?? null;
}

export async function joinParty(partyId: string) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Sign in to join");
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, avatar_emoji")
    .eq("id", auth.user.id)
    .maybeSingle();
  await supabase.from("watch_party_members").upsert(
    {
      party_id: partyId,
      user_id: auth.user.id,
      username: profile?.username ?? "guest",
      avatar_emoji: profile?.avatar_emoji ?? null,
    },
    { onConflict: "party_id,user_id" },
  );
}

export async function leaveParty(partyId: string) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;
  await supabase
    .from("watch_party_members")
    .delete()
    .eq("party_id", partyId)
    .eq("user_id", auth.user.id);
}

export async function updatePartyState(
  partyId: string,
  patch: Partial<Pick<WatchParty, "season" | "episode" | "position_seconds" | "is_playing" | "provider_idx">>,
) {
  await supabase
    .from("watch_parties")
    .update({ ...patch, state_updated_at: new Date().toISOString() })
    .eq("id", partyId);
}

export async function listMembers(partyId: string): Promise<WatchPartyMember[]> {
  const { data } = await supabase
    .from("watch_party_members")
    .select("*")
    .eq("party_id", partyId)
    .order("joined_at", { ascending: true });
  return (data as WatchPartyMember[]) ?? [];
}