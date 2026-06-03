# Phase 5 — Wallpapers, Customizer, Pro Dashboard

Three coordinated systems. Customizer is the heavy lift; wallpapers/Pro dashboard are smaller.

---

## 1. Custom & community wallpapers

**Backend (one migration):**
- `community_wallpapers` table: `id, uploader_id, uploader_username, name, image_url, accent (rgb triplet), type ('static'|'animated'), is_animated, downloads, hearts, status ('active'|'hidden'), created_at`. Auto-publish; owner can hide.
- `wallpaper_reports` table: `id, wallpaper_id, reporter_id, reason, created_at`. Owner reads, anyone signed-in can insert (1 per user per wallpaper unique).
- Public storage bucket `wallpapers` (already-public-allowed; falls back to private + signed URLs if blocked).
- RPC `hide_reported_wallpaper(_id)` owner-only for moderation.

**Frontend:**
- Extend `WallpaperPicker.tsx` with tabs: **Built-in / My uploads / Community / Upload**.
- "My uploads" stored in `localStorage` as `polaris:wallpapers:custom` (file → object URL, persisted as base64 for small images, or upload-to-cloud for big ones).
- Upload flow: pick file → name it → auto-extract dominant color (canvas sample) → optional "share to community" checkbox → upload to bucket → insert row.
- Community grid sorted by hearts/recency, with heart + report buttons.
- Owner sees a "Hide" button inline.

---

## 2. Polaris Customizer

A **separate `/customize` route** with a top-bar editor overlay that wraps the existing app. Toggle on/off from Settings *and* from a new "Customize" entry in Sidebar > Account.

**State model (`src/lib/customizer-context.tsx`):**
- One JSON document per saved layout: `{ id, name, version, tokens: {accent, radius, glassOpacity, fontScale}, items: { [elementId]: { x?, y?, scale?, rotation?, hidden?, color?, decal?, categoryId? } }, categories: [...] }`.
- Persisted to `localStorage` (free tier: 1 layout). Pro: up to 5 layouts in `user_layouts` table.
- **History stack** (undo/redo) — capped at 50 steps; "Reset all" wipes the document.

**Editor chrome (`src/components/customizer/CustomizerOverlay.tsx`):**
- Floating top toolbar: Save / Undo / Redo / Reset / Grid-snap toggle (8/16/24 px) / Smooth toggle / Exit.
- Right inspector panel: when an element is selected → color picker, scale slider, decal picker, hide toggle, "send to category" dropdown.
- ESC deselects; Delete hides the element.

**Edit-mode mechanics:**
- Any DOM node with `data-polaris-edit-id="xxx"` becomes editable when overlay is active.
- Wrap targets with a lightweight `<Editable id="...">` helper that applies transforms from context and adds a hover outline + drag handle in edit mode.
- Drag = pointer events on the wrapper; grid-snap rounds delta to grid size; free mode does not.
- Resize via corner handle (uniform scale 0.5x–2x).
- **Locked surfaces:** Player iframe, Shop, Admin, Security, Auth dialog, Watch Party panel, modals — these wrappers do not opt into `<Editable>` so they can never be moved or decal'd.

**Categories (Pro):**
- Create a named category in the inspector → drag any sidebar item into it.
- Categories render as new collapsible groups in `Sidebar.tsx`, reading from customizer context.

**Decals (Pro, client-only):**
- 24 built-in SVG decals (stars, flames, sparkles, gradients, ribbons) shipped as inline SVG sprites.
- Decal renders as absolutely-positioned overlay on the editable element with adjustable opacity/scale.
- Note in the UI: "Decals are visible only to you." Enforced naturally because state lives in `localStorage` / per-user `user_layouts`.

**Pro gating (matches your pick):**
- Free: change `--polaris-accent`, reorder sidebar items, hide/show items, button-scale slider, reset.
- Pro lock badges over: free-form drag (vs grid-snap reorder), decals, custom categories, undo *history* (free gets single-level undo only), multiple saved layouts.

---

## 3. Pro Dashboard

New section inside `src/routes/settings.tsx` (`ProDashboard.tsx`), only visible if `is_pro`:
- **Status card:** plan tier, days remaining, key history (last 5 redeemed `pro_keys` for `redeemed_by = auth.uid()`).
- **VIP visibility toggle:** writes `polaris:pro:hide_vip` to localStorage; `ProfileButton.tsx` and any "Pro" / "VIP" badges respect it.
- **Saved layouts manager:** list, rename, switch, delete (calls layout server fns).

A small `is_pro_active(profile)` helper centralizes the check; reused everywhere we currently inline `pro_until > now()`.

---

## Technical notes

```text
src/lib/
  customizer-context.tsx     # state, history, persist
  customizer-decals.tsx      # SVG sprite + picker
  customizer.functions.ts    # save/load/delete user_layouts (Pro)
  wallpaper-custom.ts        # local custom WP storage + upload helper
src/components/
  customizer/
    CustomizerOverlay.tsx
    Editable.tsx
    Inspector.tsx
    Toolbar.tsx
    LockedNotice.tsx
  polaris/
    WallpaperPicker.tsx      # extended with tabs
    premium/ProDashboard.tsx
src/routes/
  customize.tsx              # editor mode
  settings.tsx               # add Pro Dashboard section
```

Migration adds: `community_wallpapers`, `wallpaper_reports`, `user_layouts` (Pro: `{ id, user_id, name, document jsonb, updated_at }`, unique per user up to 5 enforced by trigger). All three get explicit GRANTs + RLS scoped to `auth.uid()` or public-read where appropriate.

`wallpapers` storage bucket created via `supabase--storage_create_bucket` (public). RLS on `storage.objects` lets authenticated users upload to `wallpapers/{auth.uid()}/...` and read anything in the bucket.

No edits to locked files (`client.ts`, `types.ts`, etc.). All server-side work uses `createServerFn`.

Approve and I'll start with the migration + storage bucket, then ship in order: wallpapers → customizer core → Pro dashboard.
