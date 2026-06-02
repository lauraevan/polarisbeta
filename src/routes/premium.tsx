import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/polaris/AppShell";
import { Premium } from "@/components/polaris/premium/Premium";

export const Route = createFileRoute("/premium")({
  head: () => ({ meta: [{ title: "Premium — Polaris One" }] }),
  component: () => (
    <AppShell>
      <Premium />
    </AppShell>
  ),
});
