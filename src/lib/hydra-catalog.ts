/**
 * Curated PC game catalog for the Hydra tab. Cover images come from Steam's
 * CDN (CORS-open). Launch buttons deep-link into the Hydra Launcher; if it
 * isn't installed, we fall back to opening the Steam store page.
 */
export type HydraGame = {
  appId: number;
  title: string;
  category: "Action" | "RPG" | "Indie" | "Multiplayer" | "Strategy" | "Horror" | "Racing" | "Simulation";
  blurb: string;
};

export const HYDRA_GAMES: HydraGame[] = [
  { appId: 730,    title: "Counter-Strike 2",            category: "Multiplayer", blurb: "Tactical 5v5 shooter — Valve's flagship." },
  { appId: 570,    title: "Dota 2",                       category: "Multiplayer", blurb: "The original MOBA. Free to play." },
  { appId: 271590, title: "Grand Theft Auto V",           category: "Action",      blurb: "Open-world crime sandbox." },
  { appId: 1172470, title: "Apex Legends",                category: "Multiplayer", blurb: "Hero battle royale." },
  { appId: 359550, title: "Rainbow Six Siege",            category: "Multiplayer", blurb: "Tactical destruction-heavy 5v5." },
  { appId: 1599340, title: "Lost Ark",                    category: "RPG",         blurb: "ARPG MMO from Smilegate." },
  { appId: 1245620, title: "ELDEN RING",                  category: "RPG",         blurb: "FromSoft's open-world masterpiece." },
  { appId: 2358720, title: "Black Myth: Wukong",          category: "Action",      blurb: "Mythic Chinese action RPG." },
  { appId: 1086940, title: "Baldur's Gate 3",             category: "RPG",         blurb: "Larian's GOTY tactical RPG." },
  { appId: 1091500, title: "Cyberpunk 2077",              category: "RPG",         blurb: "Night City open-world RPG." },
  { appId: 292030,  title: "The Witcher 3: Wild Hunt",    category: "RPG",         blurb: "Geralt's monster-hunter epic." },
  { appId: 489830,  title: "The Elder Scrolls V: Skyrim", category: "RPG",         blurb: "Bethesda's classic open-world." },
  { appId: 252490,  title: "Rust",                        category: "Multiplayer", blurb: "Brutal multiplayer survival." },
  { appId: 4000,    title: "Garry's Mod",                 category: "Indie",       blurb: "The original physics sandbox." },
  { appId: 105600,  title: "Terraria",                    category: "Indie",       blurb: "2D adventure sandbox." },
  { appId: 105800,  title: "Subnautica",                  category: "Simulation",  blurb: "Alien underwater survival." },
  { appId: 526870,  title: "Satisfactory",                category: "Simulation",  blurb: "First-person factory builder." },
  { appId: 1062090, title: "Phasmophobia",                category: "Horror",      blurb: "Co-op ghost hunting." },
  { appId: 739630,  title: "Phasmo 2 — Crimson Desert",   category: "Action",      blurb: "Pearl Abyss open-world." },
  { appId: 1593500, title: "God of War",                  category: "Action",      blurb: "Kratos in the Norse realms." },
  { appId: 1817070, title: "Marvel's Spider-Man Remastered", category: "Action",   blurb: "Web-swinging open-world NYC." },
  { appId: 2050650, title: "Resident Evil 4 Remake",      category: "Horror",      blurb: "Leon's classic mission reborn." },
  { appId: 2138710, title: "Sekiro: Shadows Die Twice",   category: "Action",      blurb: "Sengoku-era ninja action." },
  { appId: 814380,  title: "Sekiro",                      category: "Action",      blurb: "FromSoftware's shinobi epic." },
  { appId: 1817190, title: "Hogwarts Legacy",             category: "RPG",         blurb: "Open-world wizarding school." },
  { appId: 1888930, title: "The Last of Us Part I",       category: "Action",      blurb: "Naughty Dog's post-apocalyptic." },
  { appId: 2344520, title: "Diablo IV",                   category: "RPG",         blurb: "Blizzard's grim ARPG." },
  { appId: 553850,  title: "Helldivers 2",                category: "Multiplayer", blurb: "Co-op galactic shooter." },
  { appId: 1326470, title: "Sons of the Forest",          category: "Horror",      blurb: "Cannibal-island survival." },
  { appId: 1145360, title: "Hades",                       category: "Indie",       blurb: "Supergiant's roguelite." },
  { appId: 391540,  title: "Undertale",                   category: "Indie",       blurb: "RPG where nobody has to die." },
  { appId: 1794680, title: "Vampire Survivors",           category: "Indie",       blurb: "The roguelite that ate 2022." },
  { appId: 367520,  title: "Hollow Knight",               category: "Indie",       blurb: "Hand-drawn metroidvania." },
  { appId: 1145350, title: "Hades II",                    category: "Indie",       blurb: "Supergiant returns to the underworld." },
  { appId: 2379780, title: "Balatro",                     category: "Indie",       blurb: "Poker-roguelike phenomenon." },
  { appId: 1086940, title: "Pizza Tower",                 category: "Indie",       blurb: "Cartoon platformer chaos." },
  { appId: 244210,  title: "Assetto Corsa",               category: "Racing",      blurb: "The sim-racer's sim-racer." },
  { appId: 244850,  title: "Forza Horizon 5",             category: "Racing",      blurb: "Open-world arcade Mexico." },
  { appId: 1551360, title: "BeamNG.drive",                category: "Simulation",  blurb: "Soft-body car physics sandbox." },
  { appId: 294100,  title: "RimWorld",                    category: "Strategy",    blurb: "Story-driven colony sim." },
  { appId: 945360,  title: "Among Us",                    category: "Multiplayer", blurb: "Crewmates vs impostors." },
  { appId: 322170,  title: "Geometry Dash",               category: "Indie",       blurb: "Rhythm-platformer perfection." },
];

export function steamCover(appId: number) {
  // Cloudflare-fronted Steam CDN — CORS open.
  return `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${appId}/header.jpg`;
}

export function steamUrl(appId: number) {
  return `https://store.steampowered.com/app/${appId}/`;
}

export function hydraDeepLink(appId: number, title: string) {
  // Hydra Launcher supports custom URL scheme for game lookup.
  return `hydralauncher://library/search?q=${encodeURIComponent(title)}&objectId=${appId}`;
}