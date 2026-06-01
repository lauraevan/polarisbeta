import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/polaris/AppShell";
import { PolarisRecs } from "@/components/polaris/recs/PolarisRecs";

export const Route = createFileRoute("/recs")({
  head: () => ({ meta: [{ title: "Polaris Recs — Polaris One" }] }),
  component: () => <AppShell><PolarisRecs /></AppShell>,
});