
This is a large update. I'll ship it in 3 phases so each piece is reviewable and the preview never stays broken. Confirm or tweak before I start.

## Phase 1 — Foundation (the boring but critical stuff)

**Database (Lovable Cloud)**
New tables to power the economy:
- `user_wallet` — `user_id`, `coins`, `basic_credits`, `premium_credits`
- `user_inventory` — owned themes, accessories, badges, icons (one row per item)
- `shop_items` — catalog: id, kind (`theme` | `accessory` | `badge` | `icon` | `bundle`), name, price_coins or price_credits, payload (colors/asset refs), bundle_contents
- `quests` — catalog of available quests + reward range
- `user_quest_progress` — per-user progress, claimed flag, verification payload (heartbeats for movies)
- `coin_transactions` — audit log (earn / spend / exchange), required so coins can never be inflated client-side

All writes go through `createServerFn` with `requireSupabaseAuth` — client cannot mint coins. Exchange Coins→Credits (25 basic / 50 premium) lives in a server fn too.

**Rename**
- `Media` → `Cinema` everywhere (route stays `/media` to avoid breaking links; nav label + titles change). If you want the URL changed to `/cinema` too, say so and I'll add a redirect.

**Fix GN Math GPT 5.4 bot**
- I'll downgrade the default model to `google/gemini-2.5-flash` (free tier, no credit ceiling) and add a graceful 402/429 fallback that swaps models automatically instead of erroring out.

## Phase 2 — Visual polish + posters

**Cozy/warm poster styling for Cinema + Games**
- Replace the current flat tiles with premium poster cards: warm amber/ember gradient frames, soft inner glow, subtle film-grain overlay, rounded corners, hover lift with warm shadow.
- Cinema rows already pull TMDB posters — I'll restyle the `Row`/poster components.
- Games hub will use the existing Steam/Hydra cover art with the same poster treatment.
- Warmer accent tokens added to `styles.css` (ember, candle, sunset).

**New nature wallpapers**
- I'll add ~4 new cozy/warm nature wallpapers (forest morning, autumn cabin, golden hour meadow, fireplace). All royalty-free sources, properly attributed in the file.

**PC layout reflow**
- Home (Polaris) and Proxy UI currently size for mobile/tablet — I'll add proper desktop breakpoints so search, dock, and proxy cards scale up on ≥1024px (bigger type, wider cards, more breathing room).

## Phase 3 — Shop, Quests, Split Windows

**Shop tab (`/shop`)**
Three sub-pages:
1. **Store** — themes, accessories, badges, icons grid. Singles 900 coins, bundles 1600. Badges/icons priced in credits.
2. **Exchange** — Coins → AI credits (25:1 basic, 50:1 premium). Server-side rate-limited.
3. **Quests / Achievements** — list of quests with progress bars + Claim button.

**Quests** (examples, 100–750 coins by difficulty)
- Play a game 10–15 min (heartbeat ping every 30s while game iframe is focused)
- Watch a full movie/show (anti-skip: server records timestamp heartbeats every 60s; quest only claimable if heartbeats cover ≥85% of runtime with monotonic progression — no jumping ahead, no scrubbing past unwatched chunks)
- Send N chat messages, customize profile, try a new wallpaper, etc.

**Anti-cheat**
- All "watched" / "played" verification is server-side. Client sends heartbeats with `(item_id, position_seconds, session_id)`; server validates monotonic-ish progression and total covered duration before allowing claim.

**Coins vs Credits rule**
- Coins ONLY buy cosmetics (themes, accessories, badges, icons). Hard-coded server-side — no path to unlock features with coins. Credits stay the unit for AI features.

**Tab windows + split windows**
- New windowing layer on top of `AppShell`: open any route as a window, drag, minimize, snap to left/right half (split view). Useful for browser + chat side-by-side, or cinema + games.
- Keyboard: `Cmd/Ctrl+\` to split, drag a tab to a screen edge to snap.
- This is the largest UI surface — done last because it touches every route.

---

## Questions before I start

1. **Scope confirm:** OK to ship in 3 phases (Foundation → Polish → Shop+Windows), one phase per turn? Otherwise this becomes one massive unreviewable change.
2. **Cinema URL:** keep `/media` (just relabel) or change to `/cinema` with a redirect?
3. **Starting coins:** should new users get a welcome bonus (e.g. 500 coins) or start at 0?
4. **Bundle contents:** want me to design the first ~3 bundles myself (e.g. "Cozy Cabin pack" = warm theme + fireplace banner + 2 badges), or do you want to spec them?
