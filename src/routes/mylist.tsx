import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/polaris/AppShell";
import { MyListPage } from "@/components/polaris/MyListPage";

export const Route = createFileRoute("/mylist")({
  head: () => ({ meta: [{ title: "My List — Polaris One" }] }),
  component: () => <AppShell><MyListPage /></AppShell>,
});