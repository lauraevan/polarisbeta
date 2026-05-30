/**
 * Deterministic monogram + color generator for game tiles.
 * Same title → same colors every render.
 */
const PALETTE: [string, string, string][] = [
  ["#ff6b6b", "#c44569", "#fff5f5"],
  ["#ffa45c", "#c9560c", "#fff8ec"],
  ["#ffd166", "#c08a00", "#fffaeb"],
  ["#9be15d", "#3a8a1f", "#f3ffeb"],
  ["#4ade80", "#0e6b3a", "#ecfff3"],
  ["#48cae4", "#015064", "#eafaff"],
  ["#6c8eff", "#22319a", "#eef0ff"],
  ["#a78bfa", "#4c1d95", "#f4f0ff"],
  ["#f472b6", "#831843", "#fff0f7"],
  ["#fb7185", "#881337", "#fff0f3"],
  ["#5eead4", "#0f5b53", "#eafff9"],
  ["#fde047", "#a17400", "#fffce5"],
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