import { useEffect, useRef, useState } from "react";
import { Users, X, Copy, LogOut, Crown, Play, Pause, Sparkles, Smile } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import {
  createParty,
  findPartyByCode,
  joinParty,
  leaveParty,
  listMembers,
  updatePartyState,
  type WatchParty,
  type WatchPartyMember,
} from "@/lib/watch-party";

const REACTIONS = ["❤️", "🔥", "😂", "😱", "👏", "🎉", "🤯", "😴"] as const;
type FloatReaction = { id: string; emoji: string; left: number };

type Props = {
  kind: "movie" | "tv";
  tmdbId: number;
  title: string;
  season: number;
  episode: number;
  providerIdx: number;
  isPlaying: boolean;
  positionSeconds: number;
  /** Called when the host (or remote host) changes media state — viewers apply it. */
  onRemoteState: (next: Pick<WatchParty, "season" | "episode" | "provider_idx" | "is_playing" | "position_seconds">) => void;
  onClose: () => void;
};

export function WatchPartyPanel(props: Props) {
  const { user } = useAuth();
  const [party, setParty] = useState<WatchParty | null>(null);
  const [members, setMembers] = useState<WatchPartyMember[]>([]);
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [floats, setFloats] = useState<FloatReaction[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const isHost = party && user && party.host_id === user.id;

  // Subscribe to realtime party updates + member changes
  useEffect(() => {
    if (!party) return;
    listMembers(party.id).then(setMembers);
    const ch = supabase
      .channel(`party-${party.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "watch_parties", filter: `id=eq.${party.id}` }, (payload) => {
        const next = payload.new as WatchParty;
        setParty(next);
        if (user && next.host_id !== user.id) {
          props.onRemoteState({
            season: next.season,
            episode: next.episode,
            provider_idx: next.provider_idx,
            is_playing: next.is_playing,
            position_seconds: next.position_seconds,
          });
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "watch_party_members", filter: `party_id=eq.${party.id}` }, () => {
        listMembers(party.id).then(setMembers);
      })
      .on("broadcast", { event: "reaction" }, (msg) => {
        const emoji = (msg.payload as { emoji?: string })?.emoji;
        if (!emoji) return;
        const r: FloatReaction = {
          id: Math.random().toString(36).slice(2),
          emoji,
          left: 10 + Math.random() * 75,
        };
        setFloats((prev) => [...prev, r]);
        window.setTimeout(() => {
          setFloats((prev) => prev.filter((x) => x.id !== r.id));
        }, 2400);
      })
      .subscribe();
    channelRef.current = ch;
    return () => {
      channelRef.current = null;
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [party?.id, user?.id]);

  function sendReaction(emoji: string) {
    const ch = channelRef.current;
    if (!ch) return;
    ch.send({ type: "broadcast", event: "reaction", payload: { emoji } });
    // Mirror locally so the sender also sees their reaction
    const r: FloatReaction = {
      id: Math.random().toString(36).slice(2),
      emoji,
      left: 10 + Math.random() * 75,
    };
    setFloats((prev) => [...prev, r]);
    window.setTimeout(() => {
      setFloats((prev) => prev.filter((x) => x.id !== r.id));
    }, 2400);
  }

  // Host: push local state changes to the room
  useEffect(() => {
    if (!party || !isHost) return;
    const t = window.setTimeout(() => {
      updatePartyState(party.id, {
        season: props.season,
        episode: props.episode,
        provider_idx: props.providerIdx,
        is_playing: props.isPlaying,
        position_seconds: props.positionSeconds,
      }).catch(() => {});
    }, 250);
    return () => window.clearTimeout(t);
  }, [party, isHost, props.season, props.episode, props.providerIdx, props.isPlaying, props.positionSeconds]);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const p = await createParty({
        kind: props.kind,
        tmdb_id: props.tmdbId,
        title: props.title,
        season: props.season,
        episode: props.episode,
        provider_idx: props.providerIdx,
      });
      setParty(p);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function join() {
    setBusy(true);
    setError(null);
    try {
      const p = await findPartyByCode(joinCode);
      if (!p) throw new Error("No party with that code");
      await joinParty(p.id);
      setParty(p);
      props.onRemoteState({
        season: p.season,
        episode: p.episode,
        provider_idx: p.provider_idx,
        is_playing: p.is_playing,
        position_seconds: p.position_seconds,
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function exit() {
    if (!party) return;
    await leaveParty(party.id);
    setParty(null);
  }

  return (
    <div className="flex h-full flex-col bg-black/85 backdrop-blur-xl">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <Users className="h-4 w-4 text-[rgb(var(--polaris-accent))]" />
        <div className="text-sm font-bold text-white">Watch Party</div>
        <button onClick={props.onClose} className="ml-auto rounded p-1 text-white/70 hover:bg-white/10" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
      </div>

      {!user && (
        <div className="p-4 text-sm text-white/70">Sign in to start or join a party.</div>
      )}

      {user && !party && (
        <div className="space-y-5 p-4">
          <button
            onClick={start}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[rgb(var(--polaris-accent))] px-4 py-3 text-sm font-bold text-black hover:brightness-110 disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" /> Start a party for this title
          </button>
          <div className="text-center text-[10px] uppercase tracking-[0.25em] text-white/40">or join with a code</div>
          <div className="flex gap-2">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center font-mono text-base tracking-[0.3em] text-white focus:outline-none"
            />
            <button
              onClick={join}
              disabled={busy || joinCode.length < 4}
              className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-black hover:bg-white/90 disabled:opacity-40"
            >
              Join
            </button>
          </div>
          {error && <div className="text-xs text-red-400">{error}</div>}
          <p className="text-[11px] leading-5 text-white/50">
            Share the code with friends. The host controls episode, source, and play/pause — viewers stay in sync automatically.
          </p>
        </div>
      )}

      {party && (
        <div className="flex min-h-0 flex-1 flex-col p-4">
          <div className="rounded-2xl bg-gradient-to-br from-[rgb(var(--polaris-accent))]/20 to-transparent p-4 ring-1 ring-white/10">
            <div className="text-[10px] uppercase tracking-[0.25em] text-white/55">Party code</div>
            <div className="mt-1 flex items-center gap-2">
              <span className="font-mono text-3xl font-black tracking-[0.25em] text-white">{party.code}</span>
              <button
                onClick={() => navigator.clipboard?.writeText(party.code)}
                className="ml-auto rounded-lg bg-white/10 p-1.5 text-white/85 hover:bg-white/20"
                aria-label="Copy"
                title="Copy"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-white/65">
              {party.is_playing ? <Play className="h-3 w-3 fill-current" /> : <Pause className="h-3 w-3" />}
              {isHost ? "You're hosting" : "Synced to host"} · {members.length} watching
            </div>
          </div>

          <div className="mt-4 text-[10px] uppercase tracking-[0.25em] text-white/45">Viewers</div>
          <div className="mt-2 flex-1 space-y-1 overflow-y-auto">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/5">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-sm">
                  {m.avatar_emoji ?? "👤"}
                </span>
                <span className="truncate text-sm text-white/90">{m.username}</span>
                {m.user_id === party.host_id && (
                  <Crown className="ml-auto h-3.5 w-3.5 text-amber-400" />
                )}
              </div>
            ))}
          </div>

          <button
            onClick={exit}
            className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/85 hover:bg-white/10"
          >
            <LogOut className="h-3.5 w-3.5" /> Leave party
          </button>
        </div>
      )}
    </div>
  );
}