import { useState } from "react";
import { Sparkles, Heart, Send, Loader2, Film, Gamepad2, Tv2, Bookmark } from "lucide-react";
import { useMyList } from "@/lib/mylist-context";

type Mode = "recs" | "match";
type Category = "movies" | "shows" | "anime" | "games" | "any";

const SYSTEM_RECS = `You are Polaris Recs, a friendly recommendation engine. The user describes their taste; you suggest 5 great picks (movies, shows, anime, or games as requested). For each: bold title (year), one line on why it fits, and a quick vibe tag. Keep it punchy. Use Markdown.`;

const SYSTEM_MATCH = `You are Polaris Movie Matchmaker. The user gives you their mood / vibe / two favourite films. Pick ONE perfect movie match. Reply in this format:

**The Match:** *Title (Year)*

**Why it's your match:** 2–3 sentences.

**Watch if you like:** 3 quick comparable titles.

Be confident, warm, a little cinematic.`;

export function PolarisRecs() {
  const [mode, setMode] = useState<Mode>("recs");
  const [category, setCategory] = useState<Category>("any");
  const [input, setInput] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const { list, games } = useMyList();

  async function go() {
    const text = input.trim();
    if (!text || loading) return;
    setLoading(true);
    setAnswer("");

    const taste =
      list.length || games.length
        ? `\n\nFor context, the user's saved favorites include: ${[
            ...list.slice(0, 6).map((i) => i.title || i.name),
            ...games.slice(0, 6).map((g) => g.title),
          ]
            .filter(Boolean)
            .join(", ")}.`
        : "";

    const userMsg =
      mode === "recs"
        ? `Category: ${category}. ${text}${taste}`
        : `${text}${taste}`;

    try {
      const resp = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: mode === "recs" ? SYSTEM_RECS : SYSTEM_MATCH,
          messages: [{ role: "user", content: userMsg }],
          model: "google/gemini-2.5-flash",
        }),
      });
      if (!resp.ok || !resp.body) {
        const t = await resp.text();
        setAnswer(`Error: ${t.slice(0, 200)}`);
        setLoading(false);
        return;
      }
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const j = line.slice(6).trim();
          if (j === "[DONE]") continue;
          try {
            const p = JSON.parse(j);
            const delta = p.choices?.[0]?.delta?.content;
            if (delta) {
              acc += delta;
              setAnswer(acc);
            }
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch (e) {
      setAnswer(`Error: ${(e as Error).message}`);
    }
    setLoading(false);
  }

  const placeholders: Record<Mode, string> = {
    recs: "I love cozy fantasy and slow-burn mysteries…",
    match: "I want something like Past Lives but a little more thrilling…",
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <div className="mb-6 flex flex-col items-center text-center">
        <div
          className="grid h-12 w-12 place-items-center rounded-2xl"
          style={{ background: "rgba(var(--polaris-accent)/0.18)" }}
        >
          <Sparkles className="h-6 w-6 text-[rgb(var(--polaris-accent))]" />
        </div>
        <h1 className="mt-3 text-2xl font-bold text-white">Polaris Recommends</h1>
        <p className="mt-1 text-xs text-white/55">
          AI picks tuned to your taste — movies, shows, anime, games.
        </p>
      </div>

      <div className="liquid-glass mb-4 flex gap-1 rounded-2xl p-1">
        <ModeTab active={mode === "recs"} onClick={() => setMode("recs")} icon={<Sparkles className="h-3.5 w-3.5" />}>
          Recommender
        </ModeTab>
        <ModeTab active={mode === "match"} onClick={() => setMode("match")} icon={<Heart className="h-3.5 w-3.5" />}>
          Movie Matchmaker
        </ModeTab>
      </div>

      {mode === "recs" && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {(
            [
              { id: "any", label: "Anything", icon: Sparkles },
              { id: "movies", label: "Movies", icon: Film },
              { id: "shows", label: "Shows", icon: Tv2 },
              { id: "anime", label: "Anime", icon: Sparkles },
              { id: "games", label: "Games", icon: Gamepad2 },
            ] as { id: Category; label: string; icon: typeof Film }[]
          ).map((c) => {
            const Icon = c.icon;
            const on = category === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold transition"
                style={
                  on
                    ? {
                        background: "rgba(var(--polaris-accent)/0.25)",
                        color: "white",
                        boxShadow: "inset 0 0 0 1px rgba(var(--polaris-accent)/0.55)",
                      }
                    : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.7)" }
                }
              >
                <Icon className="h-3 w-3" /> {c.label}
              </button>
            );
          })}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          go();
        }}
        className="liquid-glass-ghost flex items-end gap-2 rounded-2xl p-3"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholders[mode]}
          rows={2}
          className="flex-1 resize-none bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="grid h-9 w-9 place-items-center rounded-xl text-black disabled:opacity-50"
          style={{ background: "rgb(var(--polaris-accent))" }}
          aria-label="Send"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>

      {(list.length > 0 || games.length > 0) && (
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-white/45">
          <Bookmark className="h-3 w-3" />
          Using your My List ({list.length + games.length} items) for personalization.
        </div>
      )}

      {answer && (
        <div className="liquid-glass mt-5 rounded-2xl p-5 text-sm text-white/90">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-white/90">{answer}</pre>
        </div>
      )}
    </div>
  );
}

function ModeTab({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition"
      style={
        active
          ? {
              background: "rgba(var(--polaris-accent)/0.22)",
              color: "white",
              boxShadow: "inset 0 0 0 1px rgba(var(--polaris-accent)/0.5)",
            }
          : { color: "rgba(255,255,255,0.6)" }
      }
    >
      {icon}
      {children}
    </button>
  );
}