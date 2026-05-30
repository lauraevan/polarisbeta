import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/polaris/AppShell";
import { PolarisFlix } from "@/components/polaris/streaming/PolarisFlix";

export const Route = createFileRoute("/media")({
  head: () => ({ meta: [{ title: "PolarisFlix — Polaris One" }] }),
  component: () => <AppShell><PolarisFlix /></AppShell>,
});