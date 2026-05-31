import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  Check,
  ChevronDown,
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

const STARTERS = [
  "Write me code that…",
  "Help me brainstorm ideas for…",
  "Summarize this for me:",
  "Write a creative story about…",
];

const STORAGE_KEY = "polaris-ai-chats-v1";
const LIMIT_KEY = "polaris-ai-limits-v1";
const DAILY_LIMITS: Record<ModelTier, number> = { free: 120, premium: 40 };
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
  const [search, setSearch] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // hydrate
  useEffect(() => {
    const loaded = loadChats();
    setChats(loaded);
    if (loaded.length) setActiveId(loaded[0].id);
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
    if (used >= cap) {
      setError(`Daily ${model.tier} limit reached (${cap}/day). Switch model or try again tomorrow.`);
      return;
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

      {/* Main */}
      <div className="relative m-2 flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-white/10 bg-black shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] md:m-3">
        {/* Top bar */}
        <header className="flex items-center justify-between gap-2 border-b border-white/10 bg-black px-3 py-3 sm:px-5">
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
          </div>
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto bg-black px-3 py-6 sm:px-8">
          {!active || active.messages.length === 0 ? (
            <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center text-center">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10">
                <img src={logo} alt="" className="h-9 w-9 object-contain" />
              </div>
              <h1 className="mt-4 text-2xl font-black tracking-tight">Polaris AI</h1>
              <p className="mt-1 text-sm text-white/55">
                Multi-model assistant · {model.label} · {mode.label} mode
              </p>
              <div className="mt-8 grid w-full max-w-md gap-2">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-left text-sm text-white/80 hover:bg-black/45 hover:text-white"
                  >
                    {s}
                  </button>
                ))}
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

        {/* Composer */}
        <div className="border-t border-white/10 bg-black px-3 py-3 sm:px-6">
          {error && (
            <div className="mx-auto mb-2 max-w-3xl rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {error}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="mx-auto flex max-w-3xl items-end gap-2 rounded-3xl border border-white/15 bg-zinc-950 p-2 transition-shadow focus-within:border-[rgb(var(--polaris-accent))] focus-within:shadow-[0_0_0_3px_rgba(var(--polaris-accent)/0.18)]"
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
              placeholder={`Message ${model.label}…`}
              className="min-h-[40px] max-h-[180px] flex-1 resize-none bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/35 focus:outline-none"
            />
            <button
              type="submit"
              disabled={streaming || !input.trim()}
              className="grid h-10 w-10 place-items-center rounded-2xl text-white transition disabled:opacity-40"
              style={{ background: "rgb(var(--polaris-accent))" }}
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          <div className="mx-auto mt-2 flex max-w-3xl items-center justify-center gap-1 text-[10px] uppercase tracking-widest text-white/35">
            <Sparkles className="h-3 w-3" /> Polaris AI · multi-model assistant
          </div>
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
  return (
    <div className={`flex gap-3 animate-[fadeIn_220ms_ease] ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold text-white"
        style={{
          background: isUser ? "rgb(var(--polaris-accent))" : "rgba(255,255,255,0.08)",
          boxShadow: isUser ? "0 4px 16px -4px rgba(var(--polaris-accent)/0.6)" : undefined,
        }}
      >
        {isUser ? "Y" : <Bot className="h-4 w-4" />}
      </div>
      <div
        className="max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed text-white/95"
        style={{
          background: isUser ? "rgba(var(--polaris-accent)/0.12)" : "rgba(255,255,255,0.025)",
          border: `1px solid rgba(var(--polaris-accent)/${isUser ? 0.55 : 0.28})`,
          boxShadow: `0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px -12px rgba(var(--polaris-accent)/${isUser ? 0.35 : 0.18})`,
        }}
      >
        {!isUser && <div className="mb-1 text-[10px] uppercase tracking-widest text-white/40">{modelLabel}</div>}
        {content || <span className="text-white/40">…</span>}
      </div>
    </div>
  );
}