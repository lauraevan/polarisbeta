import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/polaris/AppShell";
import { PolarisCloud } from "@/components/polaris/cloud/PolarisCloud";

export const Route = createFileRoute("/cloud")({
  head: () => ({
    meta: [
      { title: "Polaris Cloud Gaming — Stream AAA games in your browser" },
      { name: "description", content: "Polaris Cloud Gaming streams modern PC and console titles straight to your browser. No downloads, no installs — pick a game and play." },
    ],
  }),
  component: () => (
    <AppShell>
      <PolarisCloud />
    </AppShell>
  ),
});