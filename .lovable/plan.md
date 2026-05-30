## Goals
1. Wallpapers actually load (current motionbgs.com hotlinks are referrer-blocked → black screen).
2. Shortcut grid feels breathable like the reference (bigger cards, more spacing, fewer per row).
3. Remove the waving-hand emoji from the welcome header.
4. Polish the overall feel: smoother transitions, softer glass, cleaner header.

## 1. Fix wallpapers (root cause of "wallpapers don't work")
`motionbgs.com/media/...mp4` blocks hotlinking, so `<video>` shows nothing and we fall through to the dark base. Two-part fix:

- **Replace sources** with directly-embeddable assets. Best candidates that match the requested moods:
  - Use Pexels / Coverr-hosted CDN MP4s (no referrer protection, CORS-open) for cinematic animated backgrounds (autumn forest, sakura, rainy street, snowy campfire, sunset, ocean, etc.).
  - For Minecraft / anime-specific scenes where free animated equivalents don't exist, fall back to high-quality static images from Unsplash (`images.unsplash.com`) with the same warm/cool accent token.
- Add a `poster` (first-frame JPG from same CDN) so something paints instantly while the video buffers — kills the "black screen" feel.
- Add a graceful fallback: if `<video onError>` fires, swap to a CSS gradient using the wallpaper's accent so the UI never goes empty.
- Keep the existing `accent` RGB system; just retune values to match the new imagery.
- Keep the exact naming the user asked for (Marshland, Rocks Glow With Autumn Fire, Sakura and Smoke, etc.) — only the underlying `src` changes.

The user-facing list stays the autumn/sakura/Minecraft/Audi set; we just guarantee each one renders.

## 2. Shortcut grid spacing (the "mashed up" complaint)
Reference shows ~3 cards per row with generous gutters and tall cards. Current grid jumps to 5 columns and uses `gap-3`. Changes in `Home.tsx`:

- Grid: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` (cap at 4, not 5).
- Gap: `gap-5 md:gap-6`.
- Card aspect: slightly taller (`aspect-[5/6]`), larger icon tile (h-16 w-16), bigger label, more padding (`p-5`).
- Reduce the shortcut count shown per category so rows feel intentional, not crammed.

## 3. Header polish
- Remove the 👋 emoji span entirely.
- Keep "Welcome back / Player · Polaris One" but tighten typography and align logo to the right cleanly.
- No emojis anywhere else (audit Sidebar + ComingSoon — currently clean, just verify).

## 4. Smoother feel
- Wallpaper layer: add a `transition-opacity duration-500` crossfade when switching wallpapers (double-buffer two `<video>` layers).
- Cards: replace inline `onMouseEnter` box-shadow swap with a CSS `:hover` rule via a utility class so it animates with the existing `transition`.
- Category chips: add `transition-all duration-200` and a subtle scale on active.
- Sidebar active pill: ease-in-out glow.
- Slightly stronger backdrop blur on `.glass` (`backdrop-blur-2xl`) and a hair more bg opacity so cards read against bright autumn frames like the reference.

## Files touched
- `src/lib/wallpapers.ts` — new working URLs + posters + retuned accents.
- `src/components/polaris/WallpaperLayer.tsx` — double-buffered crossfade + onError gradient fallback.
- `src/components/polaris/Home.tsx` — grid spacing, card sizing, remove emoji, hover via CSS.
- `src/styles.css` — tighten `.glass`, add `.shortcut-card` hover utility, smooth transitions.

## Out of scope
- Sidebar restructure, new routes, scramjet wiring, auth — untouched.
- No new dependencies.
