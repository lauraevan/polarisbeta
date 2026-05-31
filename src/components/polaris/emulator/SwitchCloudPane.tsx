import { useState } from "react";
import { ExternalLink, Cloud, Search } from "lucide-react";
import { IframePane } from "./IframePane";

type Game = { title: string; tag: string; year: number };

const SWITCH_LIBRARY: Game[] = [
  { title: "The Legend of Zelda: Tears of the Kingdom", tag: "Adventure", year: 2023 },
  { title: "The Legend of Zelda: Breath of the Wild", tag: "Adventure", year: 2017 },
  { title: "Super Mario Odyssey", tag: "Platformer", year: 2017 },
  { title: "Super Mario Wonder", tag: "Platformer", year: 2023 },
  { title: "Mario Kart 8 Deluxe", tag: "Racing", year: 2017 },
  { title: "Super Smash Bros. Ultimate", tag: "Fighting", year: 2018 },
  { title: "Splatoon 3", tag: "Shooter", year: 2022 },
  { title: "Animal Crossing: New Horizons", tag: "Life sim", year: 2020 },
  { title: "Pokémon Scarlet", tag: "RPG", year: 2022 },
  { title: "Pokémon Violet", tag: "RPG", year: 2022 },
  { title: "Pokémon Legends: Arceus", tag: "RPG", year: 2022 },
  { title: "Metroid Dread", tag: "Action", year: 2021 },
  { title: "Fire Emblem: Three Houses", tag: "Tactics", year: 2019 },
  { title: "Xenoblade Chronicles 3", tag: "RPG", year: 2022 },
  { title: "Kirby and the Forgotten Land", tag: "Platformer", year: 2022 },
  { title: "Luigi's Mansion 3", tag: "Adventure", year: 2019 },
  { title: "Donkey Kong Country: Tropical Freeze", tag: "Platformer", year: 2018 },
  { title: "Hollow Knight", tag: "Metroidvania", year: 2018 },
  { title: "Stardew Valley", tag: "Farming", year: 2017 },
  { title: "Celeste", tag: "Platformer", year: 2018 },
  { title: "Hades", tag: "Roguelike", year: 2020 },
  { title: "Cuphead", tag: "Run & gun", year: 2019 },
];

export function SwitchCloudPane() {
  const [picked, setPicked] = useState<Game | null>(null);
  const [query, setQuery] = useState("");

  if (picked) {
    const url = `https://www.afterplay.io/?q=${encodeURIComponent(picked.title)}`;
    return (
      <div className="flex h-full flex-col gap-2">
        <button
          onClick={() => setPicked(null)}
          className="self-start rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] text-white/75 hover:bg-white/10"
        >
          ← Back to library
        </button>
        <div className="min-h-0 flex-1">
          <IframePane
            url={url}
            label={picked.title}
            banner={`Launching “${picked.title}” via Afterplay cloud. Sign in to start playing — Switch tier may require a paid plan.`}
          />
        </div>
      </div>
    );
  }

  const filtered = SWITCH_LIBRARY.filter((g) =>
    g.title.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="flex h-full flex-col gap-3 p-3">
      <div className="liquid-glass-strong flex items-center justify-between gap-3 rounded-xl border border-white/10 px-4 py-2.5 text-xs text-white/75">
        <div className="flex items-center gap-2">
          <Cloud className="h-3.5 w-3.5" />
          <span>Modern Switch library — streamed via Afterplay cloud (no install).</span>
        </div>
        <a
          href="https://www.afterplay.io"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-white/10"
        >
          <ExternalLink className="h-3 w-3" /> Afterplay home
        </a>
      </div>

      <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
        <Search className="h-3.5 w-3.5 text-white/50" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Switch games…"
          className="w-full bg-transparent text-sm text-white placeholder-white/40 focus:outline-none"
        />
      </label>

      <div className="grid min-h-0 flex-1 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((g) => (
          <button
            key={g.title}
            onClick={() => setPicked(g)}
            className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] p-3 text-left transition hover:border-white/25 hover:bg-white/[0.08]"
          >
            <div
              className="absolute inset-0 opacity-40 transition group-hover:opacity-70"
              style={{
                background:
                  "linear-gradient(135deg, rgba(var(--polaris-accent)/0.25), transparent 70%)",
              }}
            />
            <div className="relative">
              <div className="text-[13px] font-bold leading-tight text-white">{g.title}</div>
              <div className="mt-1 text-[10px] uppercase tracking-widest text-white/45">
                {g.tag} · {g.year}
              </div>
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full grid place-items-center py-12 text-xs text-white/45">
            No games match “{query}”.
          </div>
        )}
      </div>
    </div>
  );
}