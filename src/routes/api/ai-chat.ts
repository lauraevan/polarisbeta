import { createFileRoute } from "@tanstack/react-router";

type Msg = { role: "system" | "user" | "assistant"; content: string };

// When a paid/premium model hits 402 (credits exhausted) or 429 (rate-limited),
// fall back to a robust free model so chats like the GN Maths bot don't break.
const FALLBACK_MODEL = "google/gemini-2.5-flash";

async function callGateway(apiKey: string, model: string, messages: Msg[]) {
  return fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages, stream: true, max_tokens: 1024 }),
  });
}

export const Route = createFileRoute("/api/ai-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { model?: string; messages?: Msg[]; system?: string };
          const apiKey = process.env.LOVABLE_API_KEY;
          if (!apiKey) {
            return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }

          const model = body.model || "google/gemini-3-flash-preview";
          const messages: Msg[] = [];
          if (body.system) messages.push({ role: "system", content: body.system });
          for (const m of body.messages || []) messages.push(m);

          let upstream = await callGateway(apiKey, model, messages);

          // Auto-fallback for the GN Maths (gpt-5.4) bot and other premium models
          // when credits are exhausted or we hit a transient rate-limit.
          if (
            (upstream.status === 402 || upstream.status === 429) &&
            model !== FALLBACK_MODEL
          ) {
            console.warn(`[ai-chat] ${model} returned ${upstream.status}; falling back to ${FALLBACK_MODEL}`);
            upstream = await callGateway(apiKey, FALLBACK_MODEL, messages);
          }

          if (!upstream.ok) {
            const text = await upstream.text();
            if (upstream.status === 429) {
              return new Response(JSON.stringify({ error: "Rate limit reached. Try again in a moment." }), {
                status: 429,
                headers: { "Content-Type": "application/json" },
              });
            }
            if (upstream.status === 402) {
              return new Response(
                JSON.stringify({ error: "AI credits exhausted. Add credits in Settings → Workspace → Usage." }),
                { status: 402, headers: { "Content-Type": "application/json" } },
              );
            }
            return new Response(JSON.stringify({ error: `Upstream ${upstream.status}: ${text.slice(0, 200)}` }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }

          return new Response(upstream.body, {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
              Connection: "keep-alive",
            },
          });
        } catch (e) {
          return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});