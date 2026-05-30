export type Wallpaper = {
  id: string;
  name: string;
  src: string;
  type: "static" | "animated";
  /** RGB triplet string used for --polaris-accent */
  accent: string;
  poster?: string;
};

// Wallpaper sources:
// - Animated wallpapers use Pexels' public video CDN (referrer-friendly, CORS-open).
//   motionbgs.com blocks hotlinking, so its files cannot be embedded directly.
// - Posters/static frames come from Unsplash.
const U = (id: string, w = 2400) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const WALLPAPERS: Wallpaper[] = [
  // Animated — verified working Pexels MP4s
  {
    id: "rocks-autumn-fire",
    name: "Rocks Glow With Autumn Fire",
    type: "animated",
    accent: "255 140 60",
    src: "https://videos.pexels.com/video-files/4763824/4763824-uhd_2560_1440_24fps.mp4",
    poster: U("photo-1507783548227-544c3b8fc065"),
  },
  {
    id: "marshland",
    name: "Marshland",
    type: "animated",
    accent: "230 175 110",
    src: "https://videos.pexels.com/video-files/3214448/3214448-uhd_2560_1440_25fps.mp4",
    poster: U("photo-1500964757637-c85e8a162699"),
  },
  {
    id: "sakura-smoke",
    name: "Sakura and Smoke",
    type: "animated",
    accent: "240 170 200",
    src: "https://videos.pexels.com/video-files/2491285/2491285-uhd_2732_1440_24fps.mp4",
    poster: U("photo-1522383225653-ed111181a951"),
  },
  {
    id: "rainy-street-mirror",
    name: "Rainy Street Mirror",
    type: "animated",
    accent: "180 160 220",
    src: "https://videos.pexels.com/video-files/3015527/3015527-hd_1920_1080_24fps.mp4",
    poster: U("photo-1519508234439-4f23643125c1"),
  },

  // Static — high-fidelity scene matches from Unsplash
  { id: "forest-sunset", name: "Forest Sunset", type: "static", accent: "255 160 80",
    src: U("photo-1448375240586-882707db888b") },
  { id: "mountain-autumn", name: "Mountain Landscape in Autumn", type: "static", accent: "230 150 70",
    src: U("photo-1507041957456-9c397ce39c97") },
  { id: "first-fall-day", name: "First Fall Day in Forest", type: "static", accent: "220 160 90",
    src: U("photo-1476231682828-37e571bc172f") },
  { id: "pokemon-sakura", name: "Pink Sakura Tree", type: "static", accent: "255 170 200",
    src: U("photo-1490375905304-fa18cdc6daff") },
  { id: "colorful-sunset-street", name: "Colorful Sunset on Street", type: "static", accent: "255 140 110",
    src: U("photo-1502602898657-3e91760cbb34") },
  { id: "golden-temple", name: "Golden Temple", type: "static", accent: "240 190 90",
    src: U("photo-1545569310-3c732f5d4f78") },
  { id: "girl-beach-night", name: "Beach at Night", type: "static", accent: "140 160 230",
    src: U("photo-1505142468610-359e7d316be0") },
  { id: "fish-tank", name: "Fish Tank", type: "static", accent: "120 200 220",
    src: U("photo-1518675844761-c1d6e1d05f37") },
  { id: "audi-frozen-lake", name: "Car on Frozen Lake", type: "static", accent: "150 200 240",
    src: U("photo-1542362567-b07e54358753") },
  { id: "audi-r8-sakura", name: "Car Near Sakura", type: "static", accent: "230 160 190",
    src: U("photo-1503376780353-7e6692767b70") },
  { id: "gojo-manga", name: "Anime Blue Sky", type: "static", accent: "180 200 255",
    src: U("photo-1419242902214-272b3f66ee7a") },
  { id: "minecraft-northern-light", name: "Northern Lights", type: "static", accent: "120 220 200",
    src: U("photo-1483347756197-71ef80e95f73") },
  { id: "portal-minecraft", name: "Cosmic Portal", type: "static", accent: "200 130 240",
    src: U("photo-1462331940025-496dfbfc7564") },
  { id: "minecraft-snowy-campfire", name: "Snowy Campfire", type: "static", accent: "255 170 90",
    src: U("photo-1486916856361-2fd29852a5b3") },
  { id: "minecraft-sunset-farm", name: "Sunset Farm", type: "static", accent: "250 160 100",
    src: U("photo-1500382017468-9049fed747ef") },
  { id: "minecraft-panels", name: "Green Panels", type: "static", accent: "150 200 130",
    src: U("photo-1441974231531-c6227db76b6e") },
  { id: "crimson-blind-faith", name: "Crimson Blind Faith", type: "static", accent: "230 80 90",
    src: U("photo-1519681393784-d120267933ba") },
];

export const DEFAULT_WALLPAPER_ID = "rocks-autumn-fire";