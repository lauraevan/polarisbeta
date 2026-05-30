import { useState } from "react";
import { Gamepad2, Globe, Calculator, Cloud, Library, Play } from "lucide-react";
import { PolarisCollection } from "./PolarisCollection";
import { EmbedFrame } from "./EmbedFrame";
import { GnMathCollection } from "./GnMathCollection";
import { HydraCatalog } from "./HydraCatalog";

type TabId = "home" | "polaris" | "cine" | "hydra" | "gnmath";

const TABS: { id: TabId; label: string; icon: typeof Gamepad2 }[] = [
  { id: "home", label: "Store", icon: Library },
  { id: "polaris", label: "Polaris Collection", icon: Gamepad2 },
  { id: "cine", label: "Cine Cloud", icon: Cloud },
  { id: "hydra", label: "Hydra", icon: Globe },
  { id: "gnmath", label: "Gn-Math", icon: Calculator },
];

// Steam-inspired monochrome card
function StoreCard({
  title,
  desc,
  tag,
  onOpen,
  cta = "Open",
}: {
  title: string;
  desc: string;
  tag?: string;
  onOpen: () => void;
  cta?: string;
}) {
  return (
    <button
      onClick={onOpen}
      className="group relative flex h-48 w-full flex-col justify-between overflow-hidden rounded-lg border border-white/5 bg-zinc-900/80 p-5 text-left transition hover:border-[rgb(var(--polaris-accent))]/60 hover:bg-zinc-900"
    >
      <div
        className="absolute inset-0 -z-10 opacity-40 transition group-hover:opacity-70"
        style={{
          background:
            "radial-gradient(ellipse at top right, rgba(var(--polaris-accent)/0.25), transparent 60%)",
        }}
      />
      <div>
        {tag && (
          <div className="mb-2 inline-block rounded-sm bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/70">
            {tag}
          </div>
        )}
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <p className="mt-1 line-clamp-3 text-xs text-white/60">{desc}</p>
      </div>
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <span className="rounded-sm bg-[rgb(var(--polaris-accent))]/90 px-3 py-1 text-xs text-black">
          <Play className="mr-1 inline h-3 w-3 fill-current" />
          {cta}
        </span>
      </div>
    </button>
  );
}

function HomeTab({ onJump }: { onJump: (id: TabId) => void }) {
  return (
    <div className="space-y-8">
      {/* Featured banner */}
      <div className="relative overflow-hidden rounded-lg border border-white/10 bg-zinc-900">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(110deg, rgba(var(--polaris-accent)/0.35) 0%, rgba(var(--polaris-accent)/0.08) 45%, transparent 70%)",
          }}
        />
        <div className="relative grid gap-6 p-8 sm:grid-cols-[1fr_auto] sm:items-end sm:p-12">
          <div className="max-w-xl">
            <div className="mb-2 text-[10px] uppercase tracking-[0.35em] text-white/55">
              Featured · Polaris Arcade
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
              Your entire library. One launcher.
            </h1>
            <p className="mt-3 text-sm text-white/65 sm:text-base">
              Instant-play HTML5 classics, full PC titles in the cloud, and the
              open-source Hydra catalog — no installs, no downloads.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onJump("polaris")}
              className="flex items-center gap-2 rounded-sm bg-[rgb(var(--polaris-accent))] px-5 py-2.5 text-sm font-semibold text-black transition hover:brightness-110"
            >
              <Play className="h-4 w-4 fill-current" /> Play Now
            </button>
            <button
              onClick={() => onJump("cine")}
              className="rounded-sm border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Cloud Stream
            </button>
          </div>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/55">
          Categories
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StoreCard
            title="Polaris Collection"
            desc="2,685 single-file HTML5 games. One click and play — no install."
            tag="Browser"
            onOpen={() => onJump("polaris")}
            cta="Browse"
          />
          <StoreCard
            title="Cine Cloud"
            desc="Stream full PC games from the cloud. Powered by Cine-Cloud OS."
            tag="Cloud"
            onOpen={() => onJump("cine")}
            cta="Stream"
          />
          <StoreCard
            title="Hydra"
            desc="Open-source launcher catalog — discover community repacks."
            tag="Catalog"
            onOpen={() => onJump("hydra")}
            cta="Open"
          />
          <StoreCard
            title="Gn-Math"
            desc="The full Gn-Math unblocked library, embedded."
            tag="Embed"
            onOpen={() => onJump("gnmath")}
            cta="Open"
          />
        </div>
      </section>
    </div>
  );
}

function SimpleEmbedTab({
  title,
  desc,
  href,
  cta,
}: {
  title: string;
  desc: string;
  href: string;
  cta: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-white/10 bg-zinc-900/80 p-6">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm text-white/65">{desc}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setOpen(true)}
            className="rounded-sm bg-[rgb(var(--polaris-accent))] px-5 py-2 text-sm font-semibold text-black transition hover:brightness-110"
          >
            {cta}
          </button>
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="rounded-sm border border-white/15 bg-white/5 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Open in new tab
          </a>
        </div>
      </div>
      {open && (
        <EmbedFrame src={href} title={title} onClose={() => setOpen(false)} />
      )}
    </div>
  );
}

export function GamesHub() {
  const [tab, setTab] = useState<TabId>("home");
  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-6 pb-32 sm:px-6">
        {/* Steam-style horizontal nav */}
        <div className="sticky top-0 z-10 -mx-4 mb-6 border-b border-white/5 bg-zinc-950/85 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
          <div className="flex items-center gap-1 overflow-x-auto">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-sm px-4 py-1.5 text-sm font-medium uppercase tracking-wider transition ${
                    active
                      ? "bg-white/10 text-white"
                      : "text-white/55 hover:bg-white/5 hover:text-white"
                  }`}
                  style={
                    active
                      ? { boxShadow: "inset 0 -2px 0 rgb(var(--polaris-accent))" }
                      : undefined
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {tab === "home" && <HomeTab onJump={setTab} />}
        {tab === "polaris" && <PolarisCollection />}
        {tab === "cine" && (
          <SimpleEmbedTab
            title="Cine Cloud"
            desc="Stream full PC titles from the cloud. Cine-Cloud OS streams real Windows games (Poppy Playtime, racing sims, and a growing library) to your browser — no install, no specs required. Use the Raccoon login flow inside the app to start a session."
            href="https://cinesteam.cine-softwares.workers.dev/"
            cta="Launch Cine Cloud"
          />
        )}
        {tab === "hydra" && <HydraCatalog />}
        {tab === "gnmath" && <GnMathCollection />}
      </div>
    </div>
  );
}