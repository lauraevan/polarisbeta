import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/polaris/AppShell";
import { Emulator } from "@/components/polaris/emulator/Emulator";

export const Route = createFileRoute("/emulator")({
  head: () => ({ meta: [{ title: "Emulator — Polaris One" }] }),
  component: () => (
    <AppShell hideDock>
      <Emulator />
    </AppShell>
  ),
});