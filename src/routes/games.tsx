import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/polaris/AppShell";
import { GamesHub } from "@/components/polaris/games/GamesHub";

export const Route = createFileRoute("/games")({
  head: () => ({ meta: [{ title: "Games — Polaris One" }] }),
  component: () => <AppShell><GamesHub /></AppShell>,
});