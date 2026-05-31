// Tenor v2 anonymous endpoint. The public demo key works for low-volume use.
// If it rate-limits, swap in TENOR_KEY via a Lovable secret later.
const KEY = "AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ";
const CK = "polaris-one";

export type TenorGif = {
  id: string;
  title: string;
  url: string;     // tiny webm
  preview: string; // tiny preview
  full: string;    // medium gif
};

function pickMedia(it: { media_formats: Record<string, { url: string }> }) {
  const m = it.media_formats;
  return {
    full: (m.gif || m.tinygif || m.mediumgif)?.url,
    preview: (m.tinygif || m.nanogif || m.gif)?.url,
    url: (m.tinygif || m.gif)?.url,
  };
}

export async function tenorSearch(q: string, limit = 24, signal?: AbortSignal): Promise<TenorGif[]> {
  const endpoint = q.trim()
    ? `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(q)}&key=${KEY}&client_key=${CK}&limit=${limit}&media_filter=tinygif,gif`
    : `https://tenor.googleapis.com/v2/featured?key=${KEY}&client_key=${CK}&limit=${limit}&media_filter=tinygif,gif`;
  const r = await fetch(endpoint, { signal });
  if (!r.ok) throw new Error("Tenor " + r.status);
  const j = await r.json();
  return (j.results || []).map((it: { id: string; title: string; content_description?: string; media_formats: Record<string, { url: string }> }) => {
    const m = pickMedia(it);
    return {
      id: it.id,
      title: it.title || it.content_description || "gif",
      full: m.full || "",
      preview: m.preview || "",
      url: m.url || "",
    };
  }).filter((g: TenorGif) => g.full);
}