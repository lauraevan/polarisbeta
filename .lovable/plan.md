
## Polaris One — Web OS Hub (v1)

A premium, full-screen dashboard inspired by the reference shot: dark glass sidebar, cinematic wallpaper background, translucent cards, warm amber + Polaris-blue accents. Only the Home page is wired up; other nav items render "Coming soon" placeholders.

### Layout

```
┌────────────┬──────────────────────────────────────────┐
│  [P] logo  │  👋 Welcome back            [P]          │
│            │                                          │
│ ● Home     │  ┌──────────────────────────────────┐    │
│   Games    │  │ 🔍 Search or type a URL…         │    │
│   Media    │  └──────────────────────────────────┘    │
│   Apps     │  ┌──────────────────────────────────┐    │
│   AI Tools │  │ ⌘  Quickly navigate…             │    │
│   Emulator │  └──────────────────────────────────┘    │
│   Chat     │                                          │
│            │  [Popular][Games][AI][Websites][Media]…  │
│            │                                          │
│            │  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐     │
│            │  │ YT │ │Redd│ │Goog│ │Tik │ │ IG │     │
│            │  └────┘ └────┘ └────┘ └────┘ └────┘     │
│            │  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐     │
│            │  │Spot│ │Disc│ │Gemi│ │GPT │ │Robl│     │
│            │  └────┘ └────┘ └────┘ └────┘ └────┘     │
│ Profile    │                                          │
│ Logout     │                          [🖼 Wallpaper] │
│ 🎮 🏆 🌙 🖥 │                                          │
└────────────┴──────────────────────────────────────────┘
```

### Pages / routes
- `/` — Home dashboard (built now)
- `/games`, `/media`, `/apps`, `/ai`, `/emulator`, `/chat` — minimal "Coming soon" pages sharing the same shell

### Wallpaper system
- Floating wallpaper picker button (bottom-right) opens a glass panel with thumbnails grouped Static / Animated.
- Each wallpaper carries an `accent` token (warm amber, copper, sakura pink, icy polaris-blue, forest green, etc.). Selecting a wallpaper updates a CSS variable `--accent` that re-tints sidebar highlights, chip glow, card hover rings, and the logo halo — so the theme shifts with the background.
- Wallpaper list (sourced from motionbgs.com URLs):
  - Marshland, Pokemon Near Pink Sakura Tree, Rocks Glow With Autumn Fire, Gojo Manga, Forest Sunset, Mountain Landscape in Autumn, First Fall Day in Forest, Audi On Frozen Lake, Fish Tank, Girl on the Beach at Night, Colorful Sunset on Street, Golden Temple, Rainy Street Mirror, Sakura and Smoke, Audi R8 Near Sakura, Minecraft Northern Light, Portal in Minecraft, Minecraft Snowy Campfire, Minecraft Sunset Farm, Minecraft Panels, Crimson Blind Faith
- Animated wallpapers render via `<video autoplay muted loop playsinline>`; static ones via `<img>`. Choice persists to `localStorage`.

### Visual system (added to `src/styles.css`)
- Base: deep navy `oklch(0.18 0.04 260)` + near-black glass surfaces
- Warm tokens: amber `oklch(0.78 0.16 65)`, copper `oklch(0.62 0.13 50)`, soft gold
- Cool accent: polaris-blue `oklch(0.72 0.14 230)`
- `--accent` (dynamic, set per wallpaper) drives glow rings, active nav pill, chip highlight
- Glass surfaces: `backdrop-blur-xl` + `bg-white/5` + subtle inner border `border-white/10`
- Active sidebar item: amber pill with soft outer glow (`box-shadow: 0 0 24px var(--accent)/40`)

### Components
- `AppShell` — sidebar + main area, supplies wallpaper background layer
- `Sidebar` — logo, nav list (lucide icons), bottom Profile/Logout + 4 mini icons
- `WallpaperLayer` — fixed full-screen img/video with darkening gradient
- `WallpaperPicker` — floating button + sheet/grid
- `SearchBar`, `CommandBar` — large rounded glass inputs (non-functional placeholders, ready for scramjet later)
- `CategoryChips` — horizontal scroll, active chip uses `--accent`
- `ShortcutGrid` + `ShortcutCard` — uses official brand favicons (`https://www.google.com/s2/favicons?domain=…&sz=128`) so we don't ship logo assets

### Technical notes
- Logo: copy uploaded `CC7DAE42-…png` → `src/assets/polaris-logo.png`, import as ES module
- Wallpaper URLs: stored in `src/lib/wallpapers.ts` as `{ id, name, src, type: 'static'|'animated', accent }`. URLs will be Motionbgs CDN links; if any fail to hotlink we can swap to a proxy later
- Theme switching via `document.documentElement.style.setProperty('--accent', …)` in a small `useWallpaper` hook backed by `localStorage`
- All nav routes created so `<Link>` typechecks; placeholder routes render shared shell with "Coming soon" card
- Mobile: sidebar collapses behind a hamburger (project preview is 390px); cards reflow to 2 columns

### Out of scope (per user)
- Scramjet proxy wiring (search bars are visual only)
- Real content/functionality for Games/Media/Apps/AI/Emulator/Chat
- Auth / Profile logic
