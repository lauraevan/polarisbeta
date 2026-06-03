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
    // Do not auto-deactivate on unmount — user controls via Exit button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppShell wallpaperButton>
      <Home />
    </AppShell>
  );
}