import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Send, Image as ImageIcon, Smile, Paintbrush, Sparkles, Loader2, Hash, Plus, X, Search, MessageCircle, Palette } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { tenorSearch, type TenorGif } from "@/lib/tenor";
import { DrawingCanvas } from "./DrawingCanvas";

type Channel = { id: string; slug: string; name: string; description: string | null; emoji: string | null };
type Attachment = { kind: "image" | "gif" | "drawing" | "link"; url: string };
type Message = {
  id: string;
  channel_id: string;
  user_id: string;
  username: string;
  avatar_emoji: string | null;
  accent_color: string | null;
  content: string | null;
  attachments: Attachment[];
  created_at: string;
};

const EMOJI_SHORTCUTS = ["😂","❤️","🔥","✨","🎮","🎬","🌙","🍂","☕️","🦊","💎","🌊","😎","🤔","😭","👀","🥲","🫶","🙌","🤝"];

export function ChatRoom() {
  const { user, profile } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [gifOpen, setGifOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [drawOpen, setDrawOpen] = useState(false);
  const [newChannelOpen, setNewChannelOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load channels
  useEffect(() => {
    supabase.from("chat_channels").select("*").order("created_at", { ascending: true }).then(({ data }) => {
      const list = (data || []) as Channel[];
      setChannels(list);
      if (!activeId && list[0]) setActiveId(list[0].id);
    });
    const sub = supabase
      .channel("chat_channels_rt")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_channels" }, (payload) => {
        setChannels((c) => [...c, payload.new as unknown as Channel]);
      })
      .subscribe();
    return () => { sub.unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load messages + subscribe per channel
  useEffect(() => {
    if (!activeId) return;
    setMessages([]);
    let cancelled = false;
    supabase
      .from("chat_messages")
      .select("*")
      .eq("channel_id", activeId)
      .order("created_at", { ascending: false })
      .limit(80)
      .then(({ data }) => {
        if (cancelled) return;
        setMessages(((data || []) as unknown as Message[]).reverse());
        setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }), 50);
      });
    const sub = supabase
      .channel(`chat_msgs_${activeId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `channel_id=eq.${activeId}` },
        (payload) => {
          setMessages((m) => [...m, payload.new as unknown as Message]);
          setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current!.scrollHeight, behavior: "smooth" }), 30);
        },
      )
      .subscribe();
    return () => { cancelled = true; sub.unsubscribe(); };
  }, [activeId]);

  const active = useMemo(() => channels.find((c) => c.id === activeId) ?? null, [channels, activeId]);

  const send = useCallback(
    async (content: string | null, attachments: Attachment[] = []) => {
      if (!user || !profile || !activeId) return;
      if (!content?.trim() && attachments.length === 0) return;
      setSending(true);
      const { error } = await supabase.from("chat_messages").insert({
        channel_id: activeId,
        user_id: user.id,
        username: profile.username,
        avatar_emoji: profile.avatar_emoji,
        accent_color: profile.accent_color,
        content: content?.trim() || null,
        attachments: attachments as unknown as Attachment[],
      });
      setSending(false);
      if (!error) setText("");
    },
    [user, profile, activeId],
  );

  const sendGartic = useCallback(async () => {
    const url = window.prompt("Paste your Gartic Phone invite URL", "https://garticphone.com/en/?c=");
    if (!url) return;
    await send(`🎨 Join my Gartic Phone game!`, [{ kind: "link", url }]);
  }, [send]);

  const uploadImage = useCallback(
    async (file: File) => {
      if (!user) return;
      const ext = file.name.split(".").pop() || "png";
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("chat").upload(path, file, { upsert: false });
      if (error) return alert("Upload failed: " + error.message);
      const { data } = supabase.storage.from("chat").getPublicUrl(path);
      await send(null, [{ kind: "image", url: data.publicUrl }]);
    },
    [user, send],
  );

  const sendDrawing = useCallback(
    async (dataUrl: string) => {
      setDrawOpen(false);
      if (!user) return;
      const blob = await (await fetch(dataUrl)).blob();
      const path = `${user.id}/draw-${Date.now()}.png`;
      const { error } = await supabase.storage.from("chat").upload(path, blob, { contentType: "image/png" });
      if (error) return alert("Save failed: " + error.message);
      const { data } = supabase.storage.from("chat").getPublicUrl(path);
      await send(null, [{ kind: "drawing", url: data.publicUrl }]);
    },
    [user, send],
  );

  const createChannel = useCallback(
    async (name: string) => {
      if (!user) return;
      const slug = name.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
      if (!slug) return;
      await supabase.from("chat_channels").insert({ slug, name: slug, created_by: user.id, emoji: "✨" });
      setNewChannelOpen(false);
    },
    [user],
  );

  if (!user || !profile) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <div className="liquid-glass-themed max-w-md rounded-3xl p-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/12">
            <MessageCircle className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-3 text-xl font-bold text-white">Sign in to chat</h2>
          <p className="mt-1 text-sm text-white/60">
            Polaris Chat needs a profile so others can see your name and color.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-1px)] overflow-hidden">
      {/* Channels sidebar */}
      <aside className="liquid-glass hidden h-full w-56 flex-col gap-1 rounded-none border-r border-white/5 p-3 sm:flex">
        <div className="px-2 pb-2 text-[10px] uppercase tracking-[0.2em] text-white/45">Channels</div>
        {channels.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveId(c.id)}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
              activeId === c.id ? "bg-white/15 text-white" : "text-white/65 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span>{c.emoji || "#"}</span>
            <span className="truncate">{c.name}</span>
          </button>
        ))}
        <button
          onClick={() => setNewChannelOpen(true)}
          className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-white/50 hover:bg-white/5 hover:text-white"
        >
          <Plus className="h-3.5 w-3.5" /> New channel
        </button>
      </aside>

      {/* Main */}
      <main className="flex h-full min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="liquid-glass flex items-center gap-3 border-b border-white/5 px-4 py-3 sm:px-6">
          <Hash className="h-4 w-4 text-white/40" />
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-white">{active?.name || "Chat"}</div>
            {active?.description && (
              <div className="truncate text-[11px] text-white/45">{active.description}</div>
            )}
          </div>
          {/* mobile channel picker */}
          <select
            className="sm:hidden ml-auto rounded-md border border-white/10 bg-black/30 px-2 py-1 text-xs text-white"
            value={activeId ?? ""}
            onChange={(e) => setActiveId(e.target.value)}
          >
            {channels.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
          </select>
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 sm:px-6">
          <div className="mx-auto flex max-w-3xl flex-col gap-3">
            {messages.map((m, i) => (
              <MessageBubble
                key={m.id}
                m={m}
                prevSame={i > 0 && messages[i - 1].user_id === m.user_id && new Date(m.created_at).getTime() - new Date(messages[i - 1].created_at).getTime() < 5 * 60 * 1000}
              />
            ))}
          </div>
        </div>

        {/* Composer */}
        <div className="border-t border-white/5 p-3 sm:px-6">
          <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-white/10 bg-black/30 p-2 backdrop-blur-md">
            <button onClick={() => fileRef.current?.click()} className="rounded-lg p-2 text-white/65 hover:bg-white/5 hover:text-white" title="Upload image">
              <ImageIcon className="h-4 w-4" />
            </button>
            <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0]; if (f) uploadImage(f); e.currentTarget.value = "";
            }} />
            <button onClick={() => setGifOpen(true)} className="rounded-lg p-2 text-white/65 hover:bg-white/5 hover:text-white" title="GIF">
              <Sparkles className="h-4 w-4" />
            </button>
            <button onClick={() => setDrawOpen(true)} className="rounded-lg p-2 text-white/65 hover:bg-white/5 hover:text-white" title="Draw">
              <Paintbrush className="h-4 w-4" />
            </button>
            <button onClick={sendGartic} className="rounded-lg p-2 text-white/65 hover:bg-white/5 hover:text-white" title="Gartic Phone">
              <Palette className="h-4 w-4" />
            </button>
            <div className="relative flex-1">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(text);
                  }
                }}
                placeholder={`Message #${active?.name || ""}`}
                rows={1}
                className="max-h-32 w-full resize-none bg-transparent px-2 py-2 text-sm text-white placeholder:text-white/35 focus:outline-none"
              />
              {emojiOpen && (
                <div className="absolute bottom-full right-0 mb-2 grid w-64 grid-cols-10 gap-1 rounded-xl border border-white/10 bg-black/85 p-2 backdrop-blur-md">
                  {EMOJI_SHORTCUTS.map((e) => (
                    <button key={e} onClick={() => { setText((t) => t + e); setEmojiOpen(false); }} className="rounded p-1 text-lg hover:bg-white/10">{e}</button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => setEmojiOpen((v) => !v)} className="rounded-lg p-2 text-white/65 hover:bg-white/5 hover:text-white" title="Emoji">
              <Smile className="h-4 w-4" />
            </button>
            <button
              onClick={() => send(text)}
              disabled={sending || !text.trim()}
              className="rounded-lg bg-[rgb(var(--polaris-accent))] p-2 text-black transition disabled:opacity-40"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </main>

      {gifOpen && <GifPicker onPick={(g) => { setGifOpen(false); send(null, [{ kind: "gif", url: g.full }]); }} onClose={() => setGifOpen(false)} />}
      {drawOpen && <DrawingCanvas onSend={sendDrawing} onClose={() => setDrawOpen(false)} />}
      {newChannelOpen && (
        <NewChannelDialog onCreate={createChannel} onClose={() => setNewChannelOpen(false)} />
      )}
    </div>
  );
}

function MessageBubble({ m, prevSame }: { m: Message; prevSame: boolean }) {
  const time = new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return (
    <div className={`flex gap-3 ${prevSame ? "pt-0.5" : "pt-2"}`}>
      <div className="w-9 shrink-0">
        {!prevSame && (
          <div
            className="grid h-9 w-9 place-items-center rounded-full text-base"
            style={{ background: `rgb(${m.accent_color || "120 120 130"}/0.35)`, boxShadow: `inset 0 0 0 1px rgb(${m.accent_color || "120 120 130"}/0.55)` }}
          >
            {m.avatar_emoji || "✨"}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        {!prevSame && (
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold" style={{ color: `rgb(${m.accent_color || "240 240 240"})` }}>{m.username}</span>
            <span className="text-[10px] text-white/35">{time}</span>
          </div>
        )}
        {m.content && <div className="whitespace-pre-wrap break-words text-sm text-white/90">{m.content}</div>}
        {m.attachments?.map((a, i) => (
          <div key={i} className="mt-1.5 max-w-md overflow-hidden rounded-lg border border-white/10">
            {a.kind === "image" || a.kind === "gif" || a.kind === "drawing" ? (
              <img src={a.url} alt="" className="block max-h-80 w-auto object-contain" loading="lazy" />
            ) : (
              <a href={a.url} target="_blank" rel="noreferrer" className="block bg-white/5 px-3 py-2 text-xs text-white/80 underline">{a.url}</a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function GifPicker({ onPick, onClose }: { onPick: (g: TenorGif) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [gifs, setGifs] = useState<TenorGif[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    const t = setTimeout(() => {
      tenorSearch(q, 24, ctrl.signal).then((r) => { setGifs(r); setLoading(false); }).catch(() => setLoading(false));
    }, 250);
    return () => { ctrl.abort(); clearTimeout(t); };
  }, [q]);
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 p-0 backdrop-blur-md sm:items-center sm:p-6" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl rounded-t-2xl border border-white/10 bg-zinc-950 p-4 shadow-2xl sm:rounded-2xl">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-3 py-2">
            <Search className="h-4 w-4 text-white/50" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search Tenor…" className="flex-1 bg-transparent text-sm text-white focus:outline-none" autoFocus />
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-white/10"><X className="h-4 w-4 text-white" /></button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex h-32 items-center justify-center text-white/40"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
              {gifs.map((g) => (
                <button key={g.id} onClick={() => onPick(g)} className="overflow-hidden rounded-md border border-white/5 transition hover:scale-[1.02] hover:border-white/30">
                  <img src={g.preview || g.full} alt={g.title} className="block h-full w-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NewChannelDialog({ onCreate, onClose }: { onCreate: (name: string) => void; onClose: () => void }) {
  const [name, setName] = useState("");
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-6 backdrop-blur-md" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-950 p-5">
        <h3 className="text-sm font-bold text-white">New channel</h3>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="channel-name"
          className="mt-3 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md px-3 py-1.5 text-xs text-white/65 hover:bg-white/5">Cancel</button>
          <button onClick={() => onCreate(name)} className="rounded-md bg-[rgb(var(--polaris-accent))] px-4 py-1.5 text-xs font-bold text-black">Create</button>
        </div>
      </div>
    </div>
  );
}