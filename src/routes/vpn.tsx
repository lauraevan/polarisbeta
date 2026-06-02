import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/polaris/AppShell";
import { Shield, Lock, Globe2, Zap, Eye, Download, ExternalLink, CheckCircle2, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/vpn")({
  head: () => ({
    meta: [
      { title: "VPN — Polaris One" },
      {
        name: "description",
        content: "Free, privacy-first VPN recommendations for safer browsing on Polaris One.",
      },
    ],
  }),
  component: VpnPage,
});

const FEATURES = [
  { icon: Lock, title: "No-logs policy", body: "Audited Swiss-based provider that doesn't keep activity or connection logs." },
  { icon: Zap, title: "Actually fast", body: "Unlike Tor, you can stream, game, and call without crawling speeds." },
  { icon: Globe2, title: "Unlimited data", body: "The free plan has no monthly cap — use it as your daily driver." },
  { icon: Eye, title: "Built-in leak protection", body: "Kill switch and DNS leak protection on every platform." },
];

const ALTERNATIVES = [
  {
    name: "Mullvad VPN",
    tag: "Paid · €5/mo flat",
    body: "Anonymous account numbers, no email required, cash/Monero accepted. Best-in-class privacy if you can pay.",
    href: "https://mullvad.net/",
  },
  {
    name: "IVPN",
    tag: "Paid · From $2/mo",
    body: "Audited no-logs provider with anonymous signup and a clean, minimal client.",
    href: "https://www.ivpn.net/",
  },
  {
    name: "Tor Browser",
    tag: "Free · Anonymity-focused",
    body: "Strongest anonymity for high-risk situations, but very slow and many sites break. Use only when you need it.",
    href: "https://www.torproject.org/",
  },
];

function VpnPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/15 via-cyan-500/10 to-transparent p-6 sm:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-200">
                <Shield className="h-3 w-3" /> Polaris Privacy
              </div>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Browse private. <span className="text-emerald-300">Stay safe.</span>
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-white/70 sm:text-base">
                Polaris recommends <strong className="text-white">Proton VPN Free</strong> — a Swiss, no-logs,
                unlimited-data VPN that's faster and more usable than Tor for everyday browsing while still
                protecting your traffic and identity.
              </p>
            </div>
            <div className="grid h-28 w-28 shrink-0 place-items-center self-start rounded-3xl border border-white/10 bg-white/5 backdrop-blur sm:h-32 sm:w-32">
              <Shield className="h-14 w-14 text-emerald-300 sm:h-16 sm:w-16" />
            </div>
          </div>
        </div>

        {/* Recommended */}
        <section className="mt-10">
          <div className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/55">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" /> Top pick
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Proton VPN — Free</h2>
                <p className="mt-1 text-sm text-white/60">
                  Made by the team behind Proton Mail. The only major free VPN with{" "}
                  <span className="text-white">unlimited data</span> and a verified{" "}
                  <span className="text-white">strict no-logs policy</span>.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href="https://protonvpn.com/download"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-black hover:bg-emerald-400"
                >
                  <Download className="h-4 w-4" /> Download
                </a>
                <a
                  href="https://account.protonvpn.com/signup?plan=free"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
                >
                  <ExternalLink className="h-4 w-4" /> Sign up free
                </a>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {FEATURES.map((f) => (
                <div key={f.title} className="flex gap-3 rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-400/15 text-emerald-300">
                    <f.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{f.title}</div>
                    <p className="text-xs leading-relaxed text-white/60">{f.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why not Tor */}
        <section className="mt-10 rounded-3xl border border-amber-400/20 bg-amber-400/[0.06] p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-amber-300" />
            <div>
              <h3 className="text-lg font-bold text-white">Why not just use Tor?</h3>
              <p className="mt-1 text-sm leading-relaxed text-white/70">
                Tor is excellent for high-risk anonymity, but it's very slow, breaks many sites, blocks streaming
                and games, and using it on a school or work network often raises more attention than it hides.
                For day-to-day privacy, a trusted no-logs VPN like Proton is faster, more reliable, and harder
                to fingerprint as "suspicious" traffic.
              </p>
            </div>
          </div>
        </section>

        {/* Alternatives */}
        <section className="mt-10">
          <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/55">
            Other strong options
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {ALTERNATIVES.map((a) => (
              <a
                key={a.name}
                href={a.href}
                target="_blank"
                rel="noreferrer"
                className="group rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-white/25 hover:bg-white/[0.07]"
              >
                <div className="flex items-center justify-between">
                  <div className="text-base font-bold text-white">{a.name}</div>
                  <ExternalLink className="h-4 w-4 text-white/40 group-hover:text-white" />
                </div>
                <div className="mt-1 text-[10px] uppercase tracking-wider text-white/50">{a.tag}</div>
                <p className="mt-2 text-xs leading-relaxed text-white/65">{a.body}</p>
              </a>
            ))}
          </div>
        </section>

        <p className="mt-10 text-center text-[11px] text-white/40">
          Polaris doesn't run these VPNs — install them from the official sites linked above. Never download a
          VPN from a random mirror or "cracked" client.
        </p>
      </div>
    </AppShell>
  );
}