export type Wallpaper = {
  id: string;
  name: string;
  src: string;
  type: "static" | "animated";
  /** RGB triplet string used for --polaris-accent */
  accent: string;
  poster?: string;
};

// Real motionbgs.com sources. Hotlinking works (no referrer check, CORS-open).
const MB = "https://motionbgs.com";
const wp = (id: number, slug: string, posterPath: string, accent: string, name: string): Wallpaper => ({
  id: slug,
  name,
  type: "animated",
  accent,
  src: `${MB}/media/${id}/${slug}.960x540.mp4`,
  poster: `${MB}${posterPath}`,
});

export const WALLPAPERS: Wallpaper[] = [
  wp(5780, "marshland",                       "/i/c/960x540/media/5780/marshland.jpg",                                "180 210 130", "Marshland"),
  wp(1554, "pink-sakura-tree",                "/i/c/960x540/media/1554/pink-sakura-tree.jpg",                         "255 170 200", "Pokemon Near Pink Sakura Tree"),
  wp(7623, "rocks-glow-with-autumn-fire",     "/i/c/960x540/media/7623/rocks-glow-with-autumn-fire.3840x2160.jpg",    "255 140 60",  "Rocks Glow With Autumn Fire"),
  wp(6267, "gojo-manga",                      "/i/c/960x540/media/6267/gojo-manga.jpg",                               "180 200 255", "Gojo Manga"),
  wp(4295, "forest-sunset",                   "/i/c/960x540/media/4295/forest-sunset.jpg",                            "255 160 80",  "Forest Sunset"),
  wp(758,  "mountain-landscape-in-autumn",    "/i/c/960x540/media/758/mountain-landscape-in-autumn.jpg",              "230 150 70",  "Mountain Landscape in Autumn"),
  wp(1922, "first-fall-day-in-forest",        "/i/c/960x540/media/1922/first-fall-day-in-forest.jpg",                 "220 160 90",  "First Fall Day in Forest"),
  wp(8677, "audi-on-frozen-lake",             "/i/c/960x540/media/8677/audi-on-frozen-lake.3840x2160.jpg",            "150 200 240", "Audi On Frozen Lake"),
  wp(5991, "fish-tank",                       "/i/c/960x540/media/5991/fish-tank.jpg",                                "120 200 220", "Fish Tank"),
  wp(2344, "girl-on-the-beach-at-night",      "/i/c/960x540/media/2344/girl-on-the-beach-at-night.jpg",               "140 160 230", "Girl on the Beach at Night"),
  wp(3624, "colorful-sunset-on-street",       "/i/c/960x540/media/3624/colorful-sunset-on-street.jpg",                "255 140 110", "Colorful Sunset on Street"),
  wp(5764, "golden-temple-ghost-of-tsushima", "/i/c/960x540/media/5764/golden-temple-ghost-of-tsushima.jpg",          "240 190 90",  "Golden Temple"),
  wp(8470, "rainy-street-mirror",             "/i/c/960x540/media/8470/rainy-street-mirror.3840x2160.jpg",            "180 160 220", "Rainy Street Mirror"),
  wp(91,   "sakura-and-smoke",                "/i/c/960x540/media/91/sakura-and-smoke.1920x1080.jpg",                 "240 170 200", "Sakura and Smoke"),
  wp(1081, "audi-r8-near-sakura",             "/i/c/960x540/media/1081/audi-r8-near-sakura.jpg",                      "230 160 190", "Audi R8 Near Sakura"),
  wp(9360, "minecraft-northern-light",        "/i/c/960x540/media/9360/minecraft-northern-light.3840x2160.jpg",       "120 220 200", "Minecraft Northern Light"),
  wp(1054, "portal-in-minecraft",             "/i/c/960x540/media/1054/portal-in-minecraft.jpg",                      "200 130 240", "Portal in Minecraft"),
  wp(9268, "minecraft-snowy-campfire",        "/i/c/960x540/media/9268/minecraft-snowy-campfire.3840x2160.jpg",       "255 170 90",  "Minecraft Snowy Campfire"),
  wp(9266, "minecraft-sunset-farm",           "/i/c/960x540/media/9266/minecraft-sunset-farm.3840x2160.jpg",          "250 160 100", "Minecraft Sunset Farm"),
  wp(4776, "minecraft-panels",                "/i/c/960x540/media/4776/minecraft-panels.jpg",                         "150 200 130", "Minecraft Panels"),
  wp(9570, "crimson-blind-faith",             "/i/c/960x540/media/9570/crimson-blind-faith.3840x2160.jpg",            "230 80 90",   "Crimson Blind Faith"),
];

export const DEFAULT_WALLPAPER_ID = "rocks-glow-with-autumn-fire";