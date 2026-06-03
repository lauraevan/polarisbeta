import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/polaris/AppShell";
import { Monitor, ExternalLink, RefreshCw, Maximize2 } from "lucide-react";

export const Route = createFileRoute("/remote")({
  head: () => ({
    meta: [
      { title: "Remote PC — Polaris One" },
      { name: "description", content: "Access your home computer from school through Warpdesk, inside Polaris." },
    ],
  }),
  component: RemotePage,
});

function RemotePage() {
  const [key, setKey] = useState(0);
  return (
    <AppShell>
      <div className="flex h-full flex-col text-white">
        <header className="flex items-center gap-3 border-b border-white/10 bg-black/30 px-5 py-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-sky-400 to-indigo-600">
            <Monitor className="h-4 w-4 text-black" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold">Remote PC · Warpdesk</div>
            <div className="text-[11px] text-white/55">
              Sign in to your Warpdesk account to control your home computer from anywhere.
            </div>
          </div>
          <button
            onClick={() => setKey((k) => k + 1)}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold hover:bg-white/10"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Reload
          </button>
          <a
            href="https://warpdesk.app/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold hover:bg-white/10"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Open in tab
          </a>
          <button
            onClick={() => {
              const el = document.getElementById("warpdesk-frame");
              el?.requestFullscreen?.();
            }}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold hover:bg-white/10"
          >
            <Maximize2 className="h-3.5 w-3.5" /> Fullscreen
          </button>
        </header>
        <div className="relative flex-1 bg-black">
          <iframe
            id="warpdesk-frame"
            key={key}
            src="https://warpdesk.app/"
            title="Warpdesk Remote Desktop"
            className="absolute inset-0 h-full w-full border-0"
            allow="clipboard-read; clipboard-write; fullscreen; gamepad; microphone; camera; display-capture; autoplay"
            allowFullScreen
          />
        </div>
      </div>
    </AppShell>
  );
}