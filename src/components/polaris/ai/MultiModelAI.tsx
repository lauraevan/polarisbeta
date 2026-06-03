import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, Send, Sparkles, RotateCcw, Users, Loader2 } from "lucide-react";

type Role = "user" | "assistant";
type AgentId = "A" | "B";
type Msg = { id: string; role: Role; agent?: AgentId; modelLabel?: string; content: string };

type ModelOpt = { id: string; label: string };

const MODELS: ModelOpt[] = [
  { id: "groq/llama-3.3-70b-versatile", label: "Llama 3.3 70B (Groq)" },
  { id: "groq/llama-3.1-8b-instant", label: "Llama 3.1 8B (Groq)" },
  { id: "groq/deepseek-r1-distill-llama-70b", label: "DeepSeek R1 70B (Groq)" },
  { id: "groq/openai/gpt-oss-120b", label: "GPT OSS 120B (Groq)" },
  { id: "groq/qwen/qwen3-32b", label: "Qwen 3 32B (Groq)" },
  { id: "openrouter/x-ai/grok-4.3", label: "Grok 4.3" },
  { id: "openrouter/anthropic/claude-sonnet-4.6", label: "Claude Sonnet 4.6" },
  { id: "openrouter/anthropic/claude-haiku-4.5", label: "Claude Haiku 4.5" },
  { id: "openrouter/deepseek/deepseek-r1", label: "DeepSeek R1" },
  { id: "openrouter/meta-llama/llama-4-maverick:free", label: "Llama 4 Maverick" },
  { id: "google/gemini-3-flash-preview", label: "Gemini 3 Flash (Pro)" },
  { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro (Pro)" },
  { id: "openai/gpt-5-mini", label: "GPT-5 Mini (Pro)" },
];

const AGENT_META: Record<AgentId, { name: string; tint: string; ring: string }> = {
  A: { name: "Agent A", tint: "from-sky-500/30 to-indigo-500/10", ring: "ring-sky-400/50" },
  B: { name: "Agent B", tint: "from-rose-500/30 to-orange-500/10", ring: "ring-rose-400/50" },
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

async function streamOnce({
  model,
  system,
  messages,
  onDelta,
}: {
  model: string;
  system: string;
  messages: { role: Role; content: string }[];
  onDelta: (chunk: string) => void;
}) {
  const res = await fetch("/api/ai-chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, system, messages }),
  });
  if (!res.ok || !res.body) {
    const j = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(j.error || `HTTP ${res.status}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
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
      if (data === "[DONE]") { done = true; break; }
      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (delta) onDelta(delta);
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }
}

export function MultiModelAI() {
  const [modelA, setModelA] = useState(MODELS[0].id);
  const [modelB, setModelB] = useState(MODELS[5].id);
  const [rounds, setRounds] = useState(2);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const labelOf = (id: string) => MODELS.find((m) => m.id === id)?.label ?? id;

  function systemFor(agent: AgentId, partnerLabel: string) {
    const self = agent === "A" ? "Agent A" : "Agent B";
    return (
      `You are ${self}, one of two AI models collaborating in a shared chat. ` +
      `Your partner is ${agent === "A" ? "Agent B" : "Agent A"} (model: ${partnerLabel}). ` +
      `Work together to solve the user's task. Build on your partner's ideas, ` +
      `point out mistakes politely, propose improvements, and converge toward a correct, complete answer. ` +
      `Stay focused and concise. Address your partner directly when useful (e.g. "Agent B, what if we…"). ` +
      `Always write as ${self} — never pretend to be the user or your partner.`
    );
  }

  function transcriptFor(agent: AgentId): { role: Role; content: string }[] {
    // Map messages: turns by THIS agent become assistant role; user prompts and the partner's turns become user role with a label.
    return messages.map<{ role: Role; content: string }>((m) => {
      if (m.role === "user") return { role: "user", content: m.content };
      if (m.agent === agent) return { role: "assistant", content: m.content };
      const partnerName = m.agent === "A" ? "Agent A" : "Agent B";
      return { role: "user", content: `[${partnerName} said]\n${m.content}` };
    });
  }

  async function runAgent(agent: AgentId, currentMessages: Msg[]): Promise<Msg[]> {
    const model = agent === "A" ? modelA : modelB;
    const partnerLabel = labelOf(agent === "A" ? modelB : modelA);
    const placeholder: Msg = {
      id: uid(),
      role: "assistant",
      agent,
      modelLabel: labelOf(model),
      content: "",
    };
    setMessages([...currentMessages, placeholder]);
    let acc = "";
    const history = currentMessages.map<{ role: Role; content: string }>((m) => {
      if (m.role === "user") return { role: "user", content: m.content };
      if (m.agent === agent) return { role: "assistant", content: m.content };
      const partnerName = m.agent === "A" ? "Agent A" : "Agent B";
      return { role: "user", content: `[${partnerName} said]\n${m.content}` };
    });
    await streamOnce({
      model,
      system: systemFor(agent, partnerLabel),
      messages: history,
      onDelta: (chunk) => {
        acc += chunk;
        const snap = acc;
        setMessages((prev) =>
          prev.map((m) => (m.id === placeholder.id ? { ...m, content: snap } : m)),
        );
      },
    });
    const finalMsg = { ...placeholder, content: acc };
    return [...currentMessages, finalMsg];
  }

  async function send() {
    const text = input.trim();
    if (!text || running) return;
    setError(null);
    setInput("");
    const userMsg: Msg = { id: uid(), role: "user", content: text };
    let cur = [...messages, userMsg];
    setMessages(cur);
    setRunning(true);
    try {
      for (let i = 0; i < rounds; i++) {
        cur = await runAgent("A", cur);
        cur = await runAgent("B", cur);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setRunning(false);
    }
  }

  function reset() {
    if (running) return;
    setMessages([]);
    setError(null);
  }

  return (
    <div className="relative flex h-[calc(100vh-32px)] flex-col text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(110% 50% at 20% 0%, rgba(80,120,255,0.18), transparent 60%), radial-gradient(80% 50% at 100% 100%, rgba(255,80,140,0.16), transparent 60%), linear-gradient(180deg, rgba(8,8,16,0.55), rgba(4,4,10,0.95))",
        }}
      />

      {/* Header / controls */}
      <header className="liquid-glass-strong sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-white" />
          <div>
            <div className="text-sm font-bold">Multi-Model AI</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/55">Two models · one chat</div>
          </div>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <AgentPicker label="Agent A" value={modelA} onChange={setModelA} accent="sky" />
          <AgentPicker label="Agent B" value={modelB} onChange={setModelB} accent="rose" />
          <label className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold">
            Rounds
            <select
              value={rounds}
              onChange={(e) => setRounds(Number(e.target.value))}
              className="rounded bg-transparent text-white focus:outline-none"
            >
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n} className="bg-black">{n}</option>
              ))}
            </select>
          </label>
          <button
            onClick={reset}
            disabled={running}
            className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/85 hover:bg-white/20 disabled:opacity-40"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>
      </header>

      {/* Transcript */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        {messages.length === 0 ? (
          <div className="mx-auto max-w-2xl text-center text-white/65">
            <Sparkles className="mx-auto mb-3 h-8 w-8 text-white/40" />
            <h2 className="mb-2 text-2xl font-bold text-white">Two AI minds, one task.</h2>
            <p className="text-sm">
              Pick two models above, set how many rounds they should debate, then describe a complex task.
              Agent A drafts, Agent B critiques and improves — they keep iterating to a better answer.
            </p>
          </div>
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-4">
            {messages.map((m) => (
              <MessageBubble key={m.id} msg={m} />
            ))}
            {running && (
              <div className="flex items-center gap-2 text-xs text-white/60">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Agents are thinking…
              </div>
            )}
            {error && (
              <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                {error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-white/10 bg-black/50 px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Describe a task for both models to work on together…"
            rows={2}
            className="flex-1 resize-none rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
          />
          <button
            onClick={send}
            disabled={running || !input.trim()}
            className="flex h-10 items-center gap-1.5 rounded-xl bg-white px-4 text-sm font-bold text-black hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" /> Send
          </button>
        </div>
      </div>
    </div>
  );
}

function AgentPicker({
  label,
  value,
  onChange,
  accent,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  accent: "sky" | "rose";
}) {
  const dot = accent === "sky" ? "bg-sky-400" : "bg-rose-400";
  return (
    <label className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold">
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="max-w-[160px] truncate rounded bg-transparent text-white focus:outline-none"
      >
        {MODELS.map((m) => (
          <option key={m.id} value={m.id} className="bg-black">{m.label}</option>
        ))}
      </select>
    </label>
  );
}

function MessageBubble({ msg }: { msg: Msg }) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl bg-white px-4 py-2 text-sm text-black shadow">
          {msg.content}
        </div>
      </div>
    );
  }
  const meta = AGENT_META[msg.agent ?? "A"];
  return (
    <div className="flex gap-3">
      <div
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br ${meta.tint} ring-1 ${meta.ring}`}
      >
        <Bot className="h-4 w-4 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2 text-[11px] text-white/60">
          <span className="font-bold text-white/85">{meta.name}</span>
          {msg.modelLabel && <span className="truncate">· {msg.modelLabel}</span>}
        </div>
        <div className="prose prose-invert prose-sm max-w-none rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm">
          {msg.content ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
          ) : (
            <span className="text-white/40">…</span>
          )}
        </div>
      </div>
    </div>
  );
}