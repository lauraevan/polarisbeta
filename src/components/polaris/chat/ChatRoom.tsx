import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Send, Image as ImageIcon, Smile, Paintbrush, Sparkles, Loader2, Hash, Plus, X, Search,
  MessageCircle, Palette, AtSign, Bold, Italic, Code, Mic, BarChart3, Heart, Users, Bell,
  Megaphone, Bug, RefreshCcw, Crown, Link2, ChevronDown,
  Gamepad2, Coffee, Pin, Newspaper, Zap, MessagesSquare, Star, MonitorUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { tenorSearch, type TenorGif } from "@/lib/tenor";
import { DrawingCanvas } from "./DrawingCanvas";
import { AuthDialog } from "../AuthDialog";
import { ProfileSheet } from "../ProfileSheet";
import logo from "@/assets/polaris-logo.png";

type Tab = "global" | "dms" | "notifs";

type DM = {
  id: string;
  sender_id: string;
  recipient_id: string;
  sender_username: string;
  sender_avatar_emoji: string | null;
  sender_avatar_url: string | null;
  sender_accent_color: string | null;
  content: string | null;
  attachments: Attachment[];
  created_at: string;
};

type DMPartner = {
  user_id: string;
  username: string;
  avatar_emoji: string | null;
  avatar_url: string | null;
  accent_color: string | null;
  last: string;
  last_at: string;
};

// Channel grouping (matches the IMPORTANT / MAIN / LINKS layout)
const IMPORTANT_SLUGS = new Set(["updates", "bug-fixes", "announcements", "premium", "news"]);
const LINK_KEYWORDS = ["link", "links"];
function categorize(slug: string): "important" | "main" | "links" {
  if (IMPORTANT_SLUGS.has(slug)) return "important";
  if (LINK_KEYWORDS.some((k) => slug.includes(k))) return "links";
  return "main";
}
function iconForChannel(slug: string) {
  if (slug === "updates") return RefreshCcw;
  if (slug === "bug-fixes" || slug === "bug-reports" || slug.includes("bug")) return Bug;
  if (slug === "announcements") return Megaphone;
  if (slug === "news") return Newspaper;
  if (slug === "premium") return Crown;
  if (slug === "gaming" || slug.includes("game")) return Gamepad2;
  if (slug === "off-topic" || slug.includes("lounge")) return Coffee;
  if (slug === "general") return MessagesSquare;
  if (slug === "official-links" || slug === "official") return Pin;
  if (slug === "temporary-links" || slug.includes("temp")) return Zap;
  if (LINK_KEYWORDS.some((k) => slug.includes(k))) return Link2;
  if (slug.includes("star") || slug.includes("fav")) return Star;
  return Hash;
}

type Channel = { id: string; slug: string; name: string; description: string | null; emoji: string | null };
type Attachment = { kind: "image" | "gif" | "drawing" | "link"; url: string };
type Message = {
  id: string;
  channel_id: string;
  user_id: string;
  username: string;
  avatar_emoji: string | null;
  avatar_url?: string | null;
  accent_color: string | null;
  content: string | null;
  attachments: Attachment[];
  created_at: string;
};

const EMOJI_SHORTCUTS = ["😂","❤️","🔥","✨","🎮","🎬","🌙","🍂","☕️","🦊","💎","🌊","😎","🤔","😭","👀","🥲","🫶","🙌","🤝"];

export function ChatRoom() {
  const { user, profile } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const [tab, setTab] = useState<Tab>("global");
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [gifOpen, setGifOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [drawOpen, setDrawOpen] = useState(false);
  const [newChannelOpen, setNewChannelOpen] = useState(false);
  const [viewProfileId, setViewProfileId] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  // DMs
  const [dmPartners, setDmPartners] = useState<DMPartner[]>([]);
  const [dmActiveUserId, setDmActiveUserId] = useState<string | null>(null);
  const [dmMessages, setDmMessages] = useState<DM[]>([]);
  const [dmText, setDmText] = useState("");
  const [dmStartOpen, setDmStartOpen] = useState(false);
  // Notifs (mentions of current user across global channels)
  const [notifs, setNotifs] = useState<Message[]>([]);
  const recRef = useRef<MediaRecorder | null>(null);
  const [screenSharing, setScreenSharing] = useState(false);
  const screenRecRef = useRef<MediaRecorder | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dmScrollRef = useRef<HTMLDivElement>(null);

  // Load channels
  useEffect(() => {
    if (!user) return;
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
  }, [user]);

  // Load messages + subscribe per channel
  useEffect(() => {
    if (!user || !activeId) return;
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
  }, [activeId, user]);

  const active = useMemo(() => channels.find((c) => c.id === activeId) ?? null, [channels, activeId]);

  // ===== DMs: load partner list & subscribe =====
  useEffect(() => {
    if (!user || tab !== "dms") return;
    const uid = user.id;
    let cancelled = false;
    async function loadPartners() {
      const { data } = await supabase
        .from("direct_messages")
        .select("*")
        .or(`sender_id.eq.${uid},recipient_id.eq.${uid}`)
        .order("created_at", { ascending: false })
        .limit(200);
      if (cancelled) return;
      const list = (data || []) as unknown as DM[];
      const byPartner = new Map<string, DMPartner>();
      for (const m of list) {
        const otherId = m.sender_id === uid ? m.recipient_id : m.sender_id;
        if (byPartner.has(otherId)) continue;
        // Best-effort partner info: if they sent the latest msg we have it, otherwise placeholder
        const fromSender = m.sender_id === otherId;
        byPartner.set(otherId, {
          user_id: otherId,
          username: fromSender ? m.sender_username : "Friend",
          avatar_emoji: fromSender ? m.sender_avatar_emoji : null,
          avatar_url: fromSender ? m.sender_avatar_url : null,
          accent_color: fromSender ? m.sender_accent_color : null,
          last: m.content || (m.attachments?.length ? "📎 attachment" : ""),
          last_at: m.created_at,
        });
      }
      setDmPartners(Array.from(byPartner.values()));
    }
    loadPartners();
    const sub = supabase
      .channel(`dm_inbox_${uid}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "direct_messages", filter: `recipient_id=eq.${uid}` },
        () => loadPartners(),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "direct_messages", filter: `sender_id=eq.${uid}` },
        () => loadPartners(),
      )
      .subscribe();
    return () => { cancelled = true; sub.unsubscribe(); };
  }, [user, tab]);

  // Load active DM thread
  useEffect(() => {
    if (!user || !dmActiveUserId) { setDmMessages([]); return; }
    const uid = user.id;
    const otherId = dmActiveUserId;
    let cancelled = false;
    supabase
      .from("direct_messages")
      .select("*")
      .or(
        `and(sender_id.eq.${uid},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${uid})`,
      )
      .order("created_at", { ascending: true })
      .limit(200)
      .then(({ data }) => {
        if (cancelled) return;
        setDmMessages((data || []) as unknown as DM[]);
        setTimeout(() => dmScrollRef.current?.scrollTo({ top: dmScrollRef.current.scrollHeight }), 40);
      });
    const sub = supabase
      .channel(`dm_thread_${uid}_${otherId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages" }, (payload) => {
        const row = payload.new as unknown as DM;
        const involvesPair =
          (row.sender_id === uid && row.recipient_id === otherId) ||
          (row.sender_id === otherId && row.recipient_id === uid);
        if (!involvesPair) return;
        setDmMessages((m) => [...m, row]);
        setTimeout(() => dmScrollRef.current?.scrollTo({ top: dmScrollRef.current!.scrollHeight, behavior: "smooth" }), 30);
      })
      .subscribe();
    return () => { cancelled = true; sub.unsubscribe(); };
  }, [user, dmActiveUserId]);

  const sendDM = useCallback(async () => {
    if (!user || !profile || !dmActiveUserId || !dmText.trim()) return;
    const body = dmText.trim();
    setDmText("");
    await supabase.from("direct_messages").insert({
      sender_id: user.id,
      recipient_id: dmActiveUserId,
      sender_username: profile.username,
      sender_avatar_emoji: profile.avatar_emoji,
      sender_avatar_url: profile.avatar_url ?? null,
      sender_accent_color: profile.accent_color,
      content: body,
    });
  }, [user, profile, dmActiveUserId, dmText]);

  // Notifs: load @mentions of this user across global channels
  useEffect(() => {
    if (!user || !profile || tab !== "notifs") return;
    let cancelled = false;
    supabase
      .from("chat_messages")
      .select("*")
      .ilike("content", `%@${profile.username}%`)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (cancelled) return;
        setNotifs(((data || []) as unknown as Message[]));
      });
    return () => { cancelled = true; };
  }, [user, profile, tab]);

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
        avatar_url: profile.avatar_url ?? null,
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
    await send(`Join my Gartic Phone game!`, [{ kind: "link", url }]);
  }, [send]);

  const sendPoll = useCallback(async () => {
    const q = window.prompt("Poll question?");
    if (!q) return;
    const options = window.prompt("Options (comma separated, max 6)", "Yes, No, Maybe");
    if (!options) return;
    const list = options.split(",").map((o) => o.trim()).filter(Boolean).slice(0, 6);
    const body = `📊 **${q}**\n${list.map((o, i) => `${i + 1}. ${o}`).join("\n")}`;
    await send(body);
  }, [send]);

  const insert = useCallback((before: string, after = before) => {
    const el = textRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = text.slice(0, start) + before + text.slice(start, end) + after + text.slice(end);
    setText(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + before.length, end + before.length);
    });
  }, [text]);

  const toggleRecord = useCallback(async () => {
    if (recording && recRef.current) {
      recRef.current.stop();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) return alert("Microphone not available");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: BlobPart[] = [];
      const rec = new MediaRecorder(stream);
      recRef.current = rec;
      rec.ondataavailable = (e) => chunks.push(e.data);
      rec.onstop = async () => {
        setRecording(false);
        stream.getTracks().forEach((t) => t.stop());
        if (!user) return;
        const blob = new Blob(chunks, { type: "audio/webm" });
        const path = `${user.id}/voice-${Date.now()}.webm`;
        const { error } = await supabase.storage.from("chat").upload(path, blob, { contentType: "audio/webm" });
        if (error) return alert("Voice upload failed: " + error.message);
        const { data } = supabase.storage.from("chat").getPublicUrl(path);
        await send("🎙️ Voice message", [{ kind: "link", url: data.publicUrl }]);
      };
      rec.start();
      setRecording(true);
    } catch {
      alert("Could not access microphone");
    }
  }, [recording, user, send]);

  const toggleScreenShare = useCallback(async () => {
    if (screenSharing && screenRecRef.current) {
      screenRecRef.current.stop();
      return;
    }
    const md = navigator.mediaDevices as MediaDevices & { getDisplayMedia?: (c?: unknown) => Promise<MediaStream> };
    if (!md?.getDisplayMedia) return alert("Screen sharing is not supported in this browser");
    try {
      const stream = await md.getDisplayMedia({ video: { frameRate: 30 }, audio: true });
      const chunks: BlobPart[] = [];
      const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : "video/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 2_500_000 });
      screenRecRef.current = rec;
      rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      const stopAll = () => stream.getTracks().forEach((t) => t.stop());
      stream.getVideoTracks()[0]?.addEventListener("ended", () => { try { rec.stop(); } catch {} });
      rec.onstop = async () => {
        setScreenSharing(false);
        stopAll();
        if (!user) return;
        const blob = new Blob(chunks, { type: "video/webm" });
        const path = `${user.id}/screen-${Date.now()}.webm`;
        const { error } = await supabase.storage.from("chat").upload(path, blob, { contentType: "video/webm" });
        if (error) return alert("Screen share upload failed: " + error.message);
        const { data } = supabase.storage.from("chat").getPublicUrl(path);
        await send("🖥️ Screen recording", [{ kind: "link", url: data.publicUrl }]);
      };
      rec.start(1000);
      setScreenSharing(true);
    } catch {
      // user cancelled or denied
    }
  }, [screenSharing, user, send]);

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
      <div className="min-h-screen px-5 pb-12 pt-8 sm:px-8">
        <AuthDialog open={authOpen} onClose={() => setAuthOpen(false)} defaultMode={authMode} />
        <div className="mx-auto max-w-xl">
          <section
            className="liquid-glass-themed overflow-hidden rounded-3xl p-8 text-center"
            style={{ background: "linear-gradient(160deg, rgba(var(--polaris-accent)/0.25), rgba(20,12,10,0.85))" }}
          >
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white/15">
              <MessageCircle className="h-9 w-9 text-white" />
            </div>
            <h1 className="mt-5 text-3xl font-black text-white">Polaris Chat</h1>
            <p className="mt-3 text-sm leading-6 text-white/65">
              Cozy live rooms with GIFs, drawings, voice notes, polls, Gartic invites, and warm glass messages. Sign up to join the fire.
            </p>
            <div className="mt-6 grid gap-2">
              <button
                onClick={() => { setAuthMode("signup"); setAuthOpen(true); }}
                className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-black hover:bg-white/90"
              >
                Sign up for chat
              </button>
              <button
                onClick={() => { setAuthMode("signin"); setAuthOpen(true); }}
                className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-bold text-white/75 hover:bg-white/10 hover:text-white"
              >
                I already have an account
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex h-[calc(100vh-1px)] overflow-hidden"
      style={{ background: "linear-gradient(180deg, rgba(38,22,16,0.55), rgba(22,14,10,0.75))" }}
    >
      {/* Channels / DMs / Notifs sidebar */}
      <aside
        className="hidden h-full w-64 shrink-0 flex-col rounded-none border-r border-white/10 sm:flex"
        style={{
          background: "linear-gradient(180deg, rgba(var(--polaris-accent)/0.18), rgba(15,10,8,0.78))",
          backdropFilter: "blur(28px) saturate(180%)",
          WebkitBackdropFilter: "blur(28px) saturate(180%)",
        }}
      >
        {/* Brand row */}
        <div className="flex items-center gap-2 px-4 pb-3 pt-4">
          <img src={logo} alt="Polaris" className="h-7 w-7 object-contain drop-shadow" />
          <div className="text-[15px] font-black tracking-wide text-white">Polaris<span className="text-white/45">Chat</span></div>
        </div>
        {/* Top tabs */}
        <div className="flex items-center gap-1 px-3">
          <TabBtn icon={Hash} label="Global" active={tab === "global"} onClick={() => setTab("global")} />
          <TabBtn icon={Users} label="DMs" active={tab === "dms"} onClick={() => setTab("dms")} />
          <TabBtn icon={Bell} label="Notifs" active={tab === "notifs"} onClick={() => setTab("notifs")} />
        </div>

        <div className="mt-3 flex-1 space-y-4 overflow-y-auto px-2 pb-4">
          {tab === "global" && (
            <>
              <ChannelSection
                title="Important"
                channels={channels.filter((c) => categorize(c.slug) === "important")}
                activeId={activeId}
                onSelect={setActiveId}
              />
              <ChannelSection
                title="Main"
                channels={channels.filter((c) => categorize(c.slug) === "main")}
                activeId={activeId}
                onSelect={setActiveId}
              />
              <ChannelSection
                title="Links"
                channels={channels.filter((c) => categorize(c.slug) === "links")}
                activeId={activeId}
                onSelect={setActiveId}
              />
              <button
                onClick={() => setNewChannelOpen(true)}
                className="mx-2 flex w-[calc(100%-1rem)] items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-white/50 hover:bg-white/5 hover:text-white"
              >
                <Plus className="h-3.5 w-3.5" /> New channel
              </button>
            </>
          )}
          {tab === "dms" && (
            <div className="space-y-1 px-1">
              <div className="flex items-center justify-between px-3 pb-1 pt-1">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">Direct Messages</div>
                <button
                  onClick={() => setDmStartOpen(true)}
                  className="rounded-md p-1 text-white/55 hover:bg-white/10 hover:text-white"
                  title="Start a DM"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              {dmPartners.length === 0 && (
                <div className="px-4 py-6 text-center text-xs text-white/45">
                  No conversations yet.<br />Click + to start one.
                </div>
              )}
              {dmPartners.map((p) => (
                <button
                  key={p.user_id}
                  onClick={() => setDmActiveUserId(p.user_id)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition ${
                    dmActiveUserId === p.user_id ? "bg-white/12 text-white" : "text-white/75 hover:bg-white/5"
                  }`}
                >
                  <div
                    className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full text-sm"
                    style={{ background: `rgb(${p.accent_color || "120 120 130"}/0.35)` }}
                  >
                    {p.avatar_url ? <img src={p.avatar_url} alt="" className="h-full w-full object-cover" /> : <span>{p.avatar_emoji || "✨"}</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{p.username}</div>
                    <div className="truncate text-[11px] text-white/45">{p.last || "—"}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
          {tab === "notifs" && (
            <div className="space-y-1 px-2">
              <div className="px-3 pb-1 pt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">Mentions</div>
              {notifs.length === 0 && (
                <div className="px-3 py-6 text-center text-xs text-white/45">You're all caught up ✨</div>
              )}
              {notifs.map((n) => (
                <div key={n.id} className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
                  <div className="text-[11px] font-bold text-white/85">@{n.username}</div>
                  <div className="mt-0.5 line-clamp-2 text-[12px] text-white/65">{n.content}</div>
                  <div className="mt-1 text-[10px] text-white/35">{new Date(n.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      {tab !== "global" ? (
        <main className="flex h-full min-w-0 flex-1 flex-col">
          {tab === "dms" ? (
            dmActiveUserId ? (
              <DMThread
                meId={user.id}
                partner={dmPartners.find((p) => p.user_id === dmActiveUserId) || null}
                messages={dmMessages}
                value={dmText}
                onChange={setDmText}
                onSend={sendDM}
                onAvatar={(uid) => setViewProfileId(uid)}
                scrollRef={dmScrollRef}
              />
            ) : (
              <EmptyMain icon={Users} title="Direct Messages" hint="Pick a conversation on the left, or hit + to start a new DM." />
            )
          ) : (
            <EmptyMain icon={Bell} title="Notifications" hint="Mentions of you across global channels show up on the left." />
          )}
        </main>
      ) : (
      <main className="flex h-full min-w-0 flex-1 flex-col">
        {/* Header */}
        <header
          className="flex items-center gap-3 border-b border-white/10 px-4 py-3 sm:px-6"
          style={{ background: "rgba(20,12,10,0.55)", backdropFilter: "blur(20px) saturate(160%)" }}
        >
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
                onAvatarClick={() => setViewProfileId(m.user_id)}
                onMention={() => insert(`@${m.username} `, "")}
              />
            ))}
            {messages.length === 0 && (
              <div className="mt-12 text-center text-sm text-white/45">
                It’s cozy in here. Say hi 🍂
              </div>
            )}
          </div>
        </div>

        {/* Composer */}
        <div
          className="border-t border-white/10 p-3 sm:px-6"
          style={{ background: "rgba(15,10,8,0.55)", backdropFilter: "blur(18px) saturate(160%)" }}
        >
          <div className="mx-auto max-w-3xl space-y-2">
          {/* Formatting toolbar */}
          <div className="flex flex-wrap items-center gap-1 px-1 text-white/55">
            <ToolbarBtn label="Bold (markdown)" onClick={() => insert("**")}><Bold className="h-3.5 w-3.5" /></ToolbarBtn>
            <ToolbarBtn label="Italic" onClick={() => insert("*")}><Italic className="h-3.5 w-3.5" /></ToolbarBtn>
            <ToolbarBtn label="Inline code" onClick={() => insert("`")}><Code className="h-3.5 w-3.5" /></ToolbarBtn>
            <ToolbarBtn label="Mention" onClick={() => insert("@", "")}><AtSign className="h-3.5 w-3.5" /></ToolbarBtn>
            <ToolbarBtn label="Poll" onClick={sendPoll}><BarChart3 className="h-3.5 w-3.5" /></ToolbarBtn>
            <ToolbarBtn label="Reaction shortcut" onClick={() => insert("❤️", "")}><Heart className="h-3.5 w-3.5" /></ToolbarBtn>
            <span className="ml-auto text-[10px] uppercase tracking-[0.18em] text-white/30">{text.length}/1000</span>
          </div>
          <div
            className="flex items-end gap-2 rounded-2xl border border-white/15 p-2"
            style={{
              background: "linear-gradient(160deg, rgba(var(--polaris-accent)/0.16), rgba(15,10,8,0.7))",
              backdropFilter: "blur(20px) saturate(170%)",
              WebkitBackdropFilter: "blur(20px) saturate(170%)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
            }}
          >
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
            <button onClick={toggleRecord} className={`rounded-lg p-2 transition ${recording ? "bg-red-500/30 text-red-200 animate-pulse" : "text-white/65 hover:bg-white/5 hover:text-white"}`} title={recording ? "Stop recording" : "Voice note"}>
              <Mic className="h-4 w-4" />
            </button>
            <button onClick={toggleScreenShare} className={`rounded-lg p-2 transition ${screenSharing ? "bg-red-500/30 text-red-200 animate-pulse" : "text-white/65 hover:bg-white/5 hover:text-white"}`} title={screenSharing ? "Stop screen share" : "Share screen"}>
              <MonitorUp className="h-4 w-4" />
            </button>
            <div className="relative flex-1">
              <textarea
                ref={textRef}
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, 1000))}
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
        </div>
      </main>
      )}

      {gifOpen && <GifPicker onPick={(g) => { setGifOpen(false); send(null, [{ kind: "gif", url: g.full }]); }} onClose={() => setGifOpen(false)} />}
      {drawOpen && <DrawingCanvas onSend={sendDrawing} onClose={() => setDrawOpen(false)} />}
      {newChannelOpen && (
        <NewChannelDialog onCreate={createChannel} onClose={() => setNewChannelOpen(false)} />
      )}
      {dmStartOpen && (
        <StartDmDialog
          meId={user.id}
          onPick={(uid) => { setDmActiveUserId(uid); setDmStartOpen(false); }}
          onClose={() => setDmStartOpen(false)}
        />
      )}
      <ProfileSheet open={!!viewProfileId} onClose={() => setViewProfileId(null)} viewUserId={viewProfileId} />
    </div>
  );
}

function ToolbarBtn({ children, label, onClick }: { children: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} title={label} className="rounded-md p-1.5 hover:bg-white/10 hover:text-white">
      {children}
    </button>
  );
}

function MessageBubble({ m, prevSame, onAvatarClick, onMention }: { m: Message; prevSame: boolean; onAvatarClick: () => void; onMention: () => void }) {
  const time = new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return (
    <div className={`group flex gap-3 rounded-xl px-2 py-1 transition hover:bg-white/[0.03] ${prevSame ? "pt-0.5" : "pt-3"}`}>
      <div className="w-9 shrink-0">
        {!prevSame && (
          <button
            onClick={onAvatarClick}
            className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-full text-base transition hover:scale-110"
            style={{ background: `rgb(${m.accent_color || "120 120 130"}/0.35)`, boxShadow: `inset 0 0 0 1px rgb(${m.accent_color || "120 120 130"}/0.55)` }}
            title={`View ${m.username}'s profile`}
          >
            {m.avatar_url ? (
              <img src={m.avatar_url} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
            ) : (
              <span>{m.avatar_emoji || "✨"}</span>
            )}
          </button>
        )}
      </div>
      <div className="min-w-0 flex-1">
        {!prevSame && (
          <div className="flex items-baseline gap-2">
            <button
              onClick={onAvatarClick}
              className="text-sm font-bold hover:underline"
              style={{ color: `rgb(${m.accent_color || "240 240 240"})` }}
            >
              {m.username}
            </button>
            <span className="text-[10px] text-white/35">{time}</span>
            <button
              onClick={onMention}
              className="ml-1 hidden text-[10px] text-white/30 group-hover:inline hover:text-white"
              title="Mention"
            >
              @
            </button>
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

function TabBtn({ icon: Icon, label, active, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-1.5 text-[12px] font-semibold transition ${
        active ? "bg-white/12 text-white shadow-[inset_0_0_0_1px_rgba(var(--polaris-accent)/0.45)]" : "text-white/55 hover:bg-white/5 hover:text-white"
      }`}
      style={active ? { color: "rgb(var(--polaris-accent))" } : undefined}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function ChannelSection({
  title, channels, activeId, onSelect,
}: { title: string; channels: Channel[]; activeId: string | null; onSelect: (id: string) => void }) {
  if (!channels.length) return null;
  return (
    <div>
      <div className="px-4 pb-1.5 text-center text-[10px] font-bold uppercase tracking-[0.28em] text-white/40">— {title} —</div>
      <div className="space-y-0.5 px-2">
        {channels.map((c) => {
          const Icon = iconForChannel(c.slug);
          const active = c.id === activeId;
          return (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition ${
                active ? "text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
              style={active ? {
                background: "rgba(var(--polaris-accent)/0.18)",
                boxShadow: "inset 0 0 0 1px rgba(var(--polaris-accent)/0.45)",
              } : undefined}
            >
              <Icon className="h-3.5 w-3.5 text-white/55" />
              <span className="truncate">{c.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EmptyMain({ icon: Icon, title, hint }: { icon: React.ComponentType<{ className?: string }>; title: string; hint: string }) {
  return (
    <div className="flex flex-1 items-center justify-center px-6 text-center">
      <div className="max-w-sm">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.04]">
          <Icon className="h-6 w-6 text-white/70" />
        </div>
        <div className="mt-4 text-lg font-black text-white">{title}</div>
        <div className="mt-1 text-sm text-white/55">{hint}</div>
      </div>
    </div>
  );
}

function DMThread({
  meId, partner, messages, value, onChange, onSend, onAvatar, scrollRef,
}: {
  meId: string;
  partner: DMPartner | null;
  messages: DM[];
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onAvatar: (uid: string) => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <>
      <header
        className="flex items-center gap-3 border-b border-white/10 px-4 py-3 sm:px-6"
        style={{ background: "rgba(20,12,10,0.55)", backdropFilter: "blur(20px) saturate(160%)" }}
      >
        <AtSign className="h-4 w-4 text-white/40" />
        <div className="text-sm font-bold text-white">{partner?.username || "Direct Message"}</div>
      </header>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-2">
          {messages.length === 0 && (
            <div className="mt-12 text-center text-sm text-white/45">Say hi — this is a fresh thread 🍂</div>
          )}
          {messages.map((m) => {
            const mine = m.sender_id === meId;
            return (
              <div key={m.id} className={`flex gap-2.5 ${mine ? "flex-row-reverse" : ""}`}>
                <button
                  onClick={() => onAvatar(m.sender_id)}
                  className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full text-sm"
                  style={{ background: `rgb(${m.sender_accent_color || "120 120 130"}/0.35)` }}
                >
                  {m.sender_avatar_url ? <img src={m.sender_avatar_url} alt="" className="h-full w-full object-cover" /> : <span>{m.sender_avatar_emoji || "✨"}</span>}
                </button>
                <div
                  className="max-w-[78%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm text-white/95"
                  style={{
                    background: mine
                      ? "linear-gradient(140deg, rgba(var(--polaris-accent)/0.28), rgba(var(--polaris-accent)/0.08))"
                      : "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {m.content}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="border-t border-white/10 p-3 sm:px-6" style={{ background: "rgba(15,10,8,0.55)" }}>
        <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-white/15 p-2"
          style={{ background: "rgba(15,10,8,0.7)" }}>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value.slice(0, 1000))}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }}
            rows={1}
            placeholder={partner ? `Message ${partner.username}` : "Message"}
            className="max-h-32 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-white placeholder:text-white/35 focus:outline-none"
          />
          <button
            onClick={onSend}
            disabled={!value.trim()}
            className="rounded-lg bg-[rgb(var(--polaris-accent))] p-2 text-black transition disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}

function StartDmDialog({ meId, onPick, onClose }: { meId: string; onPick: (uid: string) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ id: string; username: string; avatar_emoji: string | null; avatar_url: string | null; accent_color: string | null }[]>([]);
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      const query = supabase
        .from("profiles")
        .select("id, username, avatar_emoji, avatar_url, accent_color")
        .neq("id", meId)
        .limit(30);
      const { data } = q.trim()
        ? await query.ilike("username", `%${q.trim()}%`)
        : await query;
      if (cancelled) return;
      setResults((data || []) as never);
    }, 200);
    return () => { cancelled = true; clearTimeout(t); };
  }, [q, meId]);
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-6 backdrop-blur-md" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-zinc-950">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <Search className="h-4 w-4 text-white/45" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by username…" className="flex-1 bg-transparent text-sm text-white placeholder:text-white/35 focus:outline-none" />
          <button onClick={onClose} className="rounded p-1 hover:bg-white/10"><X className="h-4 w-4 text-white/70" /></button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {results.length === 0 && <div className="px-3 py-8 text-center text-sm text-white/45">No users found</div>}
          {results.map((u) => (
            <button
              key={u.id}
              onClick={() => onPick(u.id)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-white/5"
            >
              <div className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full text-sm" style={{ background: `rgb(${u.accent_color || "120 120 130"}/0.35)` }}>
                {u.avatar_url ? <img src={u.avatar_url} alt="" className="h-full w-full object-cover" /> : <span>{u.avatar_emoji || "✨"}</span>}
              </div>
              <div className="text-sm font-semibold text-white">{u.username}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}