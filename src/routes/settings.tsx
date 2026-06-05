import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Palette, Image as ImageIcon, EyeOff, Eye, Type, VenetianMask, LayoutGrid, Shield, Pin, Sparkles, Sun, Moon, Droplets, Wand2, Package, PanelTop, MessageCircle, Megaphone } from "lucide-react";
import { AppShell } from "@/components/polaris/AppShell";
import { useTheme } from "@/lib/theme-context";
import { useWallpaper } from "@/lib/wallpaper-context";
import { useSidebarState } from "@/lib/sidebar-context";
import { useShowDiscord, useShowAds, useAdProvider, type AdProvider } from "@/lib/ui-prefs";
import { useTabCloak } from "@/lib/tab-cloaker";
import { useAdmin } from "@/lib/admin-context";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { verifyAdminKey } from "@/lib/admin.functions";
import { Link } from "@tanstack/react-router";
import { ProCustomization } from "@/components/polaris/premium/ProCustomization";
import { useCustomizer } from "@/lib/customizer-context";
import { usePolarisMode } from "@/lib/polaris-mode";
import { Feather } from "lucide-react";

const COLOR_PRESETS: { label: string; rgb: string; hex: string }[] = [
  { label: "Ember",    rgb: "255 140 80",  hex: "#ff8c50" },
  { label: "Sunset",   rgb: "240 110 110", hex: "#f06e6e" },
  { label: "Gold",     rgb: "240 200 100", hex: "#f0c864" },
  { label: "Sakura",   rgb: "240 150 200", hex: "#f096c8" },
  { label: "Aurora",   rgb: "140 220 200", hex: "#8cdcc8" },
  { label: "Indigo",   rgb: "140 150 240", hex: "#8c96f0" },
  { label: "Forest",   rgb: "160 220 160", hex: "#a0dca0" },
  { label: "Crimson",  rgb: "230 80 90",   hex: "#e6505a" },
  { label: "Ocean",    rgb: "90 170 240",  hex: "#5aaaf0" },
  { label: "Mint",     rgb: "120 230 180", hex: "#78e6b4" },
  { label: "Violet",   rgb: "180 130 240", hex: "#b482f0" },
  { label: "Coral",    rgb: "255 120 140", hex: "#ff788c" },
  { label: "Lemon",    rgb: "250 230 110", hex: "#fae66e" },
  { label: "Slate",    rgb: "150 165 180", hex: "#96a5b4" },
  { label: "Magenta",  rgb: "230 90 200",  hex: "#e65ac8" },
  { label: "Cyan",     rgb: "80 210 230",  hex: "#50d2e6" },
];

type ThemePreset = {
  id: string;
  label: string;
  desc: string;
  ui: "dark" | "light";
  glass: boolean;
  accent: string; // rgb triplet
  accent2?: string; // rgb triplet for secondary tone (buttons vs chips)
  swatch: string; // gradient css
};

const THEME_PRESETS: ThemePreset[] = [
  { id: "midnight",  label: "Midnight",    desc: "Ember CTA, indigo chips",      ui: "dark",  glass: true,  accent: "255 140 80",  accent2: "140 130 240", swatch: "linear-gradient(135deg,#0a0910,#ff8c50)" },
  { id: "aurora",    label: "Aurora",      desc: "Mint CTA, teal chips",         ui: "dark",  glass: true,  accent: "140 220 200", accent2: "120 180 220", swatch: "linear-gradient(135deg,#0b1a1f,#8cdcc8)" },
  { id: "sakura",    label: "Sakura",      desc: "Pink CTA, rose chips",         ui: "dark",  glass: true,  accent: "240 150 200", accent2: "200 130 220", swatch: "linear-gradient(135deg,#1a0d18,#f096c8)" },
  { id: "indigo",    label: "Indigo Dream",desc: "Indigo CTA, violet chips",     ui: "dark",  glass: true,  accent: "140 150 240", accent2: "180 130 240", swatch: "linear-gradient(135deg,#0e0d22,#8c96f0)" },
  { id: "forest",    label: "Forest",      desc: "Green CTA, moss chips",        ui: "dark",  glass: true,  accent: "160 220 160", accent2: "200 220 130", swatch: "linear-gradient(135deg,#0a1410,#a0dca0)" },
  { id: "ocean",     label: "Ocean",       desc: "Blue CTA, cyan chips",         ui: "dark",  glass: true,  accent: "90 170 240",  accent2: "80 210 230",  swatch: "linear-gradient(135deg,#06101f,#5aaaf0)" },
  { id: "sunrise",   label: "Sunrise",     desc: "Gold CTA, coral chips",        ui: "light", glass: true,  accent: "240 200 100", accent2: "255 140 100", swatch: "linear-gradient(135deg,#fff3df,#f0c864)" },
  { id: "paper",     label: "Paper",       desc: "Slate, no glass",              ui: "light", glass: false, accent: "150 165 180", accent2: "100 120 150", swatch: "linear-gradient(135deg,#f5f3ee,#96a5b4)" },
  { id: "mono",      label: "Mono",        desc: "Flat dark, no glass",          ui: "dark",  glass: false, accent: "230 230 235", accent2: "180 180 200", swatch: "linear-gradient(135deg,#0a0a0a,#e6e6eb)" },
  { id: "vapor",     label: "Vapor",       desc: "Magenta CTA, cyan chips",      ui: "dark",  glass: true,  accent: "230 90 200",  accent2: "100 200 230", swatch: "linear-gradient(135deg,#1a0a22,#e65ac8)" },
  { id: "coral",     label: "Coral",       desc: "Coral CTA, peach chips",       ui: "dark",  glass: true,  accent: "255 120 140", accent2: "255 180 120", swatch: "linear-gradient(135deg,#1a0a10,#ff788c)" },
  { id: "cyber",     label: "Cyber",       desc: "Cyan CTA, magenta chips",      ui: "dark",  glass: true,  accent: "80 210 230",  accent2: "230 90 200",  swatch: "linear-gradient(135deg,#000814,#50d2e6)" },
  { id: "nordic",    label: "Nordic",      desc: "Ice CTA, slate chips",         ui: "dark",  glass: true,  accent: "120 180 220", accent2: "150 165 180", swatch: "linear-gradient(135deg,#0c1116,#78b4dc)" },
  { id: "ember-lite",label: "Ember Lite",  desc: "Warm light cream",             ui: "light", glass: true,  accent: "230 110 70",  accent2: "240 170 100", swatch: "linear-gradient(135deg,#fff5ec,#e66e46)" },
  { id: "matrix",    label: "Matrix",      desc: "Terminal green on black",      ui: "dark",  glass: false, accent: "100 240 140", accent2: "60 180 100",  swatch: "linear-gradient(135deg,#000000,#64f08c)" },
  { id: "rosegold",  label: "Rose Gold",   desc: "Rose CTA, gold chips",         ui: "dark",  glass: true,  accent: "240 170 160", accent2: "230 200 130", swatch: "linear-gradient(135deg,#1a1014,#f0aaa0)" },
  { id: "obsidian",  label: "Obsidian",    desc: "Violet CTA, indigo chips",     ui: "dark",  glass: true,  accent: "170 130 240", accent2: "120 130 220", swatch: "linear-gradient(135deg,#000000,#aa82f0)" },
  { id: "mocha",     label: "Mocha",       desc: "Warm brown + cream",           ui: "dark",  glass: true,  accent: "210 170 130", accent2: "230 200 160", swatch: "linear-gradient(135deg,#1a120a,#d2aa82)" },
  { id: "blueprint", label: "Blueprint",   desc: "Cyan CTA, blue chips",         ui: "dark",  glass: true,  accent: "100 200 230", accent2: "90 140 230",  swatch: "linear-gradient(135deg,#06141f,#64c8e6)" },
  { id: "candy",     label: "Candy",       desc: "Pink CTA, violet chips",       ui: "light", glass: true,  accent: "240 100 170", accent2: "170 130 240", swatch: "linear-gradient(135deg,#fff0f8,#f064aa)" },
  { id: "backrooms", label: "Backrooms",   desc: "Amber CTA, indigo chips",      ui: "dark",  glass: true,  accent: "255 150 60",  accent2: "120 110 230", swatch: "linear-gradient(135deg,#1a1408,#ff963c)" },
];

const DOCK_APP_CHOICES = [
  "YouTube", "Spotify", "Discord", "Reddit", "TikTok", "Instagram",
  "Twitter / X", "ChatGPT", "Claude", "Gemini", "GitHub", "Netflix",
  "Twitch", "Notion", "Drive", "Gmail", "Roblox", "Now.gg",
];

function hexToRgbTriplet(hex: string): string {
  const m = hex.replace("#", "");
  const n = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

function SettingsPage() {
  const {
    mode, setMode, customAccent, setCustomAccent, outlineColor, setOutlineColor,
    dockSize, setDockSize, shortcutSize, setShortcutSize, dockPins, setDockPins,
    defaultEngine, setDefaultEngine, homeAISwipe, setHomeAISwipe,
    uiTheme, setUITheme, liquidGlass, setLiquidGlass,
    setSecondaryAccent,
  } = useTheme();
  const { wallpaper, setWallpaperId, all } = useWallpaper();
  const { cloak, setCloakId, cloaks } = useTabCloak();
  const { orientation, setOrientation } = useSidebarState();
  const [showDiscord, setShowDiscord] = useShowDiscord();
  const [showAds, setShowAds] = useShowAds();
  const [adProvider, setAdProvider] = useAdProvider();
  const [pickerHex, setPickerHex] = useState("#ff9e55");
  const { isAdmin, isOwner, unlock, lock } = useAdmin();
  const { refreshProfile, user, profile, updateProfile } = useAuth();
  const verify = useServerFn(verifyAdminKey);
  const [adminKey, setAdminKey] = useState("");
  const [adminKey2, setAdminKey2] = useState("");
  const [adminMsg, setAdminMsg] = useState<string | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);
  type OwnedTheme = { id: string; name: string; kind: string; accent: string; banner: string; bundle?: string | null };
  const [ownedThemes, setOwnedThemes] = useState<OwnedTheme[]>([]);

  useEffect(() => {
    if (!user) { setOwnedThemes([]); return; }
    (async () => {
      const { data: inv } = await supabase.from("user_inventory").select("item_id").eq("user_id", user.id);
      const ids = (inv ?? []).map((r) => r.item_id);
      if (!ids.length) { setOwnedThemes([]); return; }
      const { data: items } = await supabase.from("shop_items").select("id,name,kind,payload,bundle_contents").in("id", ids);
      const itemsById = new Map((items ?? []).map((i) => [i.id, i]));
      const bundleNameById = new Map<string, string>();
      for (const it of items ?? []) {
        if (it.kind === "bundle" && Array.isArray(it.bundle_contents)) {
          for (const child of it.bundle_contents) bundleNameById.set(child, it.name);
        }
      }
      const themes: OwnedTheme[] = [];
      for (const it of items ?? []) {
        if (it.kind !== "theme") continue;
        const p = (it.payload ?? {}) as { accent?: string; banner?: string };
        themes.push({
          id: it.id,
          name: it.name,
          kind: it.kind,
          accent: p.accent ?? "255 140 80",
          banner: p.banner ?? p.accent ?? "230 110 50",
          bundle: bundleNameById.get(it.id) ?? null,
        });
      }
      void itemsById;
      setOwnedThemes(themes);
    })();
  }, [user]);

  async function submitAdmin() {
    setAdminMsg(null);
    setAdminLoading(true);
    try {
      await verify({ data: { key: adminKey, key2: adminKey2 } });
      unlock();
      await refreshProfile();
      setAdminKey("");
      setAdminKey2("");
      setAdminMsg("Access granted. Open the admin panel above.");
    } catch (e) {
      setAdminMsg((e as Error).message || "Invalid credentials");
    } finally {
      setAdminLoading(false);
    }
  }

  function applyPreset(p: ThemePreset) {
    setUITheme(p.ui);
    setLiquidGlass(p.glass);
    setCustomAccent(p.accent);
    setSecondaryAccent(p.accent2 ?? p.accent);
  }

  const activePresetId = THEME_PRESETS.find(
    (p) => p.ui === uiTheme && p.glass === liquidGlass && p.accent === customAccent,
  )?.id;

  async function applyOwnedTheme(t: { accent: string; banner: string }) {
    setCustomAccent(t.accent);
    setSecondaryAccent(t.banner);
    if (profile) {
      await updateProfile({ accent_color: t.accent, banner_color: t.banner });
    }
  }

  // Group owned themes by bundle name
  const themeGroups: Record<string, OwnedTheme[]> = {};
  for (const t of ownedThemes) {
    const key = t.bundle ?? "Standalone Themes";
    (themeGroups[key] ??= []).push(t);
  }

  return (
    <div className="min-h-screen px-4 pb-32 pt-8 sm:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="space-y-1">
          <div className="text-[11px] uppercase tracking-[0.3em] text-white/55">
            System
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">Settings</h1>
          <p className="text-sm text-white/55">
            Personalize Polaris — theme, wallpaper, and accent.
          </p>
        </header>

        {/* Pro Dashboard moved to Profile → Pro tab */}

        {/* Customizer toggle */}
        <CustomizerToggleSection />

        {/* Polaris Mode (Heavy / Lite) */}
        <PolarisModeSection />

        {/* Admin access */}
        <section className="liquid-glass-themed rounded-2xl p-5">
          <SectionTitle icon={Shield} title="Admin access" subtitle={isAdmin ? "Admin panel is active on this device" : isOwner ? "Owner detected — unlock the admin panel on this device" : "Restricted — enter the Polaris admin key"} />
          {isAdmin ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Link to="/admin" className="rounded-xl bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-400">
                Open Admin Panel
              </Link>
              <button onClick={lock} className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20">
                Sign out of Admin (this device)
              </button>
            </div>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              <input
                type="password"
                autoComplete="off"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Primary key…"
                className="flex-1 rounded-xl bg-white/5 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-white/30"
              />
              <input
                type="password"
                autoComplete="off"
                value={adminKey2}
                onChange={(e) => setAdminKey2(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") submitAdmin(); }}
                placeholder="Secondary verification…"
                className="flex-1 rounded-xl bg-white/5 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-white/30"
              />
              <button
                onClick={submitAdmin}
                disabled={adminLoading || !adminKey || !adminKey2}
                className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-black hover:bg-white/90 disabled:opacity-50"
              >
                {adminLoading ? "Verifying…" : "Unlock"}
              </button>
            </div>
          )}
          {adminMsg && <div className="mt-3 text-xs text-white/65">{adminMsg}</div>}
        </section>

        {/* Ads provider — front-and-center, supports Polaris */}
        <section className="liquid-glass-themed rounded-2xl p-5">
          <SectionTitle
            icon={Megaphone}
            title="Ads"
            subtitle="Pick the ad network that helps fund Polaris One — or turn ads off."
          />
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {([
              { id: "monetag", label: "Monetag", desc: "Default — lightest" },
              { id: "adsterra", label: "Adsterra", desc: "Classic popunder" },
              { id: "off", label: "Off", desc: "No ads at all" },
            ] as { id: AdProvider; label: string; desc: string }[]).map((opt) => {
              const active = (showAds ? adProvider : "off") === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    if (opt.id === "off") {
                      setShowAds(false);
                    } else {
                      setShowAds(true);
                      setAdProvider(opt.id);
                    }
                  }}
                  aria-pressed={active}
                  className={`rounded-2xl border p-4 text-left transition ${
                    active
                      ? "border-white/30 bg-white/15 text-white"
                      : "border-white/10 bg-white/[0.04] text-white/80 hover:border-white/20 hover:bg-white/[0.07]"
                  }`}
                >
                  <div className="text-sm font-semibold">{opt.label}</div>
                  <div className="mt-1 text-[11px] text-white/60">{opt.desc}</div>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-amber-200/80">
            Turning ads off stops Polaris from making money to stay free. If you can, please leave them on.
          </p>
        </section>

        {/* Theme presets */}
        <section className="liquid-glass-themed rounded-2xl p-5">
          <SectionTitle icon={Wand2} title="Theme presets" subtitle="One-tap looks — sets light/dark, glass, and accent" />
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
            {THEME_PRESETS.map((p) => {
              const active = activePresetId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => applyPreset(p)}
                  className={`group relative overflow-hidden rounded-xl border p-0 text-left transition ${
                    active ? "border-white scale-[1.02] shadow-lg" : "border-white/10 hover:border-white/30"
                  }`}
                >
                  <div className="h-16 w-full" style={{ background: p.swatch }} />
                  <div className="flex items-center justify-between gap-2 px-3 py-2">
                    <div className="min-w-0">
                      <div className="truncate text-[12px] font-bold text-white">{p.label}</div>
                      <div className="truncate text-[10px] text-white/55">{p.desc}</div>
                    </div>
                    <span
                      className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold"
                      style={{
                        background: p.ui === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)",
                        color: p.ui === "dark" ? "#fff" : "#000",
                      }}
                      title={p.ui === "dark" ? "Dark" : "Light"}
                    >
                      {p.ui === "dark" ? "D" : "L"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* My owned themes (from purchases) */}
        {ownedThemes.length > 0 && (
          <section className="liquid-glass-themed rounded-2xl p-5">
            <SectionTitle icon={Package} title="My Themes" subtitle={`${ownedThemes.length} owned — purchased from the Shop`} />
            <div className="mt-4 space-y-5">
              {Object.entries(themeGroups).map(([bundleName, list]) => (
                <div key={bundleName}>
                  <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.25em] text-white/55">{bundleName}</div>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
                    {list.map((t) => {
                      const active = customAccent === t.accent;
                      return (
                        <button
                          key={t.id}
                          onClick={() => applyOwnedTheme(t)}
                          className={`group relative overflow-hidden rounded-xl border text-left transition ${
                            active ? "border-white scale-[1.02] shadow-lg" : "border-white/10 hover:border-white/30"
                          }`}
                        >
                          <div
                            className="h-14 w-full"
                            style={{ background: `linear-gradient(135deg, rgb(${t.banner}), rgb(${t.accent}))` }}
                          />
                          <div className="px-3 py-2">
                            <div className="truncate text-[12px] font-bold text-white">{t.name}</div>
                            <div className="truncate text-[10px] text-white/55">{active ? "Active" : "Tap to apply"}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Background Mode */}
        <section className="liquid-glass-themed rounded-2xl p-5">
          <div className="mb-4">
            <SectionTitle icon={uiTheme === "dark" ? Moon : Sun} title="Appearance" subtitle="Light or dark UI chrome" />
            <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-black/20 p-1 text-xs font-bold">
              {(["dark", "light"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setUITheme(t)}
                  className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2 ${
                    uiTheme === t
                      ? "bg-white text-black"
                      : "text-white/65 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {t === "dark" ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
                  {t === "dark" ? "Dark" : "Light"}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <SectionTitle icon={Droplets} title="Liquid Glass" subtitle="Frosted blur surfaces across every page" />
            <div className="mt-3 flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white">Enable Liquid Glass</div>
                <p className="mt-0.5 text-[11px] text-white/55">
                  When off, every glass surface becomes a flat opaque card — simpler,
                  cleaner, and easier to read.
                </p>
              </div>
              <button
                onClick={() => setLiquidGlass(!liquidGlass)}
                aria-pressed={liquidGlass}
                className={`relative h-7 w-12 shrink-0 rounded-full border transition ${
                  liquidGlass ? "border-white/20 bg-white" : "border-white/15 bg-white/10"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-6 w-6 rounded-full transition-all ${
                    liquidGlass ? "left-5 bg-black" : "left-0.5 bg-white"
                  }`}
                />
              </button>
            </div>
          </div>
          <div className="mt-4">
            <SectionTitle icon={PanelTop} title="Top bar layout" subtitle="Desktop only — replaces the side rail with a top bar" />
            <div className="mt-3 flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white">Use top bar navigation</div>
                <p className="mt-0.5 text-[11px] text-white/55">
                  When on, the navigation sits as a horizontal bar across the top.
                  When off, it stays on the left as a sidebar. Phones always use the top bar.
                </p>
              </div>
              <button
                onClick={() => setOrientation(orientation === "top" ? "side" : "top")}
                aria-pressed={orientation === "top"}
                className={`relative h-7 w-12 shrink-0 rounded-full border transition ${
                  orientation === "top" ? "border-white/20 bg-white" : "border-white/15 bg-white/10"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-6 w-6 rounded-full transition-all ${
                    orientation === "top" ? "left-5 bg-black" : "left-0.5 bg-white"
                  }`}
                />
              </button>
            </div>
          </div>
          <SectionTitle icon={ImageIcon} title="Background mode" subtitle="Wallpaper or clean outline" />
          <div className="mt-3 grid grid-cols-2 gap-3">
            <ModeCard
              active={mode === "wallpaper"}
              onClick={() => setMode("wallpaper")}
              icon={Eye}
              title="Wallpaper"
              desc="Animated backgrounds with cinematic vibes."
            />
            <ModeCard
              active={mode === "outline"}
              onClick={() => setMode("outline")}
              icon={EyeOff}
              title="Outline only"
              desc="No wallpaper — solid black with accent outlines."
            />
          </div>

          {mode === "outline" && (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
              <span className="text-xs text-white/70">Outline color</span>
              <input
                type="color"
                value={outlineColor}
                onChange={(e) => setOutlineColor(e.target.value)}
                className="h-8 w-12 cursor-pointer rounded border-0 bg-transparent"
              />
              <span className="text-xs tabular-nums text-white/50">{outlineColor}</span>
            </div>
          )}
        </section>

        {/* Accent */}
        <section className="liquid-glass-themed rounded-2xl p-5">
          <SectionTitle icon={Palette} title="Accent color" subtitle="Overrides wallpaper accent" />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => setCustomAccent(null)}
              className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
                customAccent === null
                  ? "border-white bg-white text-black"
                  : "border-white/15 bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              From wallpaper
            </button>
            {COLOR_PRESETS.map((c) => (
              <button
                key={c.rgb}
                onClick={() => setCustomAccent(c.rgb)}
                title={c.label}
                className={`h-10 w-10 rounded-xl transition ${
                  customAccent === c.rgb ? "ring-2 ring-white scale-110" : "hover:scale-105"
                }`}
                style={{ background: `rgb(${c.rgb})` }}
              />
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
            <span className="text-xs text-white/70">Custom</span>
            <input
              type="color"
              value={pickerHex}
              onChange={(e) => setPickerHex(e.target.value)}
              className="h-8 w-12 cursor-pointer rounded border-0 bg-transparent"
            />
            <button
              onClick={() => setCustomAccent(hexToRgbTriplet(pickerHex))}
              className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-black hover:bg-white/90"
            >
              Apply
            </button>
          </div>
        </section>

        {/* Wallpapers */}
        {mode === "wallpaper" && (
          <section className="liquid-glass-themed rounded-2xl p-5">
            <SectionTitle icon={Type} title="Wallpaper" subtitle={`Currently: ${wallpaper.name}`} />
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {all.map((w) => (
                <button
                  key={w.id}
                  onClick={() => setWallpaperId(w.id)}
                  className={`group relative aspect-video overflow-hidden rounded-xl border transition ${
                    w.id === wallpaper.id
                      ? "border-white scale-[1.02] shadow-lg"
                      : "border-white/10 hover:border-white/30"
                  }`}
                >
                  {w.poster ? (
                    <img
                      src={w.poster}
                      alt={w.name}
                      className="absolute inset-0 h-full w-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.opacity = "0";
                      }}
                    />
                  ) : null}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(160deg, rgba(${w.accent}/0.4), rgba(10,9,16,0.6))`,
                    }}
                  />
                  <div className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5 text-left text-[10px] font-medium text-white">
                    {w.name}
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Tab Cloaker */}
        <section className="liquid-glass-themed rounded-2xl p-5">
          <SectionTitle
            icon={VenetianMask}
            title="Tab Cloaker"
            subtitle={cloak.id === "none" ? "Off" : `Disguised as ${cloak.label}`}
          />
          <p className="mt-2 text-xs text-white/55">
            Change the browser tab title and favicon so Polaris blends in. Hidden in
            other tabs too.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {cloaks.map((c) => {
              const active = c.id === cloak.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setCloakId(c.id)}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                    active
                      ? "border-white bg-white/10"
                      : "border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10"
                  }`}
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/10 overflow-hidden">
                    {c.favicon ? (
                      <img src={c.favicon} alt="" className="h-5 w-5" referrerPolicy="no-referrer" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-white/70" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold text-white">{c.label}</div>
                    <div className="truncate text-[10px] text-white/45">{c.title}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Dock & shortcuts */}
        <section className="liquid-glass-themed rounded-2xl p-5">
          <SectionTitle icon={LayoutGrid} title="Dock & shortcuts" subtitle="Resize and personalize the dock" />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-white/80">Dock size</span>
                <span className="text-[11px] tabular-nums text-white/45">{Math.round(dockSize * 100)}%</span>
              </div>
              <input
                type="range" min={0.75} max={1.4} step={0.05}
                value={dockSize}
                onChange={(e) => setDockSize(parseFloat(e.target.value))}
                className="w-full accent-white"
              />
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-white/80">Shortcut size</span>
                <span className="text-[11px] tabular-nums text-white/45">{Math.round(shortcutSize * 100)}%</span>
              </div>
              <input
                type="range" min={0.75} max={1.4} step={0.05}
                value={shortcutSize}
                onChange={(e) => setShortcutSize(parseFloat(e.target.value))}
                className="w-full accent-white"
              />
            </div>
          </div>
          <div className="mt-5">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-white/80">
              <Pin className="h-3.5 w-3.5" /> Pinned dock apps
            </div>
            <div className="flex flex-wrap gap-2">
              {DOCK_APP_CHOICES.map((name) => {
                const on = dockPins.includes(name);
                return (
                  <button
                    key={name}
                    onClick={() =>
                      setDockPins(on ? dockPins.filter((n) => n !== name) : [...dockPins, name])
                    }
                    className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${
                      on
                        ? "bg-white text-black"
                        : "border border-white/10 bg-white/[0.04] text-white/65 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Proxy engine */}
        <section className="liquid-glass-themed rounded-2xl p-5">
          <SectionTitle icon={Shield} title="Default proxy" subtitle="Used by dock + Apps shortcuts" />
          <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-black/20 p-1 text-xs font-bold">
            {(["uv", "scramjet"] as const).map((e) => (
              <button
                key={e}
                onClick={() => setDefaultEngine(e)}
                className={`rounded-xl px-4 py-2 ${
                  defaultEngine === e
                    ? "bg-white text-black"
                    : "text-white/65 hover:bg-white/10 hover:text-white"
                }`}
              >
                {e === "uv" ? "Ultraviolet" : "Scramjet"}
              </button>
            ))}
          </div>
        </section>

        {/* Home experience */}
        <section className="liquid-glass-themed rounded-2xl p-5">
          <SectionTitle
            icon={Sparkles}
            title="Home experience"
            subtitle="Customize the home page swipe pages"
          />
          <div className="mt-4 flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white">AI swipe page</div>
              <p className="mt-0.5 text-[11px] text-white/55">
                Adds a second home page you can swipe to — quick AI chat with
                modes for Coding, Learning, Planning, and more.
              </p>
            </div>
            <button
              onClick={() => setHomeAISwipe(!homeAISwipe)}
              aria-pressed={homeAISwipe}
              className={`relative h-7 w-12 shrink-0 rounded-full border transition ${
                homeAISwipe
                  ? "border-white/20 bg-white"
                  : "border-white/15 bg-white/10"
              }`}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full transition-all ${
                  homeAISwipe ? "left-5 bg-black" : "left-0.5 bg-white"
                }`}
              />
            </button>
          </div>
        </section>

        {/* Discord chip visibility */}
        <section className="liquid-glass-themed rounded-2xl p-5">
          <SectionTitle icon={MessageCircle} title="Discord shortcut" subtitle="Show the Join Discord chip in the sidebar & games hub" />
          <div className="mt-3 flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white">Show Discord callout</div>
              <p className="mt-0.5 text-[11px] text-white/55">
                Hide it if you're on a network where Discord looks suspicious.
              </p>
            </div>
            <button
              onClick={() => setShowDiscord(!showDiscord)}
              aria-pressed={showDiscord}
              className={`relative h-7 w-12 shrink-0 rounded-full border transition ${
                showDiscord ? "border-white/20 bg-white" : "border-white/15 bg-white/10"
              }`}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full transition-all ${
                  showDiscord ? "left-5 bg-black" : "left-0.5 bg-white"
                }`}
              />
            </button>
          </div>
        </section>

        <ProCustomization />

      </div>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof Palette;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="grid h-9 w-9 place-items-center rounded-xl"
        style={{ background: "rgba(var(--polaris-accent)/0.25)" }}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-sm font-bold text-white">{title}</div>
        {subtitle && <div className="text-[11px] text-white/55">{subtitle}</div>}
      </div>
    </div>
  );
}

function ModeCard({
  active,
  onClick,
  icon: Icon,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Eye;
  title: string;
  desc: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`group flex items-start gap-3 rounded-xl border p-4 text-left transition ${
        active
          ? "border-white bg-white/10"
          : "border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10"
      }`}
    >
      <Icon className="h-5 w-5 shrink-0 text-white/80" />
      <div>
        <div className="text-sm font-bold text-white">{title}</div>
        <div className="mt-0.5 text-[11px] text-white/55">{desc}</div>
      </div>
    </button>
  );
}

function CustomizerToggleSection() {
  const c = useCustomizer();
  return (
    <section className="liquid-glass-themed rounded-2xl p-5">
      <SectionTitle
        icon={Wand2}
        title="Polaris Customizer"
        subtitle="Move, resize, hide, and decorate the sidebar. Locked surfaces stay safe."
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          onClick={() => c.setActive(!c.active)}
          className={`rounded-xl px-4 py-2 text-sm font-bold ${
            c.active ? "bg-red-500 text-white hover:bg-red-400" : "bg-white text-black hover:bg-white/90"
          }`}
        >
          {c.active ? "Exit edit mode" : "Enter edit mode"}
        </button>
        <Link to="/customize" className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20">
          Open Customizer page
        </Link>
        {c.active && (
          <button
            onClick={() => { if (confirm("Reset every customization?")) c.resetAll(); }}
            className="rounded-xl bg-white/5 px-4 py-2 text-sm text-white/70 hover:bg-white/10"
          >
            Reset all
          </button>
        )}
      </div>
      <p className="mt-2 text-[11px] text-white/45">
        Free: reorder, hide, scale (0.5×–2×), one-step undo. Pro: decals, deeper undo history, 0.25×–4× scale, up to 5 saved layouts.
      </p>
    </section>
  );
}

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Polaris One" }] }),
  component: () => (
    <AppShell>
      <SettingsPage />
    </AppShell>
  ),
});

function PolarisModeSection() {
  const { mode, setMode } = usePolarisMode();
  return (
    <section className="liquid-glass-themed rounded-2xl p-5">
      <SectionTitle
        icon={Feather}
        title="Polaris Mode"
        subtitle={`Currently: ${mode === "lite" ? "Lightweight" : "Heavyweight"} — switch any time`}
      />
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <button
          onClick={() => setMode("heavy")}
          className={`rounded-xl border p-4 text-left transition ${
            mode === "heavy"
              ? "border-white bg-white/10"
              : "border-white/10 hover:border-white/30"
          }`}
        >
          <div className="text-sm font-bold text-white">Heavyweight</div>
          <div className="mt-1 text-[11px] uppercase tracking-[0.25em] text-white/55">Full Polaris</div>
          <p className="mt-2 text-xs text-white/65">
            Cinematic wallpapers, liquid glass, boot animation, dock, every page.
          </p>
        </button>
        <button
          onClick={() => setMode("lite")}
          className={`rounded-xl border p-4 text-left transition ${
            mode === "lite"
              ? "border-white bg-white/10"
              : "border-white/10 hover:border-white/30"
          }`}
        >
          <div className="text-sm font-bold text-white">Lightweight</div>
          <div className="mt-1 text-[11px] uppercase tracking-[0.25em] text-white/55">~Under 5&nbsp;MB</div>
          <p className="mt-2 text-xs text-white/65">
            Stripped UI — no wallpapers, no animations, no boot. Games, AI, Flix, Music, Browser. Like koopbin.site.
          </p>
        </button>
      </div>
    </section>
  );
}

