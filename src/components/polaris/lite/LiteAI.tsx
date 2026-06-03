import { useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

const MODELS = [
  { id: "groq/llama-3.3-70b-versatile", label: "Llama 3.3 70B (Groq)" },
  { id: "groq/llama-3.1-8b-instant", label: "Llama 3.1 8B (Groq · fast)" },
  { id: "openrouter/meta-llama/llama-3.3-70b-instruct:free", label: "Llama 3.3 70B (OpenRouter)" },
  { id: "openrouter/google/gemini-2.0-flash-exp:free", label: "Gemini 2.0 Flash (OpenRouter)" },
];

export function LiteAI() {
  const [model, setModel] = useState(MODELS[0].id);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    const next: Msg[] = [...msgs, { role: "user", content: text }, { role: "assistant", content: "" }];
    setMsgs(next);
    setBusy(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          system: "You are Polaris AI, a helpful assistant. Keep answers concise.",
          messages: next.slice(0, -1).map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: ctrl.signal,
      });
      if (!res.body) throw new Error("No body");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const ln of lines) {
          const l = ln.trim();
          if (!l.startsWith("data:")) continue;
          const data = l.slice(5).trim();
          if (data === "[DONE]") continue;
          try {
            const j = JSON.parse(data);
            const delta = j?.choices?.[0]?.delta?.content;
            if (delta) {
              acc += delta;
              setMsgs((prev) => {
                const c = [...prev];
                c[c.length - 1] = { role: "assistant", content: acc };
                return c;
              });
            }
          } catch { /* ignore */ }
        }
      }
    } catch (e) {
      setMsgs((prev) => {
        const c = [...prev];
        c[c.length - 1] = { role: "assistant", content: `Error: ${(e as Error).message}` };
        return c;
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-49px)] flex-col px-4 py-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold">AI</h1>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="rounded border border-neutral-800 bg-neutral-900 px-2 py-1 text-xs"
        >
          {MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
        </select>
      </div>
      <div className="mt-3 flex-1 overflow-y-auto rounded border border-neutral-800 bg-neutral-900/40 p-3">
        {msgs.length === 0 && (
          <div className="py-10 text-center text-sm text-neutral-500">
            Ask anything. Free Groq + OpenRouter models, streaming.
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`mb-3 text-sm ${m.role === "user" ? "text-white" : "text-neutral-300"}`}>
            <div className="text-[10px] uppercase tracking-wider text-neutral-500">{m.role}</div>
            <div className="mt-1 whitespace-pre-wrap">{m.content || (busy && i === msgs.length - 1 ? "…" : "")}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Type a message…"
          className="flex-1 rounded border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-neutral-600"
        />
        <button
          onClick={send}
          disabled={busy || !input.trim()}
          className="rounded bg-white px-4 py-2 text-sm font-bold text-black disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </div>
  );
}