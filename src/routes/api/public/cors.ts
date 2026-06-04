import { createFileRoute } from "@tanstack/react-router";

// Generic, read-only HTTPS pass-through used by the downloadable PolarisFlix
// app in place of public CORS proxies (allorigins, corsproxy.io, codetabs,
// thingproxy, cooks.fyi, etc). Constraints:
//   - GET only
//   - HTTPS targets only (no http://, no IPs, no userinfo)
//   - Response capped at 5 MB
//   - Strips cookies / Set-Cookie / auth headers in both directions
//   - Caches 5 minutes
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const MAX_BYTES = 5 * 1024 * 1024;

function isSafeTarget(u: URL): boolean {
  if (u.protocol !== "https:") return false;
  if (u.username || u.password) return false;
  // Block raw IPv4/IPv6 literals
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(u.hostname)) return false;
  if (u.hostname.includes(":")) return false;
  if (!u.hostname.includes(".")) return false;
  return true;
}

export const Route = createFileRoute("/api/public/cors")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async ({ request }) => {
        const u = new URL(request.url);
        const target = u.searchParams.get("url");
        if (!target) {
          return new Response("missing ?url", { status: 400, headers: CORS });
        }
        let parsed: URL;
        try {
          parsed = new URL(target);
        } catch {
          return new Response("bad url", { status: 400, headers: CORS });
        }
        if (!isSafeTarget(parsed)) {
          return new Response("unsafe target", { status: 403, headers: CORS });
        }
        try {
          const upstream = await fetch(parsed.toString(), {
            method: "GET",
            redirect: "follow",
            headers: { "User-Agent": "PolarisFlix/1.0", Accept: "*/*" },
          });
          const buf = await upstream.arrayBuffer();
          if (buf.byteLength > MAX_BYTES) {
            return new Response("payload too large", { status: 413, headers: CORS });
          }
          const ct = upstream.headers.get("content-type") ?? "application/octet-stream";
          return new Response(buf, {
            status: upstream.status,
            headers: {
              "Content-Type": ct,
              "Cache-Control": "public, max-age=300",
              ...CORS,
            },
          });
        } catch (e) {
          return new Response(
            JSON.stringify({ error: "upstream", message: e instanceof Error ? e.message : "fetch failed" }),
            { status: 502, headers: { "Content-Type": "application/json", ...CORS } },
          );
        }
      },
    },
  },
});