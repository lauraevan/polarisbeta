import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/polaris/AppShell";
import { Soundboard } from "@/components/polaris/soundboard/Soundboard";

export const Route = createFileRoute("/soundboard")({
  head: () => ({ meta: [{ title: "Soundboard — Polaris One" }] }),
  component: () => (
    <AppShell>
      <Soundboard />
    </AppShell>
  ),
});
