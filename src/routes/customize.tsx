import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/polaris/AppShell";
import { Home } from "@/components/polaris/Home";
import { useCustomizer } from "@/lib/customizer-context";

export const Route = createFileRoute("/customize")({
  head: () => ({
    meta: [{ title: "Customize — Polaris One" }, { name: "description", content: "Personalize your Polaris One layout." }],
  }),
  component: CustomizePage,
});

function CustomizePage() {
  const c = useCustomizer();
  useEffect(() => {
    c.setActive(true);
    return () => c.setActive(false);
  }, [c]);

  return (
    <AppShell wallpaperButton>
      <Home />
    </AppShell>
  );
}