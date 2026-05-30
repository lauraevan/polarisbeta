import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Send, Image as ImageIcon, Film as FilmIcon, Smile, X } from "lucide-react";

type Attachment = {
  kind: "image" | "video" | "gif";
  url: string;
  name?: string;
};

type Msg = {
  id: string;
  author: string;
  text?: string;
  attachments?: Attachment[];
  at: number;
};

const STORAGE_KEY = (room: string) => `polarisflix-chat-${room}`;

function loadName() {
  if (typeof window === "undefined") return "You";
  return window.localStorage.getItem("polarisflix-chat-name") || "You";
}

export function MovieChat({ room, title, onClose }: { room: string; title: string; onClose?: () => void }) {
  const [name, setName] = useState(loadName);
  const [editingName, setEditingName] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [pending, setPending] = useState<Attachment[]>([]);
  const [gifOpen, setGifOpen] = useState(false);
  const [gifQuery, setGifQuery] = useState("");
  const [gifResults, setGifResults] = useState<string[]>([]);
  const scroller = useRef<HTMLDivElement>(null);
  const imgInput = useRef<HTMLInputElement>(null);
  const vidInput = useRef<HTMLInputElement>(null);

  // Load persisted messages
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY(room));
      if (raw) setMessages(JSON.parse(raw));
    } catch {}
  }, [room]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY(room), JSON.stringify(messages.slice(-100)));
    } catch {}
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, room]);

  useEffect(() => {
    window.localStorage.setItem("polarisflix-chat-name", name);
  }, [name]);

  const handleFiles = (e: ChangeEvent<HTMLInputElement>, kind: "image" | "video") => {
    const files = Array.from(e.target.files ?? []);
    const next = files.map((f) => ({
      kind,
      url: URL.createObjectURL(f),
      name: f.name,
    } as Attachment));
    setPending((p) => [...p, ...next]);
    e.target.value = "";
  };

  // Tenor public anonymous demo key — replace if user wants higher limits.
  const searchGifs = async (q: string) => {
    if (!q.trim()) {
      setGifResults([]);
      return;
    }
    try {
      const res = await fetch(
        `https://g.tenor.com/v1/search?q=${encodeURIComponent(q)}&key=LIVDSRZULELA&limit=18&media_filter=minimal`
      );
      const data = await res.json();
      const urls: string[] = (data?.results ?? [])
        .map((r: any) => r?.media?.[0]?.tinygif?.url || r?.media?.[0]?.gif?.url)
        .filter(Boolean);
      setGifResults(urls);
    } catch {
      setGifResults([]);
    }
  };

  const pickGif = (url: string) => {
    setPending((p) => [...p, { kind: "gif", url }]);
    setGifOpen(false);
    setGifQuery("");
    setGifResults([]);
  };

  const send = () => {
    if (!text.trim() && !pending.length) return;
    setMessages((m) => [
      ...m,
      {
        id: crypto.randomUUID(),
        author: name,
        text: text.trim() || undefined,
        attachments: pending.length ? pending : undefined,
        at: Date.now(),
      },
    ]);
    setText("");
    setPending([]);
  };

  return (
    <div className="liquid-glass-themed flex h-full w-full flex-col overflow-hidden md:rounded-l-2xl">
      <header className="flex items-center justify-between gap-2 border-b border-white/10 bg-white/5 px-3 py-2 backdrop-blur-xl">
        <div className="min-w-0">
          <div className="truncate text-xs font-semibold text-white">Watch Party Chat</div>
          <div className="truncate text-[10px] text-white/55">{title}</div>
        </div>
        {editingName ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value || "You")}
            onBlur={() => setEditingName(false)}
            onKeyDown={(e) => e.key === "Enter" && setEditingName(false)}
            className="liquid-glass w-24 rounded-md bg-transparent px-2 py-1 text-[11px] text-white"
          />
        ) : (
          <button
            onClick={() => setEditingName(true)}
            className="rounded-md px-2 py-1 text-[11px] text-white/70 hover:bg-white/10"
          >
            @{name}
          </button>
        )}
        {onClose && (
          <button onClick={onClose} className="rounded-md p-1 text-white/70 hover:bg-white/10 md:hidden" aria-label="Close chat">
            <X className="h-4 w-4" />
          </button>
        )}
      </header>

      <div ref={scroller} className="flex-1 space-y-2 overflow-y-auto px-3 py-3 text-sm">
        {messages.length === 0 && (
          <div className="mt-6 text-center text-[11px] text-white/45">
            Say hi 👋 — share gifs, photos and clips while you watch.
          </div>
        )}
        {messages.map((m) => {
          const mine = m.author === name;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-[13px] backdrop-blur-xl ${
                  mine
                    ? "text-black shadow-[0_8px_24px_-10px_rgba(var(--polaris-accent)/0.6)] ring-1 ring-white/30"
                    : "liquid-glass text-white"
                }`}
                style={
                  mine
                    ? {
                        background:
                          "linear-gradient(180deg, rgba(var(--polaris-accent)/0.95), rgba(var(--polaris-accent)/0.75))",
                      }
                    : undefined
                }
              >
                {!mine && <div className="mb-0.5 text-[10px] font-semibold opacity-70">{m.author}</div>}
                {m.attachments?.map((a, i) => (
                  <div key={i} className="mb-1 overflow-hidden rounded-lg">
                    {a.kind === "video" ? (
                      <video src={a.url} controls className="max-h-60 w-full" />
                    ) : (
                      <img src={a.url} alt={a.name ?? ""} className="max-h-60 w-full object-contain" />
                    )}
                  </div>
                ))}
                {m.text && <div className="whitespace-pre-wrap break-words">{m.text}</div>}
              </div>
            </div>
          );
        })}
      </div>

      {pending.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-white/10 bg-black/30 p-2">
          {pending.map((a, i) => (
            <div key={i} className="relative h-14 w-14 overflow-hidden rounded-md bg-white/5">
              {a.kind === "video" ? (
                <video src={a.url} className="h-full w-full object-cover" />
              ) : (
                <img src={a.url} alt="" className="h-full w-full object-cover" />
              )}
              <button
                onClick={() => setPending((p) => p.filter((_, j) => j !== i))}
                className="absolute right-0 top-0 rounded-bl bg-black/70 p-0.5 text-white"
                aria-label="Remove"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {gifOpen && (
        <div className="max-h-56 overflow-y-auto border-t border-white/10 bg-black/40 p-2">
          <input
            autoFocus
            value={gifQuery}
            onChange={(e) => {
              setGifQuery(e.target.value);
              searchGifs(e.target.value);
            }}
            placeholder="Search GIFs (Tenor)…"
            className="liquid-glass mb-2 w-full rounded-md bg-transparent px-2 py-1.5 text-xs text-white placeholder:text-white/40 focus:outline-none"
          />
          <div className="grid grid-cols-3 gap-1.5">
            {gifResults.map((url) => (
              <button key={url} onClick={() => pickGif(url)} className="overflow-hidden rounded-md">
                <img src={url} alt="" className="h-20 w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-1 border-t border-white/10 bg-white/5 p-2 backdrop-blur-xl">
        <input ref={imgInput} type="file" accept="image/*" multiple hidden onChange={(e) => handleFiles(e, "image")} />
        <input ref={vidInput} type="file" accept="video/*" multiple hidden onChange={(e) => handleFiles(e, "video")} />
        <button onClick={() => imgInput.current?.click()} className="rounded-md p-1.5 text-white/75 hover:bg-white/10" aria-label="Photo">
          <ImageIcon className="h-4 w-4" />
        </button>
        <button onClick={() => vidInput.current?.click()} className="rounded-md p-1.5 text-white/75 hover:bg-white/10" aria-label="Video">
          <FilmIcon className="h-4 w-4" />
        </button>
        <button
          onClick={() => setGifOpen((o) => !o)}
          className={`rounded-md p-1.5 hover:bg-white/10 ${gifOpen ? "text-white" : "text-white/75"}`}
          aria-label="GIF"
        >
          <Smile className="h-4 w-4" />
        </button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Message…"
          className="liquid-glass flex-1 rounded-full bg-transparent px-3 py-1.5 text-sm text-white placeholder:text-white/40 focus:outline-none"
        />
        <button
          onClick={send}
          className="rounded-full bg-[rgb(var(--polaris-accent))] p-2 text-black hover:opacity-90"
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}