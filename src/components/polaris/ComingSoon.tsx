import { Sparkles } from "lucide-react";

export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 text-center">
      <div
        className="glass mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ boxShadow: `inset 0 0 0 1px rgba(var(--polaris-accent)/0.45), 0 20px 60px -20px rgba(var(--polaris-accent)/0.5)` }}
      >
        <Sparkles className="h-7 w-7" style={{ color: `rgb(var(--polaris-accent))` }} />
      </div>
      <h1 className="text-3xl font-semibold text-white">{title}</h1>
      <p className="mt-2 max-w-md text-sm text-white/60">
        This module is on the runway. We're polishing the experience to match
        the Polaris One feel — check back soon.
      </p>
    </div>
  );
}