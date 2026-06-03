import { usePolarisMode, type PolarisMode } from "@/lib/polaris-mode";
import { Feather, Sparkles } from "lucide-react";

export function ModePicker() {
  const { mode, ready, setMode } = usePolarisMode();
  if (!ready || mode) return null;

  const pick = (m: PolarisMode) => setMode(m);

  return (
    <div className="fixed inset-0 z-[200] grid place-items-center bg-black px-4">
      <div className="w-full max-w-3xl">
        <div className="mb-8 text-center">
          <div className="text-[10px] uppercase tracking-[0.4em] text-white/55">Welcome to Polaris</div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-5xl">
            Pick your experience
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-sm text-white/60">
            You can switch modes any time in Settings.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <button
            onClick={() => pick("heavy")}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-orange-500/20 via-pink-500/10 to-indigo-500/20 p-6 text-left transition hover:border-white/30"
          >
            <Sparkles className="h-7 w-7 text-white" />
            <div className="mt-3 text-xl font-bold text-white">Heavyweight</div>
            <div className="mt-1 text-xs uppercase tracking-[0.25em] text-white/55">Full Polaris</div>
            <p className="mt-3 text-sm text-white/70">
              Cinematic wallpapers, liquid glass, boot animation, every page and feature.
            </p>
            <ul className="mt-4 space-y-1 text-xs text-white/55">
              <li>· Animated wallpapers & glass UI</li>
              <li>· Boot splash, dock, full sidebar</li>
              <li>· All 20+ apps and integrations</li>
            </ul>
            <div className="mt-5 inline-flex rounded-full bg-white px-4 py-1.5 text-xs font-bold text-black">
              Use Heavy
            </div>
          </button>
          <button
            onClick={() => pick("lite")}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-left transition hover:border-white/30"
          >
            <Feather className="h-7 w-7 text-white" />
            <div className="mt-3 text-xl font-bold text-white">Lightweight</div>
            <div className="mt-1 text-xs uppercase tracking-[0.25em] text-white/55">Under ~5&nbsp;MB</div>
            <p className="mt-3 text-sm text-white/70">
              Stripped, fast, minimal — like koopbin.site. No animations, no wallpapers, no chrome.
            </p>
            <ul className="mt-4 space-y-1 text-xs text-white/55">
              <li>· Plain top nav, no wallpaper</li>
              <li>· Games, AI, Flix, Music, Browser</li>
              <li>· Built for school WiFi & old laptops</li>
            </ul>
            <div className="mt-5 inline-flex rounded-full border border-white/40 px-4 py-1.5 text-xs font-bold text-white">
              Use Lite
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}