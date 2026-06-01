import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/polaris/AppShell";
import { PolarisFlix } from "@/components/polaris/streaming/PolarisFlix";

export const Route = createFileRoute("/media")({
  head: () => ({ meta: [{ title: "Cinema — Polaris One" }] }),
  component: () => <AppShell><PolarisFlix /></AppShell>,
});