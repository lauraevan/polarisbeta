import { createFileRoute, redirect } from "@tanstack/react-router";

// Multi-Model AI is now a sub-tab inside /ai.
export const Route = createFileRoute("/multi-ai")({
  beforeLoad: () => { throw redirect({ to: "/ai", search: { tab: "multi" } as never }); },
  component: () => null,
});