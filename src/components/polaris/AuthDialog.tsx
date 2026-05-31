import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, User as UserIcon, Lock, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import logo from "@/assets/polaris-logo.png";

export function AuthDialog({ open, onClose, defaultMode = "signup" }: { open: boolean; onClose: () => void; defaultMode?: "signin" | "signup" }) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">(defaultMode);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setMode(defaultMode);
  }, [defaultMode, open]);

  if (!open || typeof document === "undefined") return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const fn = mode === "signin" ? signIn : signUp;
    const { error } = await fn(username, password);
    setBusy(false);
    if (error) {
      setErr(error);
      return;
    }
    onClose();
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[500] overflow-y-auto bg-black/92 text-white backdrop-blur-2xl animate-[fadeIn_180ms_ease]"
    >
      <button
        onClick={onClose}
        className="fixed right-4 top-4 z-10 rounded-full bg-white/10 p-3 text-white/70 hover:bg-white/20 hover:text-white"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>
      <div
        className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-8 px-5 py-16 md:grid-cols-[1fr_440px] md:px-10"
      >
        <section className="hidden md:block">
          <img src={logo} alt="Polaris One" className="h-20 w-20 object-contain" />
          <h1 className="mt-6 max-w-xl text-5xl font-black tracking-tight">Your Polaris profile unlocks chat, themes, and recommendations.</h1>
          <p className="mt-4 max-w-lg text-sm leading-6 text-white/55">No email box, no weird side panel. Just a username and password for Polaris One.</p>
        </section>

        <section
          onClick={(e) => e.stopPropagation()}
          className="liquid-glass-themed w-full overflow-hidden rounded-3xl border border-white/15 p-5 shadow-2xl sm:p-7"
          style={{ background: "linear-gradient(160deg, rgba(var(--polaris-accent)/0.22), rgba(12,10,9,0.9))" }}
        >
        <div className="mb-5 flex items-center gap-3">
          <div
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl"
            style={{ background: "rgba(var(--polaris-accent)/0.3)" }}
          >
            <img src={logo} alt="" className="h-7 w-7 object-contain" />
          </div>
          <div>
            <h2 className="text-lg font-bold sm:text-xl">
              {mode === "signin" ? "Sign in to Polaris" : "Sign up to Polaris"}
            </h2>
            <p className="text-xs leading-relaxed text-white/55">
              {mode === "signin"
                ? "Welcome back, traveler."
                : "Create your Polaris profile — just a username and password."}
            </p>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 rounded-2xl border border-white/10 bg-black/20 p-1">
          {(["signup", "signin"] as const).map((next) => (
            <button
              key={next}
              type="button"
              onClick={() => {
                setErr(null);
                setMode(next);
              }}
              className={`rounded-xl px-3 py-2 text-xs font-bold ${
                mode === next ? "bg-white text-black" : "text-white/65 hover:bg-white/10 hover:text-white"
              }`}
            >
              {next === "signup" ? "Create" : "Sign in"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-white/55">
              Username
            </span>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
              <UserIcon className="h-4 w-4 text-white/50" />
              <input
                autoFocus
                required
                minLength={3}
                maxLength={24}
                pattern="[a-zA-Z0-9_]+"
                title="Letters, numbers and underscores"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="polaris_user"
                className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
              />
            </div>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-white/55">
              Password
            </span>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
              <Lock className="h-4 w-4 text-white/50" />
              <input
                required
                type="password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
              />
            </div>
          </label>

          {err && (
            <div className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {err}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-black transition hover:bg-white/90 disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-white/55">
          {mode === "signin" ? "Don't have an account? " : "Already have one? "}
          <button
            type="button"
            onClick={() => {
              setErr(null);
              setMode((m) => (m === "signin" ? "signup" : "signin"));
            }}
            className="font-semibold text-white underline-offset-2 hover:underline"
          >
            {mode === "signin" ? "Sign up" : "Sign in"}
          </button>
        </div>
        <p className="mt-3 text-center text-[10px] text-white/35">
          No email required. Your Polaris username is private to this OS.
        </p>
        </section>
      </div>
    </div>,
    document.body,
  );
}