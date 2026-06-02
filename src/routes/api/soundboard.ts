import { createFileRoute } from "@tanstack/react-router";

// Proxy soundbuttonsworld.com — their JSON endpoints are CORS-locked to their
// own origin, so the browser can't hit them directly. Audio files themselves
// (https://soundbuttonsworld.com/uploads/<fileName>) DO play fine via
// <audio>, so we only need to proxy metadata here.
const SBW = "https://soundbuttonsworld.com";
const UA = "Mozilla/5.0 (compatible; PolarisBot/1.0)";
const CACHE = "public, max-age=300, s-maxage=900, stale-while-revalidate=86400";

async function upstream(path: string) {
  const res = await fetch(`${SBW}${path}`, { headers: { "User-Agent": UA, Accept: "application/json" } });
  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: { "Content-Type": "application/json", "Cache-Control": CACHE },
  });
}

export const Route = createFileRoute("/api/soundboard")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const kind = url.searchParams.get("kind") ?? "main";
        if (kind === "main") return upstream("/api/memes/main");
        if (kind === "categories") return upstream("/api/categories/getall");
        if (kind === "category") {
          const id = url.searchParams.get("id") ?? "3";
          const page = url.searchParams.get("page") ?? "1";
          // memes by category — query format reverse-engineered from the SPA
          return upstream(`/api/memes/category?categoryId=${encodeURIComponent(id)}&page=${encodeURIComponent(page)}`);
        }
        if (kind === "search") {
          const q = url.searchParams.get("q") ?? "";
          return upstream(`/api/search?q=${encodeURIComponent(q)}`);
        }
        return new Response(JSON.stringify({ error: "unknown kind" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});