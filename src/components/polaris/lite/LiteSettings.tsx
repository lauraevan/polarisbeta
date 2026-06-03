import { usePolarisMode } from "@/lib/polaris-mode";

export function LiteSettings() {
  const { mode, setMode } = usePolarisMode();

  return (
    <div className="px-4 py-6">
      <h1 className="text-xl font-bold">Settings</h1>
      <p className="mt-1 text-sm text-neutral-400">Lite-mode settings. Switch to Heavy for the full panel.</p>

      <section className="mt-6 rounded-lg border border-neutral-800 bg-neutral-900/40 p-4">
        <div className="text-xs uppercase tracking-[0.25em] text-neutral-500">Polaris Mode</div>
        <div className="mt-1 text-lg font-bold text-white">
          You're using {mode === "lite" ? "Lightweight" : "Heavyweight"}
        </div>
        <p className="mt-2 text-sm text-neutral-400">
          Lightweight skips wallpapers, animations, boot splash, and most chrome — total transfer stays under ~5&nbsp;MB.
          Heavyweight is the full cinematic Polaris.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={() => setMode("lite")}
            className={`rounded border px-3 py-2 text-sm ${mode === "lite" ? "border-white bg-white text-black font-bold" : "border-neutral-700 text-neutral-200 hover:bg-neutral-800"}`}
          >
            Lightweight
          </button>
          <button
            onClick={() => setMode("heavy")}
            className={`rounded border px-3 py-2 text-sm ${mode === "heavy" ? "border-white bg-white text-black font-bold" : "border-neutral-700 text-neutral-200 hover:bg-neutral-800"}`}
          >
            Heavyweight
          </button>
        </div>
      </section>
    </div>
  );
}