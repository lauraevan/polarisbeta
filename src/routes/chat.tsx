import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/polaris/AppShell";
import { ChatRoom } from "@/components/polaris/chat/ChatRoom";

export const Route = createFileRoute("/chat")({
  head: () => ({ meta: [{ title: "Chat — Polaris One" }] }),
  component: () => <AppShell hideDock><ChatRoom /></AppShell>,
});