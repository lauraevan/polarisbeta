import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/polaris/AppShell";
import { ComingSoon } from "@/components/polaris/ComingSoon";

export const Route = createFileRoute("/media")({
  head: () => ({ meta: [{ title: "Media — Polaris One" }] }),
  component: () => <AppShell><ComingSoon title="Media" /></AppShell>,
});