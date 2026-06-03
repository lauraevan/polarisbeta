import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/polaris/AppShell";
import { Download, HardDrive, Cpu, Shield, Sparkles } from "lucide-react";

export const Route = createFileRoute("/os")({
  head: () => ({
    meta: [
      { title: "Polaris OS — Download" },
      { name: "description", content: "Polaris OS: download the Polaris desktop bundle as a single .zip." },
    ],
  }),
  component: OsPage,
});

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
            <div className="text-sm text-white/60">Download Polaris as a single .zip — open and launch.</div>
          </div>
        </div>

        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/15 via-sky-500/5 to-transparent p-6 sm:p-10">
          <Sparkles className="mb-4 h-8 w-8 text-sky-300" />
          <h2 className="text-2xl font-black sm:text-3xl">One file. Open it. Polaris boots.</h2>
          <p className="mt-3 max-w-2xl text-sm text-white/70 sm:text-base">
            Polaris OS ships as a single <span className="font-mono text-white">Polaris.zip</span>. Extract it, open
            the file, and you get the SATURDAY boot splash followed by the full Polaris desktop — separate from the
            website, with its own dock and shell. Works on Windows, macOS, and Linux.
          </p>

          <a
            href="/downloads/Polaris.zip"
            download="Polaris.zip"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-[0_0_30px_rgba(80,140,255,0.5)] hover:brightness-110"
          >
            <Download className="h-4 w-4" /> Download Polaris.zip
          </a>
          <div className="mt-2 text-[11px] text-white/45">Polaris.zip · cross-platform · open the included file to launch</div>
        </section>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Feature icon={Cpu} title="Standalone bundle" body="Self-contained — no installer, no admin, no dependencies." />
          <Feature icon={Shield} title="Sandboxed" body="Each app — browser, music, chat — runs in its own isolated process." />
          <Feature icon={Sparkles} title="Own UI" body="Separate desktop shell, SATURDAY boot splash, and dock — not the website chrome." />
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