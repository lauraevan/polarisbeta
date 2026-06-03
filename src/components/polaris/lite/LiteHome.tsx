import { Link } from "@tanstack/react-router";

const CARDS = [
  { to: "/games", label: "Games", desc: "2,685 HTML5 + Gn-Math + Hydra catalog" },
  { to: "/media", label: "Flix", desc: "Movies & TV via TMDB" },
  { to: "/music", label: "Music", desc: "Stream music" },
  { to: "/ai", label: "AI", desc: "Free Groq + OpenRouter chat" },
  { to: "/browser", label: "Browser", desc: "Proxy any site" },
  { to: "/settings", label: "Settings", desc: "Switch back to heavy mode" },
];

export function LiteHome() {
  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold">Polaris Lite</h1>
      <p className="mt-1 text-sm text-neutral-400">
        Lightweight build — fast on any device, any network.
      </p>
      <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {CARDS.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3 hover:border-neutral-600 hover:bg-neutral-900"
          >
            <div className="text-sm font-bold text-white">{c.label}</div>
            <div className="mt-1 text-xs text-neutral-500">{c.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}