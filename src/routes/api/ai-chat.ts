import { createFileRoute } from "@tanstack/react-router";

type Msg = { role: "system" | "user" | "assistant"; content: string };

type Provider = "lovable" | "groq" | "openrouter";

const MODEL_ALIASES: Record<string, string> = {
  "openrouter/x-ai/grok-2-1212": "openrouter/x-ai/grok-4.3",
  "openrouter/anthropic/claude-3.5-sonnet": "openrouter/anthropic/claude-sonnet-4.5",
  "openrouter/anthropic/claude-3.7-sonnet": "openrouter/anthropic/claude-sonnet-4.6",
  "openrouter/mistralai/mistral-large": "openrouter/mistralai/mistral-large-2512",
};

const PROVIDER_FALLBACK: Record<Provider, { provider: Provider; model: string }> = {
  groq: { provider: "groq", model: "llama-3.1-8b-instant" },
  openrouter: { provider: "openrouter", model: "meta-llama/llama-3.3-70b-instruct:free" },
  lovable: { provider: "lovable", model: "google/gemini-2.5-flash" },
};

/**
 * Resolve a model id like `groq/llama-3.3-70b-versatile` or `openrouter/anthropic/claude-3.5-sonnet`
 * into a provider + the actual upstream model id.
 */
function resolveProvider(modelId: string): { provider: Provider; model: string } {
  const normalized = MODEL_ALIASES[modelId] ?? modelId;
  if (normalized.startsWith("groq/")) return { provider: "groq", model: normalized.slice("groq/".length) };
  if (normalized.startsWith("openrouter/")) return { provider: "openrouter", model: normalized.slice("openrouter/".length) };
  return { provider: "lovable", model: normalized };
}

async function callUpstream(provider: Provider, model: string, messages: Msg[]) {
  if (provider === "groq") {
    const key = process.env.GROQ_API_KEY;
    if (!key) throw new Error("GROQ_API_KEY not configured");
    return fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, stream: true }),
    });
  }
  if (provider === "openrouter") {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) throw new Error("OPENROUTER_API_KEY not configured");
    return fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://polarisbeta.lovable.app",
        "X-Title": "Polaris One",
      },
      body: JSON.stringify({ model, messages, stream: true }),
    });
  }
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY not configured");
  return fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, stream: true }),
  });
}

export const Route = createFileRoute("/api/ai-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { model?: string; messages?: Msg[]; system?: string };
          const requested = body.model || "google/gemini-3-flash-preview";
          const { provider, model } = resolveProvider(requested);
          const messages: Msg[] = [];
          if (body.system) messages.push({ role: "system", content: body.system });
          for (const m of body.messages || []) messages.push(m);

          let upstream = await callUpstream(provider, model, messages);

          // Auto-fallback for removed model IDs, exhausted provider credits, and rate limits.
          // Third-party models stay on their third-party providers so standard users don't spill into Lovable AI credits.
          if ([400, 402, 404, 429].includes(upstream.status)) {
            const fallback = PROVIDER_FALLBACK[provider];
            if (!(fallback.provider === provider && fallback.model === model)) {
              console.warn(`[ai-chat] ${provider}/${model} returned ${upstream.status}; falling back to ${fallback.provider}/${fallback.model}`);
              upstream = await callUpstream(fallback.provider, fallback.model, messages);
            }
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