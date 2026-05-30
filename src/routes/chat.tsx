import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/polaris/AppShell";
import { ComingSoon } from "@/components/polaris/ComingSoon";

export const Route = createFileRoute("/chat")({
  head: () => ({ meta: [{ title: "Chat — Polaris One" }] }),
  component: () => <AppShell><ComingSoon title="Chat" /></AppShell>,
});