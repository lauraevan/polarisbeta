import { useState } from "react";
import { Gamepad2, Globe, Calculator, Sparkles, Play } from "lucide-react";
import { PolarisCollection } from "./PolarisCollection";
import { EmbedFrame } from "./EmbedFrame";

type TabId = "home" | "hydra" | "gnmath" | "polaris";

const TABS: { id: TabId; label: string; icon: typeof Gamepad2 }[] = [
  { id: "home", label: "Featured", icon: Sparkles },
  { id: "hydra", label: "Hydra Network", icon: Globe },
  { id: "gnmath", label: "Gn-Math", icon: Calculator },
  { id: "polaris", label: "Polaris Collection", icon: Gamepad2 },
];

function Hero({ onJump }: { onJump: (id: TabId) => void }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 p-8 sm:p-12">
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(135deg, rgba(var(--polaris-accent)/0.35), rgba(var(--polaris-accent)/0.05) 60%, transparent)",
        }}
      />
      <div className="max-w-2xl">
        <div className="mb-2 text-[11px] uppercase tracking-[0.3em] text-white/60">
          Polaris Arcade
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
          Your library, supercharged.
        </h1>
        <p className="mt-3 max-w-lg text-sm sm:text-base text-white/70">
          Browse 2,600+ instant-play games, AAA torrent picks via Hydra, and the full
          Gn-Math collection — all in one launcher.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={() => onJump("polaris")}
            className="flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition hover:scale-105"
          >
            <Play className="h-4 w-4 fill-current" /> Play Now
          </button>
          <button
            onClick={() => onJump("hydra")}
            className="liquid-glass-themed rounded-full px-5 py-2 text-sm font-semibold text-white transition hover:scale-105"
          >
            Browse Hydra
          </button>
        </div>
      </div>
    </div>
  );
}

function FeaturedTab({ onJump }: { onJump: (id: TabId) => void }) {
  const cards = [
    {
      id: "polaris" as TabId,
      title: "Polaris Collection",
      desc: "2,685 single-file HTML games, ready to play instantly.",
      grad: "from-pink-500/40 via-purple-500/20 to-transparent",
    },
    {
      id: "hydra" as TabId,
      title: "Hydra Network",
      desc: "Open-source game launcher catalog — discover, repack, & install.",
      grad: "from-amber-500/40 via-red-500/20 to-transparent",
    },
    {
      id: "gnmath" as TabId,
      title: "Gn-Math",
      desc: "The full Gn-Math unblocked library, embedded.",
      grad: "from-teal-400/40 via-emerald-500/20 to-transparent",
    },
  ];
  return (
    <div className="space-y-6">
      <Hero onJump={onJump} />
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <button
            key={c.id}
            onClick={() => onJump(c.id)}
            className={`group relative h-44 overflow-hidden rounded-2xl border border-white/10 p-5 text-left transition hover:scale-[1.02] hover:border-white/25 bg-gradient-to-br ${c.grad}`}
          >
            <div className="absolute inset-0 bg-black/30" />
            <div className="relative flex h-full flex-col justify-end">
              <h3 className="text-lg font-bold text-white">{c.title}</h3>
              <p className="mt-1 text-xs text-white/70">{c.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function HydraTab() {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-4">
      <div className="liquid-glass-themed rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white">Hydra Network</h2>
        <p className="mt-2 max-w-2xl text-sm text-white/70">
          Hydra is an open-source game launcher with its own catalog of community-sourced
          repacks. Browse the full catalog inside Polaris.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setOpen(true)}
            className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition hover:scale-105"
          >
            Open Hydra Catalog
          </button>
          <a
            href="https://hydralauncher.gg/"
            target="_blank"
            rel="noreferrer"
            className="liquid-glass-themed rounded-full px-5 py-2 text-sm font-semibold text-white transition hover:scale-105"
          >
            Visit hydralauncher.gg
          </a>
        </div>
      </div>
      {open && (
        <EmbedFrame
          src="https://hydralauncher.gg/catalogue"
          title="Hydra Network"
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

function GnMathTab() {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-4">
      <div className="liquid-glass-themed rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white">Gn-Math</h2>
        <p className="mt-2 max-w-2xl text-sm text-white/70">
          The full Gn-Math unblocked games library, embedded directly into Polaris.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setOpen(true)}
            className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition hover:scale-105"
          >
            Open Gn-Math
          </button>
          <a
            href="https://gn-math.github.io/"
            target="_blank"
            rel="noreferrer"
            className="liquid-glass-themed rounded-full px-5 py-2 text-sm font-semibold text-white transition hover:scale-105"
          >
            Visit gn-math.github.io
          </a>
        </div>
      </div>
      {open && (
        <EmbedFrame
          src="https://gn-math.github.io/"
          title="Gn-Math"
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

export function GamesHub() {
  const [tab, setTab] = useState<TabId>("home");
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 pb-32 sm:px-6">
      {/* Tabs */}
      <div className="sticky top-0 z-10 -mx-4 mb-6 px-4 pt-2 pb-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
        <div className="liquid-glass-themed inline-flex items-center gap-1 rounded-full p-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-white text-black"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {tab === "home" && <FeaturedTab onJump={setTab} />}
      {tab === "hydra" && <HydraTab />}
      {tab === "gnmath" && <GnMathTab />}
      {tab === "polaris" && <PolarisCollection />}
    </div>
  );
}