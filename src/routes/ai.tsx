import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/polaris/AppShell";
import { PolarisAI } from "@/components/polaris/ai/PolarisAI";

export const Route = createFileRoute("/ai")({
  head: () => ({ meta: [{ title: "Polaris AI — Polaris One" }] }),
  component: () => (
    <AppShell hideDock>
      <PolarisAI />
    </AppShell>
  ),
});