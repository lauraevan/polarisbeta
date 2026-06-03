import { createFileRoute, redirect } from "@tanstack/react-router";

// Image Gen 2 now lives inline inside Polaris AI (tap the image icon).
export const Route = createFileRoute("/image-gen")({
  beforeLoad: () => { throw redirect({ to: "/ai" }); },
  component: () => null,
});