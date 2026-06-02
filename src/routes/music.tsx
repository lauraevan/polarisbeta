import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/polaris/AppShell";
import { PolarisMusic } from "@/components/polaris/music/PolarisMusic";

export const Route = createFileRoute("/music")({
  head: () => ({ meta: [{ title: "Music — Polaris One" }] }),
  component: () => (
    <AppShell hideDock>
      <PolarisMusic />
    </AppShell>
  ),
});
