export type Wallpaper = {
  id: string;
  name: string;
  src: string;
  type: "static" | "animated";
  /** RGB triplet string used for --polaris-accent */
  accent: string;
  poster?: string;
};

// NOTE: Motionbgs.com hotlink URLs follow `https://motionbgs.com/media/<id>/<slug>.<ext>`.
// Some may be blocked by referrer protection; gradient fallback keeps UI intact.
export const WALLPAPERS: Wallpaper[] = [
  { id: "marshland", name: "Marshland", type: "animated", accent: "240 180 110",
    src: "https://motionbgs.com/media/8228/marshland.960x540.mp4" },
  { id: "pokemon-sakura", name: "Pokemon Near Pink Sakura Tree", type: "animated", accent: "255 170 200",
    src: "https://motionbgs.com/media/7193/pokemon-near-pink-sakura-tree.960x540.mp4" },
  { id: "rocks-autumn-fire", name: "Rocks Glow With Autumn Fire", type: "animated", accent: "255 140 60",
    src: "https://motionbgs.com/media/6822/rocks-glow-with-autumn-fire.960x540.mp4" },
  { id: "gojo-manga", name: "Gojo Manga", type: "animated", accent: "180 200 255",
    src: "https://motionbgs.com/media/6730/gojo-manga.960x540.mp4" },
  { id: "forest-sunset", name: "Forest Sunset", type: "animated", accent: "255 160 80",
    src: "https://motionbgs.com/media/6541/forest-sunset.960x540.mp4" },
  { id: "mountain-autumn", name: "Mountain Landscape in Autumn", type: "animated", accent: "230 150 70",
    src: "https://motionbgs.com/media/8123/mountain-landscape-in-autumn.960x540.mp4" },
  { id: "first-fall-day", name: "First Fall Day in Forest", type: "animated", accent: "220 160 90",
    src: "https://motionbgs.com/media/7980/first-fall-day-in-forest.960x540.mp4" },
  { id: "audi-frozen-lake", name: "Audi On Frozen Lake", type: "animated", accent: "150 200 240",
    src: "https://motionbgs.com/media/7521/audi-on-frozen-lake.960x540.mp4" },
  { id: "fish-tank", name: "Fish Tank", type: "animated", accent: "120 200 220",
    src: "https://motionbgs.com/media/5421/fish-tank.960x540.mp4" },
  { id: "girl-beach-night", name: "Girl on the Beach at Night", type: "animated", accent: "140 160 230",
    src: "https://motionbgs.com/media/6125/girl-on-the-beach-at-night.960x540.mp4" },
  { id: "colorful-sunset-street", name: "Colorful Sunset on Street", type: "animated", accent: "255 140 110",
    src: "https://motionbgs.com/media/7011/colorful-sunset-on-the-street.960x540.mp4" },
  { id: "golden-temple", name: "Golden Temple", type: "animated", accent: "240 190 90",
    src: "https://motionbgs.com/media/6312/golden-temple.960x540.mp4" },
  { id: "rainy-street-mirror", name: "Rainy Street Mirror", type: "animated", accent: "180 160 220",
    src: "https://motionbgs.com/media/6803/rainy-street-mirror.960x540.mp4" },
  { id: "sakura-smoke", name: "Sakura and Smoke", type: "animated", accent: "240 170 200",
    src: "https://motionbgs.com/media/7402/sakura-and-smoke.960x540.mp4" },
  { id: "audi-r8-sakura", name: "Audi R8 Near Sakura", type: "animated", accent: "230 160 190",
    src: "https://motionbgs.com/media/7610/audi-r8-near-sakura.960x540.mp4" },
  { id: "minecraft-northern-light", name: "Minecraft Northern Light", type: "animated", accent: "120 220 200",
    src: "https://motionbgs.com/media/7820/minecraft-northern-light.960x540.mp4" },
  { id: "portal-minecraft", name: "Portal in Minecraft", type: "animated", accent: "200 130 240",
    src: "https://motionbgs.com/media/7821/portal-in-minecraft.960x540.mp4" },
  { id: "minecraft-snowy-campfire", name: "Minecraft Snowy Campfire", type: "animated", accent: "255 170 90",
    src: "https://motionbgs.com/media/7822/minecraft-snowy-campfire.960x540.mp4" },
  { id: "minecraft-sunset-farm", name: "Minecraft Sunset Farm", type: "animated", accent: "250 160 100",
    src: "https://motionbgs.com/media/7823/minecraft-sunset-farm.960x540.mp4" },
  { id: "minecraft-panels", name: "Minecraft Panels", type: "animated", accent: "150 200 130",
    src: "https://motionbgs.com/media/7824/minecraft-panels.960x540.mp4" },
  { id: "crimson-blind-faith", name: "Crimson Blind Faith", type: "animated", accent: "230 80 90",
    src: "https://motionbgs.com/media/7825/crimson-blind-faith.960x540.mp4" },
];

export const DEFAULT_WALLPAPER_ID = "rocks-autumn-fire";