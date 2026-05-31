import { useState } from "react";
import { createPortal } from "react-dom";
import { X, User as UserIcon, Lock, Sparkles, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function AuthDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
      className="fixed inset-0 z-[500] grid place-items-center overflow-y-auto bg-black/72 p-4 backdrop-blur-2xl animate-[fadeIn_180ms_ease]"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="liquid-glass-themed relative my-auto w-full max-w-[440px] overflow-hidden rounded-3xl border border-white/15 p-5 text-white shadow-2xl sm:p-7"
        style={{
          background:
            "linear-gradient(160deg, rgba(var(--polaris-accent)/0.22), rgba(12,10,9,0.9))",
        }}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full bg-white/10 p-2 text-white/70 hover:bg-white/20 hover:text-white"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-5 flex items-center gap-3 pr-8">
          <div
            className="grid h-12 w-12 place-items-center rounded-2xl text-2xl"
            style={{ background: "rgba(var(--polaris-accent)/0.3)" }}
          >
            <Sparkles className="h-6 w-6" />
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
      </div>
    </div>,
    document.body,
  );
}