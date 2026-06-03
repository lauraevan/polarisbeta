import { createFileRoute } from "@tanstack/react-router";

// Accepts { prompt, imageDataUrl } and returns { text } — analyzes a screen
// frame (or any image) via Lovable AI Gateway (Gemini 2.5 Flash, multimodal).
export const Route = createFileRoute("/api/ai-vision")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { prompt, imageDataUrl } = (await request.json()) as {
            prompt?: string;
            imageDataUrl?: string;
          };
          if (!imageDataUrl || !imageDataUrl.startsWith("data:image/")) {
            return new Response(JSON.stringify({ error: "Missing imageDataUrl" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }
          const key = process.env.LOVABLE_API_KEY;
          if (!key) {
            return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }
          const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                {
                  role: "system",
                  content:
                    "You are Polaris AI's vision module. Describe what is on the user's shared screen and answer their question concisely. If they didn't ask anything specific, give a clear summary of what's visible.",
                },
                {
                  role: "user",
                  content: [
                    { type: "text", text: prompt?.trim() || "What's on my screen right now?" },
                    { type: "image_url", image_url: { url: imageDataUrl } },
                  ],
                },
              ],
            }),
          });
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
            return new Response(JSON.stringify({ error: `Vision failed: ${text.slice(0, 200)}` }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }
          const j = (await upstream.json()) as { choices?: { message?: { content?: string } }[] };
          const out = j.choices?.[0]?.message?.content ?? "";
          return new Response(JSON.stringify({ text: out }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
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