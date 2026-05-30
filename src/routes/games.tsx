import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/polaris/AppShell";
import { ComingSoon } from "@/components/polaris/ComingSoon";

export const Route = createFileRoute("/games")({
  head: () => ({ meta: [{ title: "Games — Polaris One" }] }),
  component: () => <AppShell><ComingSoon title="Games" /></AppShell>,
});