# Polaris One — Phase 6

## 1. Customizer fixes (priority)
- **Exit broken**: `setActive(false)` not propagating because `/customize` route forces it back on via `useEffect`. Fix: clicking Exit navigates to `/` AND sets `active=false`; remove the route-level force-on (only activate when entering route fresh, not on every render).
- **Pops up randomly**: `ACTIVE_KEY` persists `active=1` to localStorage, so every reload re-opens it. Stop persisting `active`; it must be opt-in per session via `/customize` or a Settings toggle.
- **Default state**: never auto-on. Hard reset the stored flag on this deploy.
- **Text size on homescreen**: extend Inspector with a `fontScale` token applied as `--polaris-home-font-scale` on `Home.tsx` headings/labels. Wrap key home text nodes in `<Editable>` so they get scale + new font-size control.

## 2. Boot screen → 2s
- `Boot.tsx`: reduce splash duration to 2000ms (currently ~5s).

## 3. Profile config rework
- **Anonymous mode**: add `is_anonymous boolean` to profiles. When true, username displays as "Anonymous" + generic avatar everywhere (chat, leaderboards, friend lists). Toggle in ProfileSheet.
- **Move Pro Dashboard**: render `<ProDashboard />` inside ProfileSheet (new "Pro" tab). Remove from `/settings`.
- **Custom avatar save fix**: upload selected image to `avatars` bucket, store URL in `profiles.avatar_url`, render `<img src=...>` in `ProfileButton` instead of falling back to emoji.

## 4. Chat upgrades
- **Channel config panel** (gear icon → sheet): rename, topic, slowmode, members list, leave/delete (owner only).
- **Reply with Discord-style buttons**: hover/long-press a message → row of pill buttons (Reply, React 👍 ❤️ 😂, Copy, Delete-own). Replies render quoted parent above the new message.
- **Polaris Bot** (`@polaris-bot` virtual user, id `00000000-0000-0000-0000-000000000bot`):
  - Commands start with `#` or `/`.
  - **Member**: `#ping`, `#roll [sides]`, `#flip`, `#8ball <q>`, `#choose a|b|c`, `#avatar @user`, `#meme`, `#say <text>`, `#poll <q> | a | b | c`, `#cat`, `#dog`, `#joke`, `#define <word>`, `#serverinfo`, `#userinfo @user`.
  - **Admin only** (owner/mod): `#ban @user [reason]`, `#kick @user`, `#mute @user 10m`, `#warn @user`, `#purge 50`, `#lock`, `#unlock`.
  - Non-admin trying admin cmd → bot responds "❌ Insufficient permissions".
  - Bot uses uploaded Polaris logo as avatar (asset via lovable-assets).
  - Commands parsed client-side, bot replies inserted as system messages (sender_id = bot uuid, special render style: gradient name + bot badge).
  - Admin commands actually call existing ban infrastructure via `admin.functions.ts`.

## 5. AI Tools page changes
- **Inline Image Gen 2**: replace standalone `/image-gen` route with an "Image" tab inside PolarisAI. Same streaming flow, embedded in chat as inline tool.
- **Polaris AI navigation**: add tool-calling layer. AI returns structured `{action: "navigate", path: "/media", query?: "Super Mario Galaxy"}`. Client parses and `router.navigate(...)` + (for media) opens the matching item from the search query. Supported: /media, /games, /music, /apps, /shop, /chat, /settings, /profile, plus deep-link into PolarisFlix movie modal by TMDB search.

## 6. Polaris Bot extras
- Welcome message on join, daily affirmation command `#daily`, `#weather <city>` (free open-meteo), `#translate <lang> <text>` (Lovable AI), `#summarize <link>`, `#remind <time> <text>`.
- AI-powered `#ask <q>` routes to Lovable AI Gateway for natural answers.

## 7. Files

**New**:
- `src/components/polaris/chat/PolarisBot.ts` — command registry + handlers
- `src/components/polaris/chat/MessageActions.tsx` — Discord-style reply buttons
- `src/components/polaris/chat/ChannelConfig.tsx` — gear-icon sheet
- `src/components/polaris/ai/AiImageGen.tsx` — inline image tab
- `src/lib/ai-navigation.ts` — parse + execute AI navigation actions
- `src/assets/polaris-bot.png.asset.json` — bot logo (uploaded from user-uploads)

**Edited**:
- `src/lib/customizer-context.tsx` — remove active persistence, fix defaults
- `src/components/customizer/CustomizerOverlay.tsx` — Exit also navigates home
- `src/routes/customize.tsx` — don't force-active on every render
- `src/components/polaris/Home.tsx` — add font-scale token, Editable text nodes
- `src/components/polaris/Boot.tsx` — 2s
- `src/components/polaris/ProfileSheet.tsx` — anon toggle, Pro tab, avatar upload save
- `src/components/polaris/ProfileButton.tsx` — render avatar_url image
- `src/components/polaris/chat/ChatRoom.tsx` — bot integration, replies, config gear
- `src/components/polaris/ai/PolarisAI.tsx` — image tab + nav actions
- `src/routes/settings.tsx` — remove Pro Dashboard (now in profile)
- `src/routes/image-gen.tsx` — redirect to /ai

**Migration**: `profiles.is_anonymous boolean default false`; chat: `message_replies (parent_id)` column + `chat_channel_config` fields (topic, slowmode).

## 8. Risk / scope notes
- Polaris AI navigation requires the model to emit a strict JSON action when intent matches; system prompt updated, with regex fallback.
- Avatar upload uses existing `avatars` bucket — already public.
- Reply UI works on existing messages without backfill.

Ready to ship — I'll do customizer fixes + boot first (highest pain), then bot + chat, then AI/profile.
