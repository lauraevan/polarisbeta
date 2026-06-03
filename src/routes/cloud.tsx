import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/polaris/AppShell";
import { PolarisCloud } from "@/components/polaris/cloud/PolarisCloud";

export const Route = createFileRoute("/cloud")({
  head: () => ({
    meta: [
      { title: "Polaris Cloud — Your files, powered by Cine" },
      { name: "description", content: "Polaris Cloud: store, share, and stream your files across devices. Choose Polaris Cloud (Cine API) or bring your own custom S3-compatible cloud." },
    ],
  }),
  component: () => (
    <AppShell>
      <PolarisCloud />
    </AppShell>
  ),
});