import { createFileRoute } from "@tanstack/react-router";

// Public TMDB proxy. The downloadable PolarisFlix app calls this instead of
// shipping the TMDB read-token in plain text inside the bundle. Read-only:
// only GETs to /3/* are forwarded. Token lives server-side only.
const TMDB_BEARER =
  process.env.TMDB_BEARER ||
  "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJlMWVmNjUwNjI1OTUyYzBkMjAzNThlYzUwYjQ4MjY5NiIsIm5iZiI6MTc3OTUwMDA3OS4zODIwMDAyLCJzdWIiOiI2YTExMDQyZjFiZTVlMDcyNTE2YjU3NmUiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.G2S8E4lZ8xdk1GJzkknjh_Z0DaHgaUKmk7kEUe0oCEU";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const Route = createFileRoute("/api/public/tmdb/$")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async ({ params, request }) => {
        const splat = (params as { _splat?: string })._splat || "";
        // Whitelist: only alphanumerics, slash, dash, underscore in the path
        if (!/^[a-zA-Z0-9/_\-]+$/.test(splat)) {
          return new Response("bad path", { status: 400, headers: CORS });
        }
        const u = new URL(request.url);
        const qs = u.search; // already validated by URL parser
        const target = `https://api.themoviedb.org/3/${splat}${qs}`;
        try {
          const r = await fetch(target, {
            headers: {
              Authorization: `Bearer ${TMDB_BEARER}`,
              accept: "application/json",
            },
          });
          const body = await r.text();
          return new Response(body, {
            status: r.status,
            headers: {
              "Content-Type": "application/json; charset=utf-8",
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