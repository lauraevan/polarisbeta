import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/polaris/AppShell";
import { MovieDeck } from "@/components/polaris/streaming/MovieDeck";

export const Route = createFileRoute("/deck")({
  head: () => ({ meta: [{ title: "Movie Deck — Polaris One" }] }),
  component: () => (
    <AppShell>
      <MovieDeck />
    </AppShell>
  ),
});