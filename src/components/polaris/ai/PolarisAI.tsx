import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ReactNode } from "react";
import {
  Bot,
  Check,
  ChevronDown,
  Copy,
  Code2,
  Coins,
  GraduationCap,
  Image as ImageIcon,
  Lightbulb,
  PencilLine,
  MessageSquare,
  Plus,
  Search,
  Send,
  Settings2,
  Sparkles,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import logo from "@/assets/polaris-logo.png";
import { useAuth } from "@/lib/auth-context";
import { useServerFn } from "@tanstack/react-start";
import { getAiWallet, exchangeCoinsForCredits, consumeAiCredit } from "@/lib/shop.functions";

type Role = "user" | "assistant";
type ChatMessage = { id: string; role: Role; content: string };
type Chat = { id: string; title: string; messages: ChatMessage[]; updatedAt: number };

type ModelTier = "free" | "premium";
type Model = {
  id: string; // gateway model id
  label: string;
  blurb: string;
  tier: ModelTier;
  badge: string; // single letter / symbol for the icon
  color: string; // tailwind bg
};

const MODELS: Model[] = [
  // FREE
  { id: "google/gemini-3-flash-preview", label: "Gemini 3 Flash", blurb: "Fast · default", tier: "free", badge: "G", color: "bg-emerald-500" },
  { id: "google/gemini-3.1-flash-lite-preview", label: "Gemini 3.1 Flash Lite", blurb: "Cheap · quick", tier: "free", badge: "G", color: "bg-emerald-600" },
  { id: "openai/gpt-5-nano", label: "GPT-5 Nano", blurb: "Fast · light", tier: "free", badge: "5", color: "bg-zinc-700" },
  { id: "openai/gpt-5-mini", label: "GPT-5 Mini", blurb: "Smart · balanced", tier: "free", badge: "5", color: "bg-zinc-800" },
  { id: "openai/gpt-5.4-nano", label: "GPT-5.4 Nano", blurb: "Reasoning · fast", tier: "free", badge: "5", color: "bg-zinc-700" },
  { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", blurb: "Efficient", tier: "free", badge: "G", color: "bg-sky-500" },
  { id: "google/gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite", blurb: "Cheap · fast", tier: "free", badge: "G", color: "bg-sky-400" },
  // PREMIUM
  { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", blurb: "Most capable", tier: "premium", badge: "G", color: "bg-indigo-500" },
  { id: "google/gemini-3.1-pro-preview", label: "Gemini 3.1 Pro", blurb: "Next-gen reasoning", tier: "premium", badge: "G", color: "bg-indigo-600" },
  { id: "google/gemini-3.5-flash", label: "Gemini 3.5 Flash", blurb: "Agentic · fast", tier: "premium", badge: "G", color: "bg-sky-600" },
  { id: "openai/gpt-5", label: "GPT-5", blurb: "Frontier", tier: "premium", badge: "5", color: "bg-black" },
  { id: "openai/gpt-5.2", label: "GPT-5.2", blurb: "Enhanced reasoning", tier: "premium", badge: "5", color: "bg-zinc-900" },
  { id: "openai/gpt-5.4", label: "GPT-5.4 (GN Maths)", blurb: "Advanced reasoning", tier: "premium", badge: "5", color: "bg-zinc-900" },
  { id: "openai/gpt-5.4-mini", label: "GPT-5.4 Mini", blurb: "Balanced · cheap", tier: "premium", badge: "5", color: "bg-zinc-800" },
  { id: "openai/gpt-5.4-pro", label: "GPT-5.4 Pro", blurb: "Premium reasoning", tier: "premium", badge: "5", color: "bg-zinc-950" },
  { id: "openai/gpt-5.5", label: "GPT-5.5", blurb: "State of the art", tier: "premium", badge: "5", color: "bg-zinc-950" },
  { id: "openai/gpt-5.5-pro", label: "GPT-5.5 Pro", blurb: "Hardest problems", tier: "premium", badge: "5", color: "bg-black" },
];

type Mode = { id: string; label: string; system: string };
const MODES: Mode[] = [
  { id: "default", label: "Default", system: "You are Polaris AI, a helpful, warm and concise assistant." },
  { id: "creative", label: "Creative", system: "You are Polaris AI in creative mode. Be imaginative, vivid, and playful. Use rich language." },
  { id: "precise", label: "Precise", system: "You are Polaris AI in precise mode. Give short, factual answers with no fluff." },
  { id: "code", label: "Code", system: "You are Polaris AI in code mode. Always answer with working code first, then a brief explanation." },
  { id: "tutor", label: "Tutor", system: "You are Polaris AI as a patient tutor. Explain step-by-step and check understanding." },
];

const STARTERS: { icon: React.ComponentType<{ className?: string }>; title: string; prompt: string; tint: string }[] = [
  { icon: Code2, title: "Write code", prompt: "Write me code that…", tint: "from-emerald-400/30 to-emerald-600/10" },
  { icon: Lightbulb, title: "Brainstorm", prompt: "Help me brainstorm ideas for…", tint: "from-amber-400/30 to-orange-600/10" },
  { icon: PencilLine, title: "Summarize", prompt: "Summarize this for me:", tint: "from-sky-400/30 to-indigo-600/10" },
  { icon: GraduationCap, title: "Teach me", prompt: "Explain like I'm 12:", tint: "from-fuchsia-400/30 to-purple-600/10" },
];

const STORAGE_KEY = "polaris-ai-chats-v1";
const LIMIT_KEY = "polaris-ai-limits-v1";
// Guests get a tight cap to protect credits; signed-in users get the full allowance.
const DAILY_LIMITS_GUEST: Record<ModelTier, number> = { free: 15, premium: 0 };
const DAILY_LIMITS_USER: Record<ModelTier, number> = { free: 150, premium: 50 };
const COOLDOWN_MS = 1200;

type LimitState = { day: string; free: number; premium: number; lastAt: number };

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function loadLimits(): LimitState {
  if (typeof window === "undefined") return { day: todayKey(), free: 0, premium: 0, lastAt: 0 };
  try {
    const raw = localStorage.getItem(LIMIT_KEY);
    const parsed = raw ? (JSON.parse(raw) as LimitState) : null;
    if (!parsed || parsed.day !== todayKey()) return { day: todayKey(), free: 0, premium: 0, lastAt: 0 };
    return parsed;
  } catch {
    return { day: todayKey(), free: 0, premium: 0, lastAt: 0 };
  }
}

function saveLimits(s: LimitState) {
  try { localStorage.setItem(LIMIT_KEY, JSON.stringify(s)); } catch { /* noop */ }
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function loadChats(): Chat[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Chat[]) : [];
  } catch {
    return [];
  }
}

function saveChats(chats: Chat[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  } catch {
    /* noop */
  }
}

export function PolarisAI() {
  const { profile } = useAuth();
  const isSignedIn = !!profile;
  const DAILY_LIMITS = isSignedIn ? DAILY_LIMITS_USER : DAILY_LIMITS_GUEST;
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [model, setModel] = useState<Model>(MODELS[0]);
  const [mode, setMode] = useState<Mode>(MODES[0]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [imageMode, setImageMode] = useState(false);
  const [wallet, setWallet] = useState<{ coins: number; basic_credits: number; premium_credits: number } | null>(null);
  const [exchanging, setExchanging] = useState<"basic" | "premium" | null>(null);
  const [search, setSearch] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchWallet = useServerFn(getAiWallet);
  const doExchange = useServerFn(exchangeCoinsForCredits);
  const doConsume = useServerFn(consumeAiCredit);

  useEffect(() => {
    if (!isSignedIn) { setWallet(null); return; }
    fetchWallet().then(setWallet).catch(() => {/* noop */});
  }, [isSignedIn, fetchWallet]);

  async function exchange(tier: "basic" | "premium") {
    if (!isSignedIn) return;
    setExchanging(tier);
    try {
      const next = await doExchange({ data: { tier, amount: 1 } });
      setWallet({ coins: next.coins, basic_credits: next.basic_credits, premium_credits: next.premium_credits });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Exchange failed");
    } finally {
      setExchanging(null);
    }
  }

  // hydrate
  useEffect(() => {
    const loaded = loadChats();
    setChats(loaded);
    if (loaded.length) setActiveId(loaded[0].id);
  }, []);

  // Hydrate ?mode=X&q=... so the homepage AI launcher can route into a
  // specific mode (Coding / Learning / Planning…) with an initial prompt.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const modeId = params.get("mode");
    if (modeId) {
      const m = MODES.find((x) => x.id === modeId);
      if (m) setMode(m);
    }
    const q = params.get("q");
    if (q) {
      // small delay so the chat list is hydrated first
      const t = setTimeout(() => send(q), 50);
      // strip the params so refresh doesn't re-send
      window.history.replaceState({}, "", window.location.pathname);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (chats.length) saveChats(chats);
  }, [chats]);

  const active = useMemo(() => chats.find((c) => c.id === activeId) || null, [chats, activeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [active?.messages.length, streaming]);

  function newChat() {
    const c: Chat = { id: uid(), title: "New Chat", messages: [], updatedAt: Date.now() };
    setChats((prev) => [c, ...prev]);
    setActiveId(c.id);
    setError(null);
    setSidebarOpen(false);
  }

  function deleteChat(id: string) {
    setChats((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (activeId === id) setActiveId(next[0]?.id ?? null);
      if (!next.length) saveChats([]);
      return next;
    });
  }

  async function send(text: string) {
    if (!text.trim() || streaming) return;
    setError(null);
    // Image generation path
    if (imageMode) {
      let chat = active;
      if (!chat) {
        chat = { id: uid(), title: text.slice(0, 40), messages: [], updatedAt: Date.now() };
        setChats((p) => [chat!, ...p]);
        setActiveId(chat.id);
      }
      const userMsg: ChatMessage = { id: uid(), role: "user", content: text };
      const assistantMsg: ChatMessage = { id: uid(), role: "assistant", content: "Generating image…" };
      const chatId = chat.id;
      setChats((prev) =>
        prev.map((c) =>
          c.id === chatId
            ? {
                ...c,
                title: c.messages.length ? c.title : text.slice(0, 40),
                messages: [...c.messages, userMsg, assistantMsg],
                updatedAt: Date.now(),
              }
            : c,
        ),
      );
      setInput("");
      setStreaming(true);
      try {
        const res = await fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: text }),
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || `HTTP ${res.status}`);
        const dataUrl: string = j.dataUrl;
        setChats((prev) =>
          prev.map((c) =>
            c.id === chatId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantMsg.id ? { ...m, content: `![image](${dataUrl})` } : m,
                  ),
                }
              : c,
          ),
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Image generation failed";
        setError(msg);
        setChats((prev) =>
          prev.map((c) =>
            c.id === chatId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantMsg.id ? { ...m, content: `⚠️ ${msg}` } : m,
                  ),
                }
              : c,
          ),
        );
      } finally {
        setStreaming(false);
      }
      return;
    }
    // Rate limit guard — protect credits
    const limits = loadLimits();
    const now = Date.now();
    if (now - limits.lastAt < COOLDOWN_MS) {
      const wait = Math.ceil((COOLDOWN_MS - (now - limits.lastAt)) / 1000);
      setError(`Slow down — wait ${wait}s before sending another message.`);
      return;
    }
    const used = model.tier === "premium" ? limits.premium : limits.free;
    const cap = DAILY_LIMITS[model.tier];
    if (cap === 0) {
      setError("Premium models are for signed-in users — sign in to unlock.");
      return;
    }
    if (used >= cap) {
      // Daily quota exhausted — try spending a banked AI credit.
      const tier = model.tier === "premium" ? "premium" : "basic";
      const have = tier === "premium" ? (wallet?.premium_credits ?? 0) : (wallet?.basic_credits ?? 0);
      if (!isSignedIn || have < 1) {
        setError(
          isSignedIn
            ? `Daily ${model.tier} limit reached. Trade coins for ${tier} credits to keep chatting.`
            : `Guest limit reached (${cap}/day). Sign in to bank credits and unlock premium.`,
        );
        return;
      }
      try {
        const next = await doConsume({ data: { tier } });
        setWallet({ coins: next.coins, basic_credits: next.basic_credits, premium_credits: next.premium_credits });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Credit spend failed");
        return;
      }
    }
    saveLimits({
      day: todayKey(),
      free: model.tier === "free" ? limits.free + 1 : limits.free,
      premium: model.tier === "premium" ? limits.premium + 1 : limits.premium,
      lastAt: now,
    });
    let chat = active;
    if (!chat) {
      chat = { id: uid(), title: text.slice(0, 40), messages: [], updatedAt: Date.now() };
      setChats((p) => [chat!, ...p]);
      setActiveId(chat.id);
    }
    const userMsg: ChatMessage = { id: uid(), role: "user", content: text };
    const assistantMsg: ChatMessage = { id: uid(), role: "assistant", content: "" };
    const chatId = chat.id;
    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId
          ? {
              ...c,
              title: c.messages.length ? c.title : text.slice(0, 40),
              messages: [...c.messages, userMsg, assistantMsg],
              updatedAt: Date.now(),
            }
          : c,
      ),
    );
    setInput("");
    setStreaming(true);

    // Cap history to last 12 messages to keep token usage (and credits) sane
    const history = [...(chat.messages || []), userMsg]
      .slice(-12)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: model.id, system: mode.system, messages: history }),
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";
      let done = false;
      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line || line.startsWith(":")) continue;
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") {
            done = true;
            break;
          }
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) {
              acc += delta;
              const snapshot = acc;
              setChats((prev) =>
                prev.map((c) =>
                  c.id === chatId
                    ? {
                        ...c,
                        messages: c.messages.map((m) => (m.id === assistantMsg.id ? { ...m, content: snapshot } : m)),
                      }
                    : c,
                ),
              );
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setError(msg);
      setChats((prev) =>
        prev.map((c) =>
          c.id === chatId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantMsg.id ? { ...m, content: `⚠️ ${msg}` } : m,
                ),
              }
            : c,
        ),
      );
    } finally {
      setStreaming(false);
    }
  }

  const filteredChats = chats.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative flex h-screen min-h-0 overflow-hidden text-white">
      {/* Wallpaper stays visible behind the sidebar/edges; chat panel itself is solid black */}
      {/* Sidebar (Nox-style) */}
      <aside
        className={`liquid-glass-strong absolute left-0 top-0 z-30 h-full w-[300px] shrink-0 flex-col border-r border-white/10 transition-transform duration-300 md:relative md:flex md:translate-x-0 ${
          sidebarOpen ? "flex translate-x-0" : "hidden -translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Polaris AI" className="h-6 w-6 object-contain" />
            <div className="text-[15px] font-semibold">Polaris AI</div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white md:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-3">
          <button
            onClick={newChat}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm font-semibold hover:bg-black/55"
          >
            <Plus className="h-4 w-4" /> New chat
          </button>
        </div>

        <div className="mt-3 px-3">
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-3 py-2">
            <Search className="h-4 w-4 text-white/45" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chats"
              className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/35 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-3 flex-1 space-y-0.5 overflow-y-auto px-2 pb-4">
          {filteredChats.length === 0 && (
            <div className="px-3 py-6 text-center text-xs text-white/40">No chats yet</div>
          )}
          {filteredChats.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setActiveId(c.id);
                setSidebarOpen(false);
              }}
              className={`group flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
                c.id === activeId ? "bg-white/10 text-white" : "text-white/75 hover:bg-white/5"
              }`}
            >
              <span className="flex min-w-0 items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5 shrink-0 text-white/45" />
                <span className="truncate">{c.title || "New Chat"}</span>
              </span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  deleteChat(c.id);
                }}
                className="rounded p-1 text-white/30 opacity-0 hover:text-white/80 group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </span>
            </button>
          ))}
        </div>
      </aside>

      {/* Main — fully transparent so the wallpaper shows through */}
      <div className="relative m-2 flex min-h-0 flex-1 flex-col overflow-hidden md:m-3">
        {/* Top bar */}
        <header className="flex items-center justify-between gap-2 px-3 py-2 sm:px-5">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-full p-1.5 text-white/70 hover:bg-white/10 hover:text-white md:hidden"
            aria-label="Open chats"
          >
            <MessageSquare className="h-5 w-5" />
          </button>

          <div className="relative">
            <button
              onClick={() => {
                setModelOpen((o) => !o);
                setModeOpen(false);
              }}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3.5 py-1.5 text-sm font-semibold hover:bg-black/55"
            >
              <span className={`grid h-5 w-5 place-items-center rounded-md text-[10px] font-black text-white ${model.color}`}>
                {model.badge}
              </span>
              {model.label}
              <ChevronDown className="h-3.5 w-3.5 opacity-70" />
            </button>
            {modelOpen && (
              <div className="liquid-glass-strong absolute left-1/2 top-[calc(100%+8px)] z-40 w-[320px] -translate-x-1/2 overflow-hidden rounded-2xl border border-white/10 p-2">
                <ModelGroup title="Free" models={MODELS.filter((m) => m.tier === "free")} current={model} pick={(m) => { setModel(m); setModelOpen(false); }} />
                <div className="my-1 h-px bg-white/10" />
                <ModelGroup title="Polaris · Premium" models={MODELS.filter((m) => m.tier === "premium")} current={model} pick={(m) => { setModel(m); setModelOpen(false); }} />
              </div>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => {
                  setModeOpen((o) => !o);
                  setModelOpen(false);
                }}
                className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-black/45"
              >
                <Settings2 className="h-3.5 w-3.5" /> {mode.label}
                <ChevronDown className="h-3 w-3 opacity-70" />
              </button>
              {modeOpen && (
                <div className="liquid-glass-strong absolute right-0 top-[calc(100%+8px)] z-40 w-[200px] overflow-hidden rounded-2xl border border-white/10 p-1.5">
                  {MODES.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => { setMode(m); setModeOpen(false); }}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm ${
                        m.id === mode.id ? "bg-white/10 text-white" : "text-white/75 hover:bg-white/5"
                      }`}
                    >
                      {m.label}
                      {m.id === mode.id && <Check className="h-3.5 w-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={newChat}
              className="rounded-full p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
              title="New chat"
            >
              <Plus className="h-5 w-5" />
            </button>

            {isSignedIn && (
              <div className="relative">
                <button
                  onClick={() => { setWalletOpen((o) => !o); setModelOpen(false); setModeOpen(false); }}
                  className="flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-500/10 px-2.5 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-500/20"
                  title="Coins & AI credits"
                >
                  <Coins className="h-3.5 w-3.5" />
                  {wallet?.coins ?? 0}
                  <span className="hidden text-amber-200/70 sm:inline">·</span>
                  <span className="hidden text-amber-200/90 sm:inline">{(wallet?.basic_credits ?? 0)}b / {(wallet?.premium_credits ?? 0)}p</span>
                </button>
                {walletOpen && (
                  <div className="liquid-glass-strong absolute right-0 top-[calc(100%+8px)] z-40 w-[280px] overflow-hidden rounded-2xl border border-white/10 p-3">
                    <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200/80">Polaris Wallet</div>
                    <div className="mb-3 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-xl bg-amber-500/15 p-2">
                        <div className="text-base font-black text-amber-100">{wallet?.coins ?? 0}</div>
                        <div className="text-[9px] uppercase tracking-wider text-amber-200/70">Coins</div>
                      </div>
                      <div className="rounded-xl bg-emerald-500/15 p-2">
                        <div className="text-base font-black text-emerald-100">{wallet?.basic_credits ?? 0}</div>
                        <div className="text-[9px] uppercase tracking-wider text-emerald-200/70">Basic</div>
                      </div>
                      <div className="rounded-xl bg-indigo-500/15 p-2">
                        <div className="text-base font-black text-indigo-100">{wallet?.premium_credits ?? 0}</div>
                        <div className="text-[9px] uppercase tracking-wider text-indigo-200/70">Premium</div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <button
                        onClick={() => exchange("basic")}
                        disabled={exchanging !== null || (wallet?.coins ?? 0) < 25}
                        className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-xs hover:bg-white/10 disabled:opacity-50"
                      >
                        <span className="flex items-center gap-2 text-white">
                          <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
                          Trade <b>25 coins</b> → <b>1 basic credit</b>
                        </span>
                        <span className="text-emerald-200/80">+1</span>
                      </button>
                      <button
                        onClick={() => exchange("premium")}
                        disabled={exchanging !== null || (wallet?.coins ?? 0) < 50}
                        className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-xs hover:bg-white/10 disabled:opacity-50"
                      >
                        <span className="flex items-center gap-2 text-white">
                          <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
                          Trade <b>50 coins</b> → <b>1 premium credit</b>
                        </span>
                        <span className="text-indigo-200/80">+1</span>
                      </button>
                    </div>
                    <div className="mt-3 text-[10px] leading-relaxed text-white/45">
                      Credits unlock extra AI messages past your daily quota. They can't buy items — coins do that in the Shop.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-6 sm:px-8">
          {!active || active.messages.length === 0 ? (
            <div className="relative mx-auto flex h-full max-w-2xl flex-col items-center justify-center text-center">
              {/* Ambient aura behind the hero */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 -z-10 opacity-70 blur-3xl"
                style={{
                  background:
                    "radial-gradient(420px circle at 50% 30%, rgba(var(--polaris-accent)/0.28), transparent 60%), radial-gradient(360px circle at 30% 80%, rgba(255,255,255,0.06), transparent 70%)",
                }}
              />
              <div
                className="relative grid h-16 w-16 place-items-center rounded-[22px]"
                style={{
                  background:
                    "linear-gradient(140deg, rgba(var(--polaris-accent)/0.45), rgba(255,255,255,0.06))",
                  boxShadow:
                    "inset 0 0 0 1px rgba(255,255,255,0.12), 0 18px 50px -20px rgba(var(--polaris-accent)/0.55)",
                }}
              >
                <img src={logo} alt="" className="h-9 w-9 object-contain drop-shadow" />
              </div>
              <h1
                className="mt-5 text-4xl font-black tracking-tight md:text-5xl"
                style={{
                  background:
                    "linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.55) 110%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                How can I help today?
              </h1>
              <div className="mt-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-white/45">
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ background: "rgb(var(--polaris-accent))", boxShadow: "0 0 10px rgb(var(--polaris-accent))" }}
                />
                {model.label} · {mode.label}
              </div>

              {/* Inline mode chips */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-1.5">
                {MODES.map((m) => {
                  const on = m.id === mode.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setMode(m)}
                      className="rounded-full border px-3 py-1 text-[11px] font-medium transition"
                      style={
                        on
                          ? {
                              borderColor: "rgba(var(--polaris-accent)/0.55)",
                              background: "rgba(var(--polaris-accent)/0.18)",
                              color: "#fff",
                            }
                          : { borderColor: "rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.7)" }
                      }
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>

              {/* Iconic starter cards */}
              <div className="mt-7 grid w-full max-w-xl grid-cols-2 gap-2.5">
                {STARTERS.map((s) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.title}
                      onClick={() => send(s.prompt)}
                      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 text-left transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.06]"
                    >
                      <div
                        className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${s.tint} opacity-60 blur-2xl transition group-hover:opacity-100`}
                      />
                      <div className="relative flex items-center gap-2.5">
                        <span className="grid h-8 w-8 place-items-center rounded-xl border border-white/10 bg-white/[0.05] text-white/85">
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="text-[13px] font-semibold text-white">{s.title}</div>
                      </div>
                      <div className="relative mt-2 text-[12px] leading-snug text-white/55">{s.prompt}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-4">
              {active.messages.map((m) => (
                <MessageBubble key={m.id} role={m.role} content={m.content} modelLabel={model.label} />
              ))}
              {streaming && (
                <div className="flex items-center gap-2 px-2 text-xs text-white/45">
                  <Zap className="h-3 w-3 animate-pulse" /> {model.label} is thinking…
                </div>
              )}
            </div>
          )}
        </div>

        {/* Composer — floating, transparent wrap so wallpaper shows */}
        <div className="relative px-3 pb-3 pt-1 sm:px-6">
          {error && (
            <div className="mx-auto mb-2 max-w-xl rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200 backdrop-blur-xl">
              {error}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="mx-auto flex max-w-xl flex-col gap-1 rounded-2xl border border-white/15 bg-black/35 p-1 backdrop-blur-2xl transition-all focus-within:border-[rgba(var(--polaris-accent)/0.7)] focus-within:shadow-[0_8px_28px_-12px_rgba(0,0,0,0.6),0_0_0_2px_rgba(var(--polaris-accent)/0.18)]"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              rows={1}
              placeholder={imageMode ? "Describe the image you want…" : `Message ${model.label}…`}
              className="min-h-[28px] max-h-[140px] w-full resize-none bg-transparent px-2.5 py-1 text-[13px] text-white placeholder:text-white/40 focus:outline-none"
            />
            <div className="flex items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-1.5 text-[10px] text-white/45">
                <button
                  type="button"
                  onClick={() => { setModelOpen((o) => !o); setModeOpen(false); }}
                  className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-white/70 hover:bg-white/[0.08]"
                >
                  <span className={`grid h-3 w-3 place-items-center rounded-sm text-[8px] font-black text-white ${model.color}`}>
                    {model.badge}
                  </span>
                  {model.label}
                </button>
                <button
                  type="button"
                  onClick={() => { setModeOpen((o) => !o); setModelOpen(false); }}
                  className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-white/70 hover:bg-white/[0.08]"
                >
                  <Settings2 className="h-2.5 w-2.5" /> {mode.label}
                </button>
                <button
                  type="button"
                  onClick={() => setImageMode((v) => !v)}
                  className="flex items-center gap-1 rounded-full border px-2 py-0.5 transition"
                  style={
                    imageMode
                      ? {
                          borderColor: "rgba(var(--polaris-accent)/0.6)",
                          background: "rgba(var(--polaris-accent)/0.2)",
                          color: "#fff",
                        }
                      : { borderColor: "rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.7)" }
                  }
                  title={imageMode ? "Image mode on" : "Generate an image instead"}
                >
                  <ImageIcon className="h-2.5 w-2.5" /> Image
                </button>
                <span className="hidden sm:inline text-white/30">·  Enter ↵ to send</span>
              </div>
              <button
                type="submit"
                disabled={streaming || !input.trim()}
                className="group/btn relative grid h-7 w-7 place-items-center rounded-xl text-white transition disabled:opacity-40"
                style={{
                  background:
                    "linear-gradient(135deg, rgb(var(--polaris-accent)) 0%, rgba(var(--polaris-accent)/0.7) 100%)",
                  boxShadow:
                    "0 8px 24px -8px rgba(var(--polaris-accent)/0.75), inset 0 0 0 1px rgba(255,255,255,0.18)",
                }}
                aria-label="Send"
              >
                <Send className="h-3.5 w-3.5 transition group-hover/btn:translate-x-0.5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function ModelGroup({
  title,
  models,
  current,
  pick,
}: {
  title: string;
  models: Model[];
  current: Model;
  pick: (m: Model) => void;
}) {
  return (
    <div className="py-1">
      <div className="px-3 pb-1 pt-1 text-[10px] font-bold uppercase tracking-widest text-white/40">{title}</div>
      {models.map((m) => {
        const active = m.id === current.id && m.label === current.label;
        return (
          <button
            key={`${m.id}-${m.label}`}
            onClick={() => pick(m)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition ${
              active ? "bg-white/10" : "hover:bg-white/5"
            }`}
          >
            <span className={`grid h-8 w-8 place-items-center rounded-lg text-xs font-black text-white ${m.color}`}>
              {m.badge}
            </span>
            <span className="flex-1">
              <span className="block text-sm font-semibold text-white">{m.label}</span>
              <span className="block text-[11px] text-white/50">{m.blurb}</span>
            </span>
            {active && <Check className="h-4 w-4 text-white/80" />}
          </button>
        );
      })}
    </div>
  );
}

function MessageBubble({ role, content, modelLabel }: { role: Role; content: string; modelLabel: string }) {
  const isUser = role === "user";
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {/* noop */}
  }
  return (
    <div className={`group flex gap-3 animate-[fadeIn_220ms_ease] ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold text-white"
        style={{
          background: isUser
            ? "linear-gradient(140deg, rgb(var(--polaris-accent)), rgba(var(--polaris-accent)/0.7))"
            : "linear-gradient(140deg, rgba(255,255,255,0.14), rgba(255,255,255,0.04))",
          boxShadow: isUser
            ? "0 8px 24px -8px rgba(var(--polaris-accent)/0.7), inset 0 0 0 1px rgba(255,255,255,0.18)"
            : "inset 0 0 0 1px rgba(255,255,255,0.10)",
        }}
      >
        {isUser ? "Y" : <Bot className="h-4 w-4" />}
      </div>
      <div className={`relative max-w-[82%] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        {!isUser && (
          <div className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
            {modelLabel}
          </div>
        )}
        {(() => {
          const imgMatch = !isUser && content.match(/^!\[[^\]]*\]\((data:image\/[a-zA-Z+.-]+;base64,[^)]+)\)$/);
          if (imgMatch) {
            return (
              <div
                className="relative overflow-hidden rounded-2xl p-1.5 backdrop-blur-xl"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(var(--polaris-accent)/0.22)",
                  boxShadow: "0 1px 0 rgba(255,255,255,0.05) inset, 0 12px 30px -16px rgba(var(--polaris-accent)/0.3)",
                }}
              >
                <img src={imgMatch[1]} alt="Generated" className="block max-h-[420px] w-full rounded-xl object-contain" />
              </div>
            );
          }
          return (
        <div
          className="relative break-words rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed text-white/95 backdrop-blur-xl"
          style={{
            background: isUser
              ? "linear-gradient(140deg, rgba(var(--polaris-accent)/0.22), rgba(var(--polaris-accent)/0.08))"
              : "rgba(255,255,255,0.04)",
            border: `1px solid rgba(var(--polaris-accent)/${isUser ? 0.55 : 0.22})`,
            boxShadow: `0 1px 0 rgba(255,255,255,0.05) inset, 0 12px 30px -16px rgba(var(--polaris-accent)/${isUser ? 0.45 : 0.22})`,
          }}
        >
          {content ? (
            isUser ? (
              <span className="whitespace-pre-wrap">{content}</span>
            ) : (
              <div className="prose-chat">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    h1: ({ children }) => <h3 className="mb-2 mt-1 text-base font-bold">{children}</h3>,
                    h2: ({ children }) => <h3 className="mb-2 mt-1 text-base font-bold">{children}</h3>,
                    h3: ({ children }) => <h4 className="mb-1.5 mt-1 text-[15px] font-semibold">{children}</h4>,
                    ul: ({ children }) => <ul className="mb-2 list-disc space-y-0.5 pl-5">{children}</ul>,
                    ol: ({ children }) => <ol className="mb-2 list-decimal space-y-0.5 pl-5">{children}</ol>,
                    li: ({ children }) => <li className="leading-snug">{children}</li>,
                    a: ({ children, href }) => (
                      <a href={href} target="_blank" rel="noreferrer" className="underline" style={{ color: "rgb(var(--polaris-accent))" }}>{children}</a>
                    ),
                    code: ({ children, className }) => {
                      const isBlock = /language-/.test(className || "");
                      if (isBlock) {
                        return (
                          <pre className="my-2 overflow-x-auto rounded-lg bg-black/50 p-3 text-[12px] leading-relaxed ring-1 ring-white/10">
                            <code>{children}</code>
                          </pre>
                        );
                      }
                      return <code className="rounded bg-white/10 px-1 py-0.5 text-[12.5px]">{children}</code>;
                    },
                    strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                    em: ({ children }) => <em className="italic text-white/90">{children}</em>,
                    blockquote: ({ children }) => (
                      <blockquote className="my-2 border-l-2 pl-3 text-white/80" style={{ borderColor: "rgb(var(--polaris-accent) / 0.6)" }}>{children}</blockquote>
                    ),
                  }}
                >{content}</ReactMarkdown>
              </div>
            )
          ) : (
            <span className="text-white/40">…</span>
          )}
        </div>
          );
        })()}
        {!!content && (
          <button
            onClick={copy}
            className="mt-1 flex items-center gap-1 self-start rounded-md px-1.5 py-0.5 text-[10px] text-white/40 opacity-0 transition hover:text-white/80 group-hover:opacity-100"
            aria-label="Copy message"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
        )}
      </div>
    </div>
  );
}