import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Coins, Flame, Check, Lock, Gift, Trophy, ShoppingBag, Palette, Stars, Award, Crown } from "lucide-react";
import { getShopState, purchaseItem, claimQuest } from "@/lib/shop.functions";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

type Tab = "shop" | "quests";
type ShopFilter = "all" | "bundle" | "theme" | "accessory" | "badge";
type ShopSort = "featured" | "price-asc" | "price-desc" | "name";

export function Shop() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("shop");
  const [filter, setFilter] = useState<ShopFilter>("all");
  const [sort, setSort] = useState<ShopSort>("featured");
  const fetchState = useServerFn(getShopState);
  const buyFn = useServerFn(purchaseItem);
  const claimFn = useServerFn(claimQuest);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["shop-state"],
    queryFn: () => fetchState(),
    enabled: !!user,
  });

  const buy = useMutation({
    mutationFn: (itemId: string) => buyFn({ data: { itemId } }),
    onSuccess: () => { toast.success("Purchased!"); qc.invalidateQueries({ queryKey: ["shop-state"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const claim = useMutation({
    mutationFn: (questId: string) => claimFn({ data: { questId } }),
    onSuccess: (r: { coins: number }) => { toast.success(`+${r.coins} coins claimed`); qc.invalidateQueries({ queryKey: ["shop-state"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6 text-center">
        <div className="liquid-glass max-w-md rounded-2xl p-8">
          <Lock className="mx-auto h-7 w-7 text-amber-300/80" />
          <h2 className="mt-3 text-xl font-bold text-amber-50">Sign in to enter the Shop</h2>
          <p className="mt-1.5 text-sm text-white/60">Earn coins from quests and spend them on cozy themes & flexes.</p>
        </div>
      </div>
    );
  }

  const wallet = data?.wallet ?? { coins: 0, basic_credits: 0, premium_credits: 0 };
  const items = data?.items ?? [];
  const inventory = data?.inventory ?? [];
  const ownedSet = new Set(inventory.map((i) => i.item_id));
  const bundles = items.filter((i) => i.kind === "bundle");
  const themes = items.filter((i) => i.kind === "theme");
  const accessories = items.filter((i) => i.kind === "accessory");
  const credItems = items.filter((i) => i.kind === "badge" || i.kind === "icon");

  const sortItems = (list: Item[]) => {
    const arr = [...list];
    if (sort === "price-asc") arr.sort((a, b) => (a.price_coins ?? a.price_basic_credits ?? 0) - (b.price_coins ?? b.price_basic_credits ?? 0));
    else if (sort === "price-desc") arr.sort((a, b) => (b.price_coins ?? b.price_basic_credits ?? 0) - (a.price_coins ?? a.price_basic_credits ?? 0));
    else if (sort === "name") arr.sort((a, b) => a.name.localeCompare(b.name));
    return arr;
  };
  const show = (k: ShopFilter) => filter === "all" || filter === k;

  return (
    <div
      className="relative min-h-screen"
      style={{
        background:
          "radial-gradient(1200px 600px at 30% -10%, rgba(255,170,90,0.18), transparent 60%), radial-gradient(900px 500px at 90% 10%, rgba(200,110,60,0.14), transparent 65%), linear-gradient(180deg, #1a0f0a 0%, #0d0805 100%)",
      }}
    >
      {/* Header bar */}
      <div className="sticky top-0 z-10 border-b border-amber-100/10 bg-stone-950/70 px-4 py-3 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="h-5 w-5 text-amber-300" />
            <h1 className="text-lg font-bold text-amber-50 sm:text-xl">Cozy Shop</h1>
          </div>
          <div className="flex items-center gap-2">
            <Wallet icon={<Coins className="h-3.5 w-3.5" />} value={wallet.coins} label="Coins" />
          </div>
        </div>
        {/* Tabs */}
        <div className="mx-auto mt-3 flex max-w-6xl gap-1">
          {(["shop", "quests"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative rounded-lg px-4 py-1.5 text-sm font-semibold capitalize transition ${
                tab === t ? "text-amber-50" : "text-white/55 hover:text-white/80"
              }`}
              style={
                tab === t
                  ? { background: "rgba(255,170,90,0.18)", boxShadow: "inset 0 0 0 1px rgba(255,170,90,0.45)" }
                  : undefined
              }
            >
              {t === "shop" ? "Shop" : "Quests"}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center text-white/40">Loading…</div>
        ) : tab === "shop" ? (
          <>
            <FeaturedBanner />

            {/* Customization toolbar */}
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200/80">Filter</span>
              {(["all", "bundle", "theme", "accessory", "badge"] as ShopFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-full px-3 py-1 text-[11px] font-bold capitalize transition ${
                    filter === f
                      ? "bg-amber-300 text-stone-900 shadow"
                      : "bg-black/40 text-amber-100/80 ring-1 ring-amber-200/20 hover:bg-black/60"
                  }`}
                >
                  {f === "all" ? "All" : f === "accessory" ? "Accessories" : `${f}s`}
                </button>
              ))}
              <span className="mx-1 h-4 w-px self-center bg-white/15" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200/80">Sort</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as ShopSort)}
                className="rounded-full bg-black/40 px-3 py-1 text-[11px] font-bold text-amber-100/90 ring-1 ring-amber-200/20 focus:outline-none"
              >
                <option value="featured" className="bg-stone-950">Featured</option>
                <option value="price-asc" className="bg-stone-950">Price: Low → High</option>
                <option value="price-desc" className="bg-stone-950">Price: High → Low</option>
                <option value="name" className="bg-stone-950">Name (A–Z)</option>
              </select>
            </div>

            {show("bundle") && (
            <Section title="Featured Bundles" subtitle="Save coins with curated packs">
              <Grid cards={3}>
                {sortItems(bundles).map((b) => (
                  <BundleCard key={b.id} item={b} owned={ownedSet.has(b.id)} onBuy={() => buy.mutate(b.id)} busy={buy.isPending} />
                ))}
              </Grid>
            </Section>
            )}
            {show("theme") && (
            <Section title="Themes" subtitle="Warm palettes for chat surfaces" icon={<Flame className="h-4 w-4 text-amber-300" />}>
              <Grid cards={4}>
                {sortItems(themes).map((i) => (
                  <ItemCard key={i.id} item={i} owned={ownedSet.has(i.id)} onBuy={() => buy.mutate(i.id)} busy={buy.isPending} />
                ))}
              </Grid>
            </Section>
            )}
            {show("accessory") && (
            <Section title="Banner Accessories" subtitle="Animated touches for your profile">
              <Grid cards={4}>
                {sortItems(accessories).map((i) => (
                  <ItemCard key={i.id} item={i} owned={ownedSet.has(i.id)} onBuy={() => buy.mutate(i.id)} busy={buy.isPending} />
                ))}
              </Grid>
            </Section>
            )}
            {show("badge") && (
            <Section title="Badges & Frames" subtitle="Rare cosmetics — purchased with coins" icon={<Trophy className="h-4 w-4 text-amber-300" />}>
              <Grid cards={4}>
                {sortItems(credItems).map((i) => (
                  <ItemCard key={i.id} item={i} owned={ownedSet.has(i.id)} onBuy={() => buy.mutate(i.id)} busy={buy.isPending} />
                ))}
              </Grid>
            </Section>
            )}
          </>
        ) : (
          <QuestsPanel
            quests={data?.quests ?? []}
            progress={data?.progress ?? []}
            onClaim={(id) => claim.mutate(id)}
            busy={claim.isPending}
          />
        )}
      </div>
    </div>
  );
}

function Wallet({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  const ring = "ring-amber-300/40";
  const fg = "text-amber-200";
  return (
    <div className={`flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 text-xs font-bold ring-1 ${ring} ${fg}`}>
      {icon}
      <span className="tabular-nums">{value.toLocaleString()}</span>
      <span className="hidden text-[10px] uppercase tracking-wider opacity-60 sm:inline">{label}</span>
    </div>
  );
}

function FeaturedBanner() {
  return (
    <div
      className="relative mb-8 h-40 overflow-hidden rounded-2xl ring-1 ring-amber-200/20 sm:h-48"
      style={{
        background:
          "linear-gradient(110deg, #3a1a0a 0%, #6b2f15 40%, #c9651e 75%, #f0a955 100%)",
        boxShadow: "0 20px 60px -20px rgba(255,150,80,0.45), inset 0 0 80px rgba(0,0,0,0.35)",
      }}
    >
      <div className="absolute inset-0 opacity-30" style={{
        background: "radial-gradient(600px 200px at 80% 50%, rgba(255,220,160,0.4), transparent)",
      }} />
      <div className="absolute inset-0 flex flex-col justify-center gap-2 p-6 sm:p-10">
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-100/80">Featured Drop</span>
        <h2 className="text-2xl font-black leading-tight text-amber-50 drop-shadow-md sm:text-4xl">Hearth & Hollow</h2>
        <p className="max-w-md text-xs text-amber-100/85 sm:text-sm">
          Curated cozy bundles — warm themes and crackling banners to make your chat feel like a cabin in autumn.
        </p>
      </div>
    </div>
  );
}

function Section({ title, subtitle, icon, children }: { title: string; subtitle?: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="text-lg font-bold text-amber-50 sm:text-xl">{title}</h3>
          </div>
          {subtitle && <p className="mt-0.5 text-xs text-white/50">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function Grid({ children, cards }: { children: React.ReactNode; cards: number }) {
  const cls = cards === 3
    ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
    : "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4";
  return <div className={cls}>{children}</div>;
}

type Item = {
  id: string; kind: string; name: string; description: string | null;
  price_coins: number | null; price_basic_credits: number | null;
  payload: unknown; bundle_contents: string[];
};

function ItemCard({ item, owned, onBuy, busy }: { item: Item; owned: boolean; onBuy: () => void; busy: boolean }) {
  const payload = (item.payload ?? {}) as { accent?: string; banner?: string; effect?: string; emoji?: string; color?: string; frame?: string };
  const accent = payload.accent || payload.color || payload.banner || "230 150 80";
  const price = item.price_coins;

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-xl border border-amber-100/10 bg-gradient-to-b from-stone-900/80 to-stone-950/90 transition-all duration-300 hover:-translate-y-1 hover:border-amber-200/40 hover:shadow-[0_18px_50px_-15px_rgba(255,170,90,0.45)]"
    >
      {/* Preview swatch */}
      <div
        className="relative h-28 w-full overflow-hidden"
        style={{
          background: `linear-gradient(135deg, rgb(${accent}/0.55) 0%, rgba(20,12,8,0.85) 100%)`,
        }}
      >
        <div className="absolute inset-0 opacity-40" style={{
          background: `radial-gradient(circle at 70% 30%, rgb(${accent}/0.9), transparent 60%)`,
        }} />
        <div className="absolute inset-0 flex items-center justify-center text-3xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
          {payload.emoji ?? (item.kind === "theme" ? "🔥" : item.kind === "accessory" ? "✨" : item.kind === "icon" ? "◎" : "🏷️")}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-stone-950 to-transparent" />
      </div>
      <div className="flex flex-1 flex-col p-3">
        <div className="font-bold text-amber-50">{item.name}</div>
        {item.description && <div className="mt-0.5 line-clamp-2 text-[11px] text-white/55">{item.description}</div>}
        <div className="mt-3 flex items-center justify-between gap-2">
          {owned ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-1 text-[11px] font-bold text-emerald-300 ring-1 ring-emerald-400/30">
              <Check className="h-3 w-3" /> Owned
            </span>
          ) : (
            <PriceTag value={price} />
          )}
          {!owned && (
            <button
              disabled={busy || !price}
              onClick={onBuy}
              className="rounded-md bg-gradient-to-b from-amber-400 to-amber-600 px-3 py-1 text-[11px] font-bold text-amber-950 shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {price ? "Buy" : "—"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function BundleCard({ item, owned, onBuy, busy }: { item: Item; owned: boolean; onBuy: () => void; busy: boolean }) {
  // Map bundle_contents prefixes -> icon + label so the cover reflects what's inside
  const contentSummary = (() => {
    const counts = { theme: 0, accessory: 0, badge: 0, icon: 0 } as Record<string, number>;
    for (const c of item.bundle_contents) {
      if (c.startsWith("theme.")) counts.theme++;
      else if (c.startsWith("acc.")) counts.accessory++;
      else if (c.startsWith("badge.")) counts.badge++;
      else if (c.startsWith("icon.")) counts.icon++;
    }
    return [
      { key: "theme", n: counts.theme, Icon: Palette, label: "Themes", tint: "from-rose-400 to-amber-500" },
      { key: "accessory", n: counts.accessory, Icon: Stars, label: "Accessories", tint: "from-amber-300 to-orange-500" },
      { key: "badge", n: counts.badge, Icon: Award, label: "Badges", tint: "from-emerald-400 to-amber-500" },
      { key: "icon", n: counts.icon, Icon: Crown, label: "Icons", tint: "from-violet-400 to-amber-500" },
    ].filter((x) => x.n > 0);
  })();

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-amber-200/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_-15px_rgba(255,170,90,0.55)]"
      style={{
        background:
          "linear-gradient(135deg, rgba(60,30,15,0.95) 0%, rgba(120,55,25,0.85) 60%, rgba(200,110,55,0.6) 100%)",
      }}
    >
      <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full opacity-50 blur-2xl" style={{ background: "radial-gradient(circle, #f5b56a, transparent 70%)" }} />
      <div className="relative flex flex-col p-5">
        <div className="mb-3 flex items-center gap-2">
          <Gift className="h-4 w-4 text-amber-200" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-100/85">Bundle</span>
          <span className="ml-auto rounded-full bg-black/35 px-2 py-0.5 text-[9px] font-bold text-amber-100/90 ring-1 ring-amber-200/25">
            {item.bundle_contents.length} items
          </span>
        </div>
        <h4 className="text-lg font-black text-amber-50 drop-shadow">{item.name}</h4>
        <p className="mt-1 text-xs text-amber-100/75">{item.description}</p>

        {/* Icon summary of bundle contents */}
        {contentSummary.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {contentSummary.map(({ key, n, Icon, label, tint }) => (
              <div
                key={key}
                className="flex items-center gap-1.5 rounded-lg bg-black/40 px-2 py-1 ring-1 ring-amber-200/20"
                title={`${n} ${label}`}
              >
                <span className={`grid h-5 w-5 place-items-center rounded-md bg-gradient-to-br ${tint} text-stone-950 shadow-[0_2px_8px_rgba(255,170,80,0.45)]`}>
                  <Icon className="h-3 w-3" strokeWidth={2.5} />
                </span>
                <span className="text-[10px] font-bold text-amber-50">×{n}</span>
                <span className="text-[10px] text-amber-100/70">{label}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-1">
          {item.bundle_contents.map((c) => (
            <span key={c} className="rounded-md bg-black/35 px-1.5 py-0.5 text-[10px] font-semibold text-amber-100/90 ring-1 ring-amber-200/20">
              {c.replace(/^(theme|acc|badge|icon)\./, "")}
            </span>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between">
          {owned ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-200 ring-1 ring-emerald-400/30">
              <Check className="h-3.5 w-3.5" /> Owned
            </span>
          ) : (
            <PriceTag value={item.price_coins} big />
          )}
          {!owned && (
            <button
              disabled={busy}
              onClick={onBuy}
              className="rounded-lg bg-amber-50 px-4 py-1.5 text-xs font-black text-stone-900 shadow-md transition hover:bg-white disabled:opacity-50"
            >
              Purchase
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PriceTag({ value, big }: { value: number | null; big?: boolean }) {
  if (!value) return <span className="text-[11px] text-white/40">—</span>;
  return (
    <span className={`inline-flex items-center gap-1 font-bold text-amber-300 ${big ? "text-base" : "text-xs"}`}>
      <Coins className={big ? "h-4 w-4" : "h-3 w-3"} />
      <span className="tabular-nums">{value.toLocaleString()}</span>
    </span>
  );
}

type Quest = { id: string; name: string; description: string; difficulty: string; reward_coins: number | null; repeatable: boolean; kind: string };
type Progress = { quest_id: string; completed: boolean; claimed: boolean; progress: unknown };

function QuestsPanel({ quests, progress, onClaim, busy }: { quests: Quest[]; progress: Progress[]; onClaim: (id: string) => void; busy: boolean }) {
  const byQ = new Map(progress.map((p) => [p.quest_id, p]));
  return (
    <div>
      <div className="mb-6 rounded-2xl border border-amber-200/15 bg-gradient-to-br from-amber-950/40 to-stone-950 p-5">
        <div className="flex items-center gap-2 text-amber-200">
          <Trophy className="h-4 w-4" />
          <span className="text-[10px] font-bold uppercase tracking-[0.25em]">Daily & Ongoing</span>
        </div>
        <p className="mt-1 text-sm text-amber-100/75">
          Complete quests to earn coins. Watch quests are verified by attendance — skipping won't count.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {quests.map((q) => {
          const p = byQ.get(q.id);
          const done = !!p?.completed;
          const claimed = !!p?.claimed && !q.repeatable;
          return (
            <div key={q.id} className="group flex flex-col gap-2 rounded-xl border border-amber-100/10 bg-gradient-to-b from-stone-900/80 to-stone-950/90 p-4 transition hover:border-amber-200/35">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-amber-50">{q.name}</h4>
                    <DifficultyChip d={q.difficulty} />
                  </div>
                  <p className="mt-0.5 text-xs text-white/55">{q.description}</p>
                </div>
                <PriceTag value={q.reward_coins} />
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-white/40">
                  {claimed ? "Claimed" : done ? "Ready to claim" : "In progress"}
                </span>
                <button
                  disabled={!done || claimed || busy}
                  onClick={() => onClaim(q.id)}
                  className="rounded-md bg-gradient-to-b from-amber-400 to-amber-600 px-3 py-1 text-[11px] font-bold text-amber-950 shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {claimed ? "Claimed" : done ? "Claim" : "Locked"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DifficultyChip({ d }: { d: string }) {
  const styles: Record<string, string> = {
    easy: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
    medium: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
    hard: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ring-1 ${styles[d] ?? styles.easy}`}>{d}</span>
  );
}