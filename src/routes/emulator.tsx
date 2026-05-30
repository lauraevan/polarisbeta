import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/polaris/AppShell";
import { ComingSoon } from "@/components/polaris/ComingSoon";

export const Route = createFileRoute("/emulator")({
  head: () => ({ meta: [{ title: "Emulator — Polaris One" }] }),
  component: () => <AppShell><ComingSoon title="Emulator" /></AppShell>,
});