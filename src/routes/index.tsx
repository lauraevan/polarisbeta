import { createFileRoute } from "@tanstack/react-router";
import { HomeScreen } from "@/components/polaris/HomeScreen";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Polaris One — Web OS Hub" },
      { name: "description", content: "A cinematic Polaris-themed web OS hub with customizable wallpapers, glass UI, and quick shortcuts." },
      { property: "og:title", content: "Polaris One — Web OS Hub" },
      { property: "og:description", content: "Your warm, cinematic web hub. Shortcuts, search, and a wallpaper that themes the whole interface." },
    ],
  }),
  component: Index,
});

function Index() {
  return <HomeScreen />;
}
