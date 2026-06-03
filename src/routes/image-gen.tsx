import { createFileRoute, redirect } from "@tanstack/react-router";

// Image Gen 2 is now a sub-tab inside /ai.
export const Route = createFileRoute("/image-gen")({
  beforeLoad: () => { throw redirect({ to: "/ai", search: { tab: "image" } as never }); },
  component: () => null,
});