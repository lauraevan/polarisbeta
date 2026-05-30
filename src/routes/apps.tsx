import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/polaris/AppShell";
import { ComingSoon } from "@/components/polaris/ComingSoon";

export const Route = createFileRoute("/apps")({
  head: () => ({ meta: [{ title: "Apps — Polaris One" }] }),
  component: () => <AppShell><ComingSoon title="Apps" /></AppShell>,
});