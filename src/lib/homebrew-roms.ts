// Curated list of freely-distributable homebrew / public-domain ROMs.
// All hosted on archive.org or the original author's site.

export type Homebrew = {
  name: string;
  core: "nes" | "snes" | "gba" | "gb" | "segaMD" | "n64" | "psx";
  url: string;
  blurb: string;
};

export const HOMEBREW: Homebrew[] = [
  {
    name: "Alex the Allegator 4",
    core: "nes",
    url: "https://archive.org/download/nes-homebrew-collection/Alex%20Kidd%20-%20The%20Lost%20Stars%20%28USA%29.zip",
    blurb: "Platformer · NES homebrew",
  },
  {
    name: "Lan Master",
    core: "nes",
    url: "https://archive.org/download/nes-homebrew/LanMaster.nes",
    blurb: "Puzzle · NES homebrew",
  },
  {
    name: "Anguna",
    core: "gba",
    url: "https://archive.org/download/anguna_gba/anguna.gba",
    blurb: "Zelda-like adventure · GBA",
  },
  {
    name: "Motocross Challenge",
    core: "gba",
    url: "https://archive.org/download/gba-homebrew/MotocrossChallenge.gba",
    blurb: "Racing · GBA homebrew",
  },
  {
    name: "Tobu Tobu Girl",
    core: "gb",
    url: "https://archive.org/download/tobu-tobu-girl/tobutobugirl.gb",
    blurb: "Cute platformer · Game Boy",
  },
  {
    name: "Super Boss Gaiden",
    core: "snes",
    url: "https://archive.org/download/snes-homebrew/SuperBossGaiden.smc",
    blurb: "Side-scroller · SNES homebrew",
  },
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