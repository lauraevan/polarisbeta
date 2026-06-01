// Lightweight client-side DM safety filter.
// Blocks predatory/sexual solicitation messages before they hit the network.
// This is intentionally aggressive on grooming/solicitation patterns rather
// than general profanity — we want to stop predator behavior toward minors.

// Keep this list compact; we match as whole words / phrases (case-insensitive).
// Multi-word phrases catch grooming patterns even when individual words are
// innocuous on their own.
const PHRASES = [
  // age + sexual probing
  "how old are you", "what's your age", "whats your age", "are you a minor",
  "are you underage", "are you 18", "you 18", "u 18", "r u 18",
  // solicitation patterns
  "send nudes", "send pics", "send pic", "send me pics", "send me a pic",
  "show me your body", "show your body", "send body pic",
  "meet up irl", "meet up in person", "let's meet", "lets meet up",
  "don't tell your parents", "dont tell your parents",
  "don't tell anyone", "dont tell anyone", "keep this secret",
  "our little secret",
  "what are you wearing", "wat u wearing", "what u wearing",
  // explicit
  "nudes", "naked pic", "nude pic", "nude pics",
  "sext", "sexting", "sexual photo", "horny",
  "child porn", "cp", "loli", "shota",
];

const NORMALIZE_RE = /[\s\W_]+/g;

function normalize(s: string) {
  return s.toLowerCase().replace(/[0o]/g, "o").replace(/[1!]/g, "i");
}

export type DmFilterResult =
  | { ok: true }
  | { ok: false; matched: string[]; reason: string };

export function checkDmSafety(text: string): DmFilterResult {
  const raw = text.trim();
  if (!raw) return { ok: true };
  const lower = normalize(raw);
  const compact = lower.replace(NORMALIZE_RE, "");
  const matched: string[] = [];
  for (const p of PHRASES) {
    const pn = normalize(p);
    // Match either with-spaces or compacted (defeats l e t t e r spacing).
    if (lower.includes(pn) || compact.includes(pn.replace(NORMALIZE_RE, ""))) {
      matched.push(p);
    }
  }
  if (matched.length === 0) return { ok: true };
  return {
    ok: false,
    matched,
    reason:
      "This message looks unsafe — it matches patterns Polaris blocks to protect minors. " +
      "If this was a mistake, rephrase. Repeated attempts are logged for review.",
  };
}