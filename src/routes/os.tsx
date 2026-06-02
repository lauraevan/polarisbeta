import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/polaris/AppShell";
import { Download, HardDrive, Cpu, Shield, Sparkles, Clock } from "lucide-react";

export const Route = createFileRoute("/os")({
  head: () => ({
    meta: [
      { title: "Polaris OS — Coming Soon" },
      { name: "description", content: "Polaris OS: the bootable, installable build of Polaris. Coming soon." },
    ],
  }),
  component: OsPage,
});

const BUILDS = [
  { id: "win", label: "Windows installer", ext: ".exe", size: "~480 MB", icon: "🪟" },
  { id: "mac", label: "macOS bundle", ext: ".dmg", size: "~510 MB", icon: "🍎" },
  { id: "linux", label: "Linux AppImage", ext: ".AppImage", size: "~470 MB", icon: "🐧" },
  { id: "iso", label: "Bootable ISO", ext: ".iso", size: "~1.4 GB", icon: "💿" },
] as const;

function OsPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 text-white">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600">
            <HardDrive className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.32em] text-white/55">Polaris</div>
            <h1 className="text-3xl font-black tracking-tight">Polaris OS</h1>
            <div className="text-sm text-white/60">A bootable, installable version of Polaris. Coming soon.</div>
          </div>
        </div>

        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/15 via-sky-500/5 to-transparent p-6 sm:p-10">
          <div className="absolute right-6 top-6 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/80">
            <Clock className="h-3 w-3" /> Teaser
          </div>
          <Sparkles className="mb-4 h-8 w-8 text-sky-300" />
          <h2 className="text-2xl font-black sm:text-3xl">Take Polaris off the browser.</h2>
          <p className="mt-3 max-w-2xl text-sm text-white/70 sm:text-base">
            Polaris OS will ship as a desktop install and a bootable image — full launcher, browser, music, chat, and
            soundboard, no tab required. Builds aren't downloadable yet; this page is a teaser so we can gauge interest
            and gather your platform preferences.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {BUILDS.map((b) => (
              <button
                key={b.id}
                disabled
                className="group flex flex-col items-start gap-2 rounded-2xl border border-white/10 bg-black/30 p-4 text-left opacity-90 transition hover:bg-black/40 disabled:cursor-not-allowed"
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-2xl">{b.icon}</span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/70">
                    Soon
                  </span>
                </div>
                <div className="text-sm font-bold">{b.label}</div>
                <div className="text-[11px] text-white/45">PolarisOS-1.0{b.ext} · {b.size}</div>
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/70">
                  <Download className="h-3 w-3" /> Notify me
                </div>
              </button>
            ))}
          </div>
        </section>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Feature icon={Cpu} title="Native performance" body="Built on Tauri + WebView2/WebKit. Boots in seconds, runs cool." />
          <Feature icon={Shield} title="Sandboxed" body="Each app — browser, music, chat — runs in its own isolated process." />
          <Feature icon={Sparkles} title="One launcher" body="All your Polaris stuff, pinned to the dock. No more tab chaos." />
        </div>
      </div>
    </AppShell>
  );
}

function Feature({ icon: Icon, title, body }: { icon: typeof Cpu; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <Icon className="mb-2 h-5 w-5 text-sky-300" />
      <div className="text-sm font-bold">{title}</div>
      <div className="mt-1 text-xs text-white/60">{body}</div>
    </div>
  );
}