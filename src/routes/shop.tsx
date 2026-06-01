import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/polaris/AppShell";
import { Shop } from "@/components/polaris/shop/Shop";
import { isDesktopMode } from "@/lib/runtime-mode";
import { Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/shop")({
  head: () => ({ meta: [{ title: "Shop — Polaris One" }] }),
  component: () => {
    if (typeof window !== "undefined" && isDesktopMode()) {
      return <Navigate to="/" />;
    }
    return <AppShell><Shop /></AppShell>;
  },
});