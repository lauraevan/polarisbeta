// Curated list of freely-distributable homebrew / public-domain ROMs.
// All hosted on archive.org or the original author's site.

export type Homebrew = {
  name: string;
  core: "nes" | "snes" | "gba" | "gb" | "segaMD" | "n64" | "psx";
  url: string;
  blurb: string;
};

// Verified free homebrew / public-domain ROMs hosted by their authors or
// EmulatorJS's own CDN. Each link is the canonical source — no random forks.
export const HOMEBREW: Homebrew[] = [
  {
    name: "Tobu Tobu Girl",
    core: "gb",
    url: "https://tangramgames.dk/files/tobutobugirl.gb",
    blurb: "Cute platformer · Game Boy · by Tangram Games",
  },
  {
    name: "Twin Dragons (Demo)",
    core: "nes",
    url: "https://www.nesworld.com/games/homebrew/twindragons_demo.nes",
    blurb: "Action platformer · NES homebrew",
  },
  {
    name: "EmulatorJS Demo · 2048",
    core: "gba",
    url: "https://demo.emulatorjs.org/data/games/2048.gba",
    blurb: "Puzzle · official EmulatorJS demo ROM",
  },
];

// RAWG cover art base — public free tier, no key needed for tiny payloads.
// We curate a real catalog with cover images for the Switch streaming page.
export type SwitchTitle = {
  title: string;
  tag: string;
  year: number;
  cover: string; // public CDN cover URL
};

export const SWITCH_TITLES: SwitchTitle[] = [
  { title: "The Legend of Zelda: Tears of the Kingdom", tag: "Adventure", year: 2023, cover: "https://upload.wikimedia.org/wikipedia/en/8/85/The_Legend_of_Zelda_Tears_of_the_Kingdom_cover.jpg" },
  { title: "The Legend of Zelda: Breath of the Wild", tag: "Adventure", year: 2017, cover: "https://upload.wikimedia.org/wikipedia/en/c/c6/The_Legend_of_Zelda_Breath_of_the_Wild.jpg" },
  { title: "Super Mario Odyssey", tag: "Platformer", year: 2017, cover: "https://upload.wikimedia.org/wikipedia/en/8/8d/Super_Mario_Odyssey.jpg" },
  { title: "Super Mario Bros. Wonder", tag: "Platformer", year: 2023, cover: "https://upload.wikimedia.org/wikipedia/en/b/b6/Super_Mario_Bros._Wonder_box_art.jpg" },
  { title: "Mario Kart 8 Deluxe", tag: "Racing", year: 2017, cover: "https://upload.wikimedia.org/wikipedia/en/6/69/MK8D_Box_Art.jpg" },
  { title: "Super Smash Bros. Ultimate", tag: "Fighting", year: 2018, cover: "https://upload.wikimedia.org/wikipedia/en/a/a4/Super_Smash_Bros._Ultimate.jpg" },
  { title: "Splatoon 3", tag: "Shooter", year: 2022, cover: "https://upload.wikimedia.org/wikipedia/en/3/30/Splatoon_3_box_art.jpg" },
  { title: "Animal Crossing: New Horizons", tag: "Life sim", year: 2020, cover: "https://upload.wikimedia.org/wikipedia/en/1/81/Animal_Crossing_New_Horizons.jpg" },
  { title: "Pokémon Scarlet", tag: "RPG", year: 2022, cover: "https://upload.wikimedia.org/wikipedia/en/2/27/Pokemon_Scarlet_EN_boxart.png" },
  { title: "Pokémon Violet", tag: "RPG", year: 2022, cover: "https://upload.wikimedia.org/wikipedia/en/3/30/Pokemon_Violet_EN_boxart.png" },
  { title: "Pokémon Legends: Arceus", tag: "RPG", year: 2022, cover: "https://upload.wikimedia.org/wikipedia/en/0/0a/Pokemon_Legends_Arceus_cover.jpg" },
  { title: "Metroid Dread", tag: "Action", year: 2021, cover: "https://upload.wikimedia.org/wikipedia/en/4/4e/Metroid_Dread_cover_art.jpg" },
  { title: "Xenoblade Chronicles 3", tag: "RPG", year: 2022, cover: "https://upload.wikimedia.org/wikipedia/en/0/06/Xenoblade_Chronicles_3_cover_art.png" },
  { title: "Kirby and the Forgotten Land", tag: "Platformer", year: 2022, cover: "https://upload.wikimedia.org/wikipedia/en/4/4d/Kirby_and_the_Forgotten_Land_box_art.jpg" },
  { title: "Luigi's Mansion 3", tag: "Adventure", year: 2019, cover: "https://upload.wikimedia.org/wikipedia/en/d/d9/Luigi%27s_Mansion_3.jpg" },
  { title: "Hollow Knight", tag: "Metroidvania", year: 2018, cover: "https://upload.wikimedia.org/wikipedia/en/0/04/Hollow_Knight_first_cover_art.webp" },
  { title: "Stardew Valley", tag: "Farming", year: 2017, cover: "https://upload.wikimedia.org/wikipedia/en/f/fd/Logo_of_Stardew_Valley.png" },
  { title: "Celeste", tag: "Platformer", year: 2018, cover: "https://upload.wikimedia.org/wikipedia/en/6/6e/Celeste_box_art_full.png" },
  { title: "Hades", tag: "Roguelike", year: 2020, cover: "https://upload.wikimedia.org/wikipedia/en/c/cc/Hades_cover_art.jpg" },
  { title: "Cuphead", tag: "Run & gun", year: 2019, cover: "https://upload.wikimedia.org/wikipedia/en/5/5e/Cuphead_%28artwork%29.png" },
];

export const CORES: { id: Homebrew["core"]; label: string; exts: string[] }[] = [
  { id: "nes", label: "NES", exts: [".nes"] },
  { id: "snes", label: "SNES", exts: [".smc", ".sfc"] },
  { id: "gb", label: "Game Boy / GBC", exts: [".gb", ".gbc"] },
  { id: "gba", label: "Game Boy Advance", exts: [".gba"] },
  { id: "n64", label: "Nintendo 64", exts: [".n64", ".z64", ".v64"] },
  { id: "segaMD", label: "Sega Genesis", exts: [".md", ".gen", ".smd"] },
  { id: "psx", label: "PlayStation 1", exts: [".iso", ".bin", ".cue", ".chd", ".pbp"] },
];