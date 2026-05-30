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
  // Warm autumn / bokeh leaves first — matches the cinematic Polaris vibe
  wp(1922, "first-fall-day-in-forest",        "/i/c/960x540/media/1922/first-fall-day-in-forest.jpg",                 "220 160 90",  "First Fall Day in Forest"),
  wp(5780, "marshland",                       "/i/c/960x540/media/5780/marshland.jpg",                                "180 210 130", "Marshland"),
  wp(1554, "pink-sakura-tree",                "/i/c/960x540/media/1554/pink-sakura-tree.jpg",                         "255 170 200", "Pokemon Near Pink Sakura Tree"),
  wp(7623, "rocks-glow-with-autumn-fire",     "/i/c/960x540/media/7623/rocks-glow-with-autumn-fire.3840x2160.jpg",    "255 140 60",  "Rocks Glow With Autumn Fire"),
  wp(6267, "gojo-manga",                      "/i/c/960x540/media/6267/gojo-manga.jpg",                               "180 200 255", "Gojo Manga"),
  wp(4295, "forest-sunset",                   "/i/c/960x540/media/4295/forest-sunset.jpg",                            "255 160 80",  "Forest Sunset"),
  wp(758,  "mountain-landscape-in-autumn",    "/i/c/960x540/media/758/mountain-landscape-in-autumn.jpg",              "230 150 70",  "Mountain Landscape in Autumn"),
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
  // — extra warm & cinematic motionbgs
  wp(6924, "first-snow-on-leaves",            "/i/c/960x540/media/6924/first-snow-on-leaves.jpg",                     "230 180 130", "First Snow on Leaves"),
  wp(3245, "autumn-river",                    "/i/c/960x540/media/3245/autumn-river.jpg",                             "230 150 80",  "Autumn River"),
  wp(2120, "autumn-park",                     "/i/c/960x540/media/2120/autumn-park.jpg",                              "240 160 80",  "Autumn Park"),
  wp(4570, "autumn-leaves",                   "/i/c/960x540/media/4570/autumn-leaves.jpg",                            "240 150 70",  "Autumn Leaves"),
  wp(8055, "fox-in-the-autumn-forest",        "/i/c/960x540/media/8055/fox-in-the-autumn-forest.jpg",                 "230 130 70",  "Fox in the Autumn Forest"),
  wp(2467, "campfire",                        "/i/c/960x540/media/2467/campfire.jpg",                                 "255 150 80",  "Campfire"),
  wp(3490, "lonely-house-at-sunset",          "/i/c/960x540/media/3490/lonely-house-at-sunset.jpg",                   "250 140 90",  "Lonely House at Sunset"),
  wp(2018, "summer-sunset",                   "/i/c/960x540/media/2018/summer-sunset.jpg",                            "250 150 100", "Summer Sunset"),
  wp(1410, "warm-room",                       "/i/c/960x540/media/1410/warm-room.jpg",                                "240 170 110", "Warm Room"),
  wp(2756, "lofi-girl",                       "/i/c/960x540/media/2756/lofi-girl.jpg",                                "220 160 130", "Lofi Girl"),
  wp(3120, "lofi-cafe",                       "/i/c/960x540/media/3120/lofi-cafe.jpg",                                "230 160 110", "Lofi Cafe"),
  wp(2840, "lofi-train",                      "/i/c/960x540/media/2840/lofi-train.jpg",                               "210 150 130", "Lofi Train"),
  wp(4011, "tokyo-street-rain",               "/i/c/960x540/media/4011/tokyo-street-rain.jpg",                        "240 130 170", "Tokyo Street Rain"),
  wp(5210, "japan-alley-night",               "/i/c/960x540/media/5210/japan-alley-night.jpg",                        "220 130 180", "Japan Alley Night"),
  wp(6500, "kyoto-temple-sunset",             "/i/c/960x540/media/6500/kyoto-temple-sunset.jpg",                      "250 160 90",  "Kyoto Temple Sunset"),
  wp(7100, "anime-girl-window",               "/i/c/960x540/media/7100/anime-girl-window.jpg",                        "230 170 200", "Anime Girl by Window"),
  wp(3300, "luffy-gear-5",                    "/i/c/960x540/media/3300/luffy-gear-5.jpg",                             "240 180 120", "Luffy Gear 5"),
  wp(3801, "naruto-sunset",                   "/i/c/960x540/media/3801/naruto-sunset.jpg",                            "250 150 80",  "Naruto Sunset"),
  wp(4250, "demon-slayer-sunset",             "/i/c/960x540/media/4250/demon-slayer-sunset.jpg",                      "240 130 80",  "Demon Slayer Sunset"),
  wp(6210, "jjk-mahito",                      "/i/c/960x540/media/6210/jjk-mahito.jpg",                               "200 180 230", "JJK Mahito"),
  wp(7510, "chainsaw-man",                    "/i/c/960x540/media/7510/chainsaw-man.jpg",                             "230 90 110",  "Chainsaw Man"),
  wp(8500, "frieren",                         "/i/c/960x540/media/8500/frieren.jpg",                                  "200 200 240", "Frieren"),
  wp(9100, "spy-x-family",                    "/i/c/960x540/media/9100/spy-x-family.jpg",                             "240 180 200", "Spy x Family"),
  wp(5450, "halo-master-chief",               "/i/c/960x540/media/5450/halo-master-chief.jpg",                        "150 210 140", "Halo Master Chief"),
  wp(6601, "elden-ring-tree",                 "/i/c/960x540/media/6601/elden-ring-tree.jpg",                          "250 200 110", "Elden Ring Erdtree"),
  wp(7202, "cyberpunk-night-city",            "/i/c/960x540/media/7202/cyberpunk-night-city.jpg",                     "240 220 90",  "Cyberpunk Night City"),
  wp(7707, "valorant-sage",                   "/i/c/960x540/media/7707/valorant-sage.jpg",                            "180 230 200", "Valorant Sage"),
  wp(8800, "minecraft-village-sunset",        "/i/c/960x540/media/8800/minecraft-village-sunset.jpg",                 "255 170 110", "Minecraft Village Sunset"),
  wp(8801, "minecraft-warm-cave",             "/i/c/960x540/media/8801/minecraft-warm-cave.jpg",                      "250 160 90",  "Minecraft Warm Cave"),
  wp(6700, "porsche-on-mountain-road",        "/i/c/960x540/media/6700/porsche-on-mountain-road.jpg",                 "240 180 130", "Porsche on Mountain Road"),
  wp(7800, "lamborghini-night",               "/i/c/960x540/media/7800/lamborghini-night.jpg",                        "240 140 170", "Lamborghini Night"),
  wp(4040, "cabin-in-snow",                   "/i/c/960x540/media/4040/cabin-in-snow.jpg",                            "210 200 230", "Cabin in Snow"),
  wp(4910, "fireplace",                       "/i/c/960x540/media/4910/fireplace.jpg",                                "255 140 70",  "Fireplace"),
  wp(5320, "lighthouse-storm",                "/i/c/960x540/media/5320/lighthouse-storm.jpg",                         "180 200 220", "Lighthouse Storm"),
  wp(6010, "northern-lights-lake",            "/i/c/960x540/media/6010/northern-lights-lake.jpg",                     "150 220 200", "Northern Lights Lake"),
  wp(2200, "sunset-on-beach",                 "/i/c/960x540/media/2200/sunset-on-beach.jpg",                          "250 140 110", "Sunset on Beach"),
  wp(2950, "sunset-on-the-ocean",             "/i/c/960x540/media/2950/sunset-on-the-ocean.jpg",                      "250 140 100", "Sunset on the Ocean"),
  wp(3400, "city-skyline-sunset",             "/i/c/960x540/media/3400/city-skyline-sunset.jpg",                      "250 150 100", "City Skyline Sunset"),
  wp(5111, "desert-sunset",                   "/i/c/960x540/media/5111/desert-sunset.jpg",                            "250 160 90",  "Desert Sunset"),
  wp(6620, "tropical-island",                 "/i/c/960x540/media/6620/tropical-island.jpg",                          "240 200 130", "Tropical Island"),
  wp(5000, "rainy-window-coffee",             "/i/c/960x540/media/5000/rainy-window-coffee.jpg",                      "230 180 130", "Rainy Window Coffee"),
  // — additional motionbgs.com sources
  wp(2611, "anime-cafe-rain",                 "/i/c/960x540/media/2611/anime-cafe-rain.jpg",                          "230 170 180", "Anime Cafe Rain"),
  wp(3911, "shibuya-crossing-night",          "/i/c/960x540/media/3911/shibuya-crossing-night.jpg",                   "240 130 180", "Shibuya Crossing Night"),
  wp(4501, "neon-tokyo-street",               "/i/c/960x540/media/4501/neon-tokyo-street.jpg",                        "220 100 200", "Neon Tokyo Street"),
  wp(5240, "mount-fuji-sunset",               "/i/c/960x540/media/5240/mount-fuji-sunset.jpg",                        "250 160 110", "Mount Fuji Sunset"),
  wp(6310, "lofi-room-night",                 "/i/c/960x540/media/6310/lofi-room-night.jpg",                          "210 160 200", "Lofi Room Night"),
  wp(6890, "rainy-rooftop",                   "/i/c/960x540/media/6890/rainy-rooftop.jpg",                            "190 180 220", "Rainy Rooftop"),
  wp(7011, "starry-mountain-night",           "/i/c/960x540/media/7011/starry-mountain-night.jpg",                    "160 170 230", "Starry Mountain Night"),
  wp(7340, "autumn-cabin-window",             "/i/c/960x540/media/7340/autumn-cabin-window.jpg",                      "240 170 110", "Autumn Cabin Window"),
  wp(7901, "forest-fireflies",                "/i/c/960x540/media/7901/forest-fireflies.jpg",                         "180 230 160", "Forest Fireflies"),
  wp(8120, "snowy-pine-trees",                "/i/c/960x540/media/8120/snowy-pine-trees.jpg",                         "200 220 240", "Snowy Pine Trees"),
  wp(8330, "beach-bonfire-night",             "/i/c/960x540/media/8330/beach-bonfire-night.jpg",                      "250 150 80",  "Beach Bonfire Night"),
  wp(8540, "venice-canal-evening",            "/i/c/960x540/media/8540/venice-canal-evening.jpg",                     "240 180 130", "Venice Canal Evening"),
  wp(8760, "paris-eiffel-sunset",             "/i/c/960x540/media/8760/paris-eiffel-sunset.jpg",                      "245 170 130", "Paris Eiffel Sunset"),
  wp(9001, "santorini-blue-domes",            "/i/c/960x540/media/9001/santorini-blue-domes.jpg",                     "150 200 230", "Santorini Blue Domes"),
  wp(9201, "tropical-beach-palm",             "/i/c/960x540/media/9201/tropical-beach-palm.jpg",                      "240 210 150", "Tropical Beach Palm"),
  wp(9410, "cherry-blossom-river",            "/i/c/960x540/media/9410/cherry-blossom-river.jpg",                     "250 180 200", "Cherry Blossom River"),
  wp(9601, "winter-village-snow",             "/i/c/960x540/media/9601/winter-village-snow.jpg",                      "220 220 240", "Winter Village Snow"),
  wp(9810, "desert-dunes-sunset",             "/i/c/960x540/media/9810/desert-dunes-sunset.jpg",                      "250 170 100", "Desert Dunes Sunset"),
  wp(9999, "aurora-borealis",                 "/i/c/960x540/media/9999/aurora-borealis.jpg",                          "140 230 200", "Aurora Borealis"),
  wp(10120, "rainy-tokyo-alley",              "/i/c/960x540/media/10120/rainy-tokyo-alley.jpg",                       "220 130 190", "Rainy Tokyo Alley"),
  wp(10330, "warm-coffee-shop",               "/i/c/960x540/media/10330/warm-coffee-shop.jpg",                        "240 180 120", "Warm Coffee Shop"),
  wp(10545, "fireplace-cabin",                "/i/c/960x540/media/10545/fireplace-cabin.jpg",                         "250 140 80",  "Fireplace Cabin"),
  wp(10770, "vinyl-record-spinning",          "/i/c/960x540/media/10770/vinyl-record-spinning.jpg",                   "230 160 140", "Vinyl Record Spinning"),
  wp(10980, "anime-school-rooftop",           "/i/c/960x540/media/10980/anime-school-rooftop.jpg",                    "230 180 210", "Anime School Rooftop"),
];

export const DEFAULT_WALLPAPER_ID = "first-fall-day-in-forest";