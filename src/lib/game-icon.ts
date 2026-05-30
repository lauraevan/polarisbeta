/**
 * Deterministic monogram + color generator for game tiles.
 * Same title → same colors every render.
 */
// Monochrome zinc palette — keeps the games hub one-color when no icon is found.
const PALETTE: [string, string, string][] = [
  ["#27272a", "#18181b", "#e4e4e7"],
  ["#2d2d33", "#1c1c20", "#e4e4e7"],
  ["#323237", "#1f1f23", "#e4e4e7"],
  ["#3a3a40", "#222226", "#e4e4e7"],
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function gameIcon(title: string) {
  const h = hash(title);
  const [from, to, fg] = PALETTE[h % PALETTE.length];
  const words = title.replace(/[^a-z0-9 ]/gi, "").trim().split(/\s+/);
  const mono =
    words.length >= 2
      ? (words[0][0] + words[1][0]).toUpperCase()
      : title.replace(/[^a-z0-9]/gi, "").slice(0, 2).toUpperCase() || "·";
  // Rotation 0..335, stepped so close hashes don't blend
  const rot = (h % 12) * 30;
  return {
    mono,
    fg,
    bg: `linear-gradient(${rot}deg, ${from} 0%, ${to} 100%)`,
  };
}