import { createFileRoute } from "@tanstack/react-router";

// Server-side ROM proxy. EmulatorJS fetches the ROM from the browser, but
// most homebrew hosts don't send CORS headers, so direct loads fail with a
// generic "Network error". We allow only a small whitelist of trusted hosts
// and re-serve the file with permissive CORS so the emulator can read it.
const ALLOWED_HOSTS = new Set([
  "demo.emulatorjs.org",
  "cdn.emulatorjs.org",
  "archive.org",
  "ia800000.us.archive.org",
  "ia800100.us.archive.org",
  "ia800200.us.archive.org",
  "ia800300.us.archive.org",
  "ia800400.us.archive.org",
  "ia800500.us.archive.org",
  "ia800600.us.archive.org",
  "ia800700.us.archive.org",
  "ia800800.us.archive.org",
  "ia800900.us.archive.org",
  "ia801000.us.archive.org",
  "ia801500.us.archive.org",
  "ia802500.us.archive.org",
  "ia803000.us.archive.org",
  "ia804500.us.archive.org",
  "tangramgames.dk",
  "www.nathanstang.com",
]);

function isAllowed(host: string) {
  if (ALLOWED_HOSTS.has(host)) return true;
  // Allow any archive.org redirect mirror (ia######.us.archive.org).
  return /^ia\d{6}\.us\.archive\.org$/.test(host);
}

export const Route = createFileRoute("/api/rom")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const u = new URL(request.url);
        const target = u.searchParams.get("url");
        if (!target) return new Response("missing ?url", { status: 400 });
        let parsed: URL;
        try {
          parsed = new URL(target);
        } catch {
          return new Response("bad url", { status: 400 });
        }
        if (!isAllowed(parsed.hostname)) {
          return new Response(`host not allowed: ${parsed.hostname}`, { status: 403 });
        }
        try {
          const upstream = await fetch(parsed.toString(), {
            headers: { "User-Agent": "PolarisEmulator/1.0" },
            redirect: "follow",
          });
          if (!upstream.ok || !upstream.body) {
            return new Response(`upstream ${upstream.status}`, { status: 502 });
          }
          return new Response(upstream.body, {
            headers: {
              "Content-Type": upstream.headers.get("Content-Type") ?? "application/octet-stream",
              "Content-Length": upstream.headers.get("Content-Length") ?? "",
              "Cache-Control": "public, max-age=86400",
              "Access-Control-Allow-Origin": "*",
            },
          });
        } catch (e) {
          return new Response("proxy error: " + (e instanceof Error ? e.message : "unknown"), {
            status: 502,
          });
        }
      },
    },
  },
});