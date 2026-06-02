import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/polaris/AppShell";
import t9Logo from "@/assets/t9-logo.asset.json";
import mizuLogo from "@/assets/mizu-logo.asset.json";

export const Route = createFileRoute("/partners")({
  head: () => ({ meta: [{ title: "Partners — Polaris One" }] }),
  component: PartnersPage,
});

const PARTNERS = [
  { name: "T9 OS", url: "https://t9os.space", logo: t9Logo.url },
  { name: "Mizu Math", url: "https://mizumath.com", logo: mizuLogo.url },
];

function PartnersPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-6 py-14">
        <div className="mb-10 text-center">
          <div className="text-[10px] uppercase tracking-[0.32em] text-white/55">Polaris One</div>
          <h1 className="mt-2 text-3xl font-bold text-white">Our Partners</h1>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {PARTNERS.map((p) => (
            <a
              key={p.name}
              href={p.url}
              target="_blank"
              rel="noreferrer"
              aria-label={p.name}
              className="liquid-glass group flex aspect-square items-center justify-center rounded-3xl p-10 transition-all hover:scale-[1.02]"
              style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)" }}
            >
              <img
                src={p.logo}
                alt={p.name}
                className="max-h-[70%] max-w-[70%] object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </a>
          ))}
        </div>
      </div>
    </AppShell>
  );
}