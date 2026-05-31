## Multi-tab Emulator with Switch options

Turn the current placeholder `/emulator` route into a real emulator hub with **three tabs**, each handling a different gaming domain.

### Tabs

**1. Retro (EmulatorJS) — actually works**
- Add `emulatorjs` via CDN (`cdn.emulatorjs.org`) inside an embedded iframe page (`public/emujs.html`).
- Supports NES, SNES, N64, GBA, GB/GBC, Sega Genesis, PS1, NDS, Atari.
- Two ways to load games:
  - **Upload ROM** (file input — stays local, never uploaded anywhere).
  - **Built-in homebrew library** — a curated list of legally-free homebrew ROMs (e.g. Alex the Allegator, Pacman clones) hosted on archive.org so the user has something playable instantly.
- Console picker dropdown + fullscreen + gamepad support (EmulatorJS handles all of this).

**2. Switch · Cloud (Afterplay.io)**
- Embed `https://afterplay.io` in a sandboxed iframe.
- Banner above the iframe explaining: cloud-streamed, requires their account, Switch tier may be paid.
- "Open in new tab" fallback button in case afterplay blocks iframing via `X-Frame-Options` (likely — we'll detect the load failure and surface the fallback automatically).

**3. Switch · Experimental (Vela)**
- Embed Vela's hosted web build (the project's GitHub Pages deployment) in an iframe.
- Clear "alpha — most commercial games will not run" warning banner.
- Same iframe-blocked fallback to open externally.

### UI

- Tabs styled with the same `liquid-glass-themed` look used in PolarisFlix's nav, accent-colored active state.
- Each tab fills the remaining viewport below the tab bar.
- Hidden dock (`<AppShell hideDock>` like the AI route) so the emulator gets full screen.

### Files

- **edit** `src/routes/emulator.tsx` — replace `ComingSoon` with a new `<Emulator />` component that manages the 3 tabs.
- **create** `src/components/polaris/emulator/Emulator.tsx` — tab shell + the three panes.
- **create** `src/components/polaris/emulator/RetroPane.tsx` — console picker, ROM upload, homebrew library, iframe to `/emujs.html`.
- **create** `src/components/polaris/emulator/CloudPane.tsx` — Afterplay iframe + fallback.
- **create** `src/components/polaris/emulator/VelaPane.tsx` — Vela iframe + warning + fallback.
- **create** `public/emujs.html` — minimal HTML page that boots EmulatorJS from CDN and reads the chosen core + ROM URL from query params (`?core=snes&rom=...`). This is needed because EmulatorJS expects to control the whole document.
- **create** `src/lib/homebrew-roms.ts` — small curated list (name, console, archive.org URL, cover).

### Honest expectations to set in UI

- Retro tab: "Fully works in your browser. Upload your own ROMs or pick from the homebrew library."
- Cloud Switch tab: "Streamed from Afterplay's servers. Sign-in required; Switch may need a paid tier."
- Experimental Switch tab: "Open-source WebGPU emulator. Most commercial games won't boot yet — this is for testing."

No backend changes, no new dependencies installed (EmulatorJS loads from CDN inside the public HTML page, so it doesn't pollute the React bundle).