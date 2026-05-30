import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/polaris/AppShell";
import { ComingSoon } from "@/components/polaris/ComingSoon";

export const Route = createFileRoute("/ai")({
  head: () => ({ meta: [{ title: "AI Tools — Polaris One" }] }),
  component: () => <AppShell><ComingSoon title="AI Tools" /></AppShell>,
});