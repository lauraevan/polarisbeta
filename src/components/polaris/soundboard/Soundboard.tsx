import { useRef, useState } from "react";
import { Play, Square, Volume2, Music2 } from "lucide-react";

type Pad = { id: string; label: string; emoji: string; url: string; category: string };

// Curated free SFX (mixkit / pixabay CDN — no auth required).
const PADS: Pad[] = [
  // Reactions
  { id: "airhorn", label: "Air horn", emoji: "📣", category: "Reactions", url: "https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3" },
  { id: "applause", label: "Applause", emoji: "👏", category: "Reactions", url: "https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3" },
  { id: "boo", label: "Crowd boo", emoji: "👎", category: "Reactions", url: "https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3" },
  { id: "laugh", label: "Laugh", emoji: "😂", category: "Reactions", url: "https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3" },
  { id: "drumroll", label: "Drumroll", emoji: "🥁", category: "Reactions", url: "https://assets.mixkit.co/active_storage/sfx/2581/2581-preview.mp3" },
  { id: "fanfare", label: "Fanfare", emoji: "🎺", category: "Reactions", url: "https://assets.mixkit.co/active_storage/sfx/270/270-preview.mp3" },
  // Meme
  { id: "bruh", label: "Bruh", emoji: "🗿", category: "Meme", url: "https://www.myinstants.com/media/sounds/movie_1.mp3" },
  { id: "windows", label: "Windows error", emoji: "💥", category: "Meme", url: "https://www.myinstants.com/media/sounds/erro.mp3" },
  { id: "mariocoin", label: "Mario coin", emoji: "🪙", category: "Meme", url: "https://www.myinstants.com/media/sounds/smb_coin.wav" },
  { id: "wow", label: "Wow", emoji: "🤩", category: "Meme", url: "https://www.myinstants.com/media/sounds/anime-wow-sound-effect_1.mp3" },
  { id: "vine", label: "Vine boom", emoji: "💣", category: "Meme", url: "https://www.myinstants.com/media/sounds/vine-boom.mp3" },
  // Game
  { id: "powerup", label: "Power-up", emoji: "⚡", category: "Game", url: "https://assets.mixkit.co/active_storage/sfx/270/270-preview.mp3" },
  { id: "win", label: "Win jingle", emoji: "🏆", category: "Game", url: "https://assets.mixkit.co/active_storage/sfx/213/213-preview.mp3" },
  { id: "lose", label: "Lose", emoji: "💀", category: "Game", url: "https://assets.mixkit.co/active_storage/sfx/253/253-preview.mp3" },
  { id: "click", label: "Click", emoji: "🖱️", category: "Game", url: "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3" },
  // UI
  { id: "ding", label: "Ding", emoji: "🔔", category: "UI", url: "https://assets.mixkit.co/active_storage/sfx/1849/1849-preview.mp3" },
  { id: "swoosh", label: "Swoosh", emoji: "🌀", category: "UI", url: "https://assets.mixkit.co/active_storage/sfx/2569/2569-preview.mp3" },
  { id: "pop", label: "Pop", emoji: "💧", category: "UI", url: "https://assets.mixkit.co/active_storage/sfx/2356/2356-preview.mp3" },
];

const CATS = ["All", ...Array.from(new Set(PADS.map((p) => p.category)))];

export function Soundboard() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [vol, setVol] = useState(0.7);
  const [cat, setCat] = useState("All");
  const [search, setSearch] = useState("");

  function play(p: Pad) {
    const a = audioRef.current;
    if (!a) return;
    a.src = p.url;
    a.volume = vol;
    a.currentTime = 0;
    a.play().then(() => setActiveId(p.id)).catch(() => setActiveId(null));
    a.onended = () => setActiveId(null);
  }
  function stop() {
    audioRef.current?.pause();
    setActiveId(null);
  }

  const visible = PADS.filter(
    (p) =>
      (cat === "All" || p.category === cat) &&
      p.label.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-8 text-white">
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600">
          <Music2 className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Soundboard</h1>
          <div className="text-sm text-white/60">Drop a beat. Hit a pad.</div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl bg-white/5 p-3">
        <input
          placeholder="Search pads…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[180px] flex-1 rounded-lg bg-black/30 px-3 py-1.5 text-sm focus:outline-none"
        />
        <div className="flex gap-1">
          {CATS.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full px-3 py-1 text-xs ${cat === c ? "bg-white text-black" : "bg-white/5 hover:bg-white/10"}`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-white/60" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={vol}
            onChange={(e) => setVol(Number(e.target.value))}
            className="w-28 accent-white"
          />
          <button
            onClick={stop}
            className="rounded-lg bg-white/10 px-3 py-1 text-xs hover:bg-white/20"
          >
            <Square className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {visible.map((p) => {
          const active = activeId === p.id;
          return (
            <button
              key={p.id}
              onClick={() => play(p)}
              className={`group relative aspect-square overflow-hidden rounded-2xl border p-3 text-left transition active:scale-95 ${
                active
                  ? "border-pink-400 bg-pink-500/15 shadow-[0_0_30px_-5px_rgba(236,72,153,0.6)]"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
            >
              <div className="text-4xl">{p.emoji}</div>
              <div className="absolute right-2 top-2 rounded-full bg-black/40 px-2 py-0.5 text-[9px] uppercase tracking-wider text-white/60">
                {p.category}
              </div>
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <div className="truncate text-sm font-semibold">{p.label}</div>
                <Play className="h-4 w-4 text-white/40 group-hover:text-white" />
              </div>
            </button>
          );
        })}
      </div>

      <audio ref={audioRef} />
    </div>
  );
}
