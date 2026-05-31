import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/polaris/AppShell";
import { PolarisBrowser } from "@/components/polaris/PolarisBrowser";

export const Route = createFileRoute("/browser")({
  head: () => ({ meta: [{ title: "Polaris Browser — Polaris One" }] }),
  component: () => (
    <AppShell>
      <PolarisBrowser />
    </AppShell>
  ),
});