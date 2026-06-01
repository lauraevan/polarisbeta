import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/polaris/AppShell";
import { Shop } from "@/components/polaris/shop/Shop";

export const Route = createFileRoute("/shop")({
  head: () => ({ meta: [{ title: "Shop — Polaris One" }] }),
  component: () => <AppShell><Shop /></AppShell>,
});