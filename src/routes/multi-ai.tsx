import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/polaris/AppShell";
import { MultiModelAI } from "@/components/polaris/ai/MultiModelAI";

export const Route = createFileRoute("/multi-ai")({
  head: () => ({
    meta: [
      { title: "Multi-Model AI — Polaris One" },
      { name: "description", content: "Run two AI models in the same chat so they can collaborate, debate, and solve complicated tasks together." },
    ],
  }),
  component: () => (
    <AppShell hideDock>
      <MultiModelAI />
    </AppShell>
  ),
});