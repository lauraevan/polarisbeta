/**
 * Polaris Bot — Dyno-style chat bot.
 * Commands are parsed client-side and produce a synthetic bot message.
 * Admin commands check the caller's owner/admin flag client-side AND
 * server-side (admin actions go through admin.functions / RPCs).
 */
import botLogo from "@/assets/polaris-bot.png.asset.json";

export const POLARIS_BOT_ID = "00000000-0000-0000-0000-000000000bot";
export const POLARIS_BOT_USERNAME = "Polaris Bot";
export const POLARIS_BOT_AVATAR = botLogo.url;
export const POLARIS_BOT_ACCENT = "255 140 60";
export const POLARIS_BOT_EMOJI = "🤖";
export const POLARIS_BOT_TAGLINE = "Your friendly utility companion ✨";
export const POLARIS_BOT_BIO =
  "I'm Polaris Bot — type `#help` to see everything I can do. Reply to me anytime and I'll say hi back!";

/** Side-effect actions the chat client should execute after the reply renders. */
export type BotAction =
  | { kind: "purge"; count: number }
  | { kind: "lock" }
  | { kind: "unlock" }
  | { kind: "remind"; seconds: number; text: string }
  /** Server-backed admin operations. Dispatched via useServerFn in ChatRoom. */
  | { kind: "admin"; op: "ban"; username: string; reason: string; durationHours: number | "perm" }
  | { kind: "admin"; op: "unban"; username: string }
  | { kind: "admin"; op: "kick"; username: string }
  | { kind: "admin"; op: "mute"; username: string; reason?: string; durationMinutes: number | "perm" }
  | { kind: "admin"; op: "unmute"; username: string }
  | { kind: "admin"; op: "purge"; count: number; channelSlug?: string }
  | { kind: "admin"; op: "lock"; channelSlug?: string; role?: string | null }
  | { kind: "admin"; op: "unlock"; channelSlug?: string };

export type BotResult = { reply: string; action?: BotAction };

type BotContext = {
  isAdmin: boolean;
  username: string;
  args: string[];
  raw: string;
};

export type BotCommand = {
  name: string;
  description: string;
  adminOnly?: boolean;
  run: (ctx: BotContext) => BotResult | string | Promise<BotResult | string>;
};

const EIGHT_BALL = [
  "It is certain.", "Without a doubt.", "Yes — definitely.", "You may rely on it.",
  "As I see it, yes.", "Most likely.", "Outlook good.", "Signs point to yes.",
  "Reply hazy, try again.", "Ask again later.", "Cannot predict now.",
  "Don't count on it.", "My reply is no.", "Very doubtful.",
];
const JOKES = [
  "Why don't skeletons fight each other? They don't have the guts.",
  "I told my computer I needed a break, and it said 'no problem — I'll go to sleep.'",
  "Parallel lines have so much in common. It's a shame they'll never meet.",
  "I'm reading a book on anti-gravity. It's impossible to put down.",
];
const FACTS = [
  "Honey never spoils — archaeologists have eaten 3000-year-old honey.",
  "Octopuses have three hearts and blue blood.",
  "A group of flamingos is called a 'flamboyance.'",
  "Bananas are berries, but strawberries aren't.",
];
const COMPLIMENTS = [
  "You're the human equivalent of a perfectly toasted marshmallow. 🔥",
  "Your vibes? Immaculate.",
  "If awesome was a currency you'd be a billionaire.",
  "The world is measurably better with you in it. 🌍✨",
  "You bring main-character energy to every room.",
];
const MOTIVATIONS = [
  "Small steps still finish marathons. Keep going.",
  "You don't have to be perfect — just present.",
  "Today's effort is tomorrow's highlight reel.",
  "Doubt kills more dreams than failure ever will.",
];
const HUGS = ["(っ´▽`)っ", "⊂(・▽・⊂)", "(づ｡◕‿‿◕｡)づ", "ʕっ•ᴥ•ʔっ"];
const PATS = ["( ´･･)ﾉ(._.`)", "(*ﾉ´∀`)ﾉ⌒･*", "( ˘ω˘ )っ"];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function safeCalc(expr: string): string {
  // Only allow digits, whitespace, parens, decimals and + - * / % operators.
  if (!/^[\d\s+\-*/%().]+$/.test(expr)) return "Only numbers and + - * / % ( ) are allowed.";
  try {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
    const v = Function(`"use strict";return (${expr});`)();
    if (typeof v !== "number" || !isFinite(v)) return "That doesn't compute. 🤔";
    return `🧮 \`${expr}\` = **${v}**`;
  } catch { return "Couldn't parse that — check your parentheses?"; }
}
function parseDuration(s: string): number {
  // 10s, 5m, 2h — returns seconds, clamped 5s..6h.
  const m = /^(\d+)\s*(s|m|h)?$/i.exec(s.trim());
  if (!m) return 0;
  const n = parseInt(m[1], 10);
  const unit = (m[2] || "m").toLowerCase();
  const mult = unit === "s" ? 1 : unit === "h" ? 3600 : 60;
  return Math.min(6 * 3600, Math.max(5, n * mult));
}

export const COMMANDS: Record<string, BotCommand> = {
  help: {
    name: "help", description: "Show the command list",
    run: ({ isAdmin }) => {
      const member = Object.values(COMMANDS).filter((c) => !c.adminOnly).map((c) => `\`/${c.name}\` — ${c.description}`).join("\n");
      const admin = Object.values(ADMIN_COMMANDS).map((c) => `\`/${c.name}\` — ${c.description}`).join("\n");
      return `**🤖 Polaris Bot — commands**\n\n**Everyone:**\n${member}${isAdmin ? `\n\n**Admin only:**\n${admin}` : ""}`;
    },
  },
  ping:  { name: "ping",  description: "Pong! Latency check.",                  run: () => `🏓 Pong! \`${Math.floor(Math.random() * 60 + 10)}ms\`` },
  flip:  { name: "flip",  description: "Flip a coin",                            run: () => `🪙 ${Math.random() < 0.5 ? "**Heads**" : "**Tails**"}` },
  roll:  { name: "roll",  description: "Roll a die — `#roll 20`",
    run: ({ args }) => {
      const sides = Math.max(2, Math.min(1000, parseInt(args[0] || "6", 10) || 6));
      return `🎲 You rolled **${Math.floor(Math.random() * sides) + 1}** (d${sides})`;
    },
  },
  "8ball": { name: "8ball", description: "Ask the magic 8-ball",
    run: ({ args }) => args.length === 0 ? "❓ Ask a question, like `#8ball will it rain?`" : `🎱 ${pick(EIGHT_BALL)}`,
  },
  choose: { name: "choose", description: "Pick from options — `#choose a | b | c`",
    run: ({ raw }) => {
      const opts = raw.split("|").map((s) => s.trim()).filter(Boolean);
      if (opts.length < 2) return "Give me at least two options: `#choose pizza | tacos`";
      return `🤔 I'd pick **${pick(opts)}**`;
    },
  },
  joke:    { name: "joke",    description: "Tell a joke",            run: () => `😄 ${pick(JOKES)}` },
  fact:    { name: "fact",    description: "Random fun fact",        run: () => `📚 ${pick(FACTS)}` },
  say:     { name: "say",     description: "Make the bot say something",
    run: ({ raw, username }) => raw ? `💬 ${raw}\n*— requested by ${username}*` : "Give me something to say.",
  },
  poll: { name: "poll", description: "Start a poll — `#poll Pizza? | yes | no | maybe`",
    run: ({ raw }) => {
      const parts = raw.split("|").map((s) => s.trim()).filter(Boolean);
      if (parts.length < 3) return "Usage: `#poll Question | option a | option b`";
      const [q, ...opts] = parts;
      return `📊 **${q}**\n${opts.map((o, i) => `${["1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣"][i] || "•"} ${o}`).join("\n")}`;
    },
  },
  userinfo: { name: "userinfo", description: "Show info about you (or a mention)",
    run: ({ args, username }) => {
      const target = args[0]?.replace(/^@/, "") || username;
      return `👤 **${target}**\nMember of Polaris One ✨\nUse \`#avatar @user\` to see their avatar.`;
    },
  },
  ascii: { name: "ascii", description: "Make text big",
    run: ({ raw }) => raw ? "```\n" + raw.toUpperCase().split("").join(" ") + "\n```" : "Give me text to embiggen.",
  },
  calc: { name: "calc", description: "Quick calculator — `#calc 2 * (3+4)`",
    run: ({ raw }) => raw ? safeCalc(raw) : "Usage: `#calc 12 * 7`",
  },
  reverse: { name: "reverse", description: "Reverse text",
    run: ({ raw }) => raw ? `🔁 ${raw.split("").reverse().join("")}` : "Give me text to reverse.",
  },
  emojify: { name: "emojify", description: "Sprinkle emoji onto text",
    run: ({ raw }) => {
      if (!raw) return "Give me text to emojify.";
      const sprinkles = ["✨","🌙","🍂","🔥","💫","🌊","🎈","🪐","🌸"];
      return raw.split(" ").map((w) => `${w} ${pick(sprinkles)}`).join(" ");
    },
  },
  compliment: { name: "compliment", description: "Drop a compliment",
    run: ({ args, username }) => `💖 ${args[0]?.replace(/^@/,"") || username}, ${pick(COMPLIMENTS)}` },
  motivate: { name: "motivate", description: "A little motivation",
    run: () => `🚀 ${pick(MOTIVATIONS)}` },
  hug: { name: "hug", description: "Send a hug — `#hug @user`",
    run: ({ args, username }) => `${pick(HUGS)} *${username} hugs ${args[0]?.replace(/^@/,"") || "everyone"}*` },
  pat: { name: "pat", description: "Pat someone's head",
    run: ({ args, username }) => `${pick(PATS)} *${username} pats ${args[0]?.replace(/^@/,"") || "you"}*` },
  ship: { name: "ship", description: "Ship two people — `#ship a b`",
    run: ({ args }) => {
      if (args.length < 2) return "Usage: `#ship Alice Bob`";
      const score = Math.floor(Math.random() * 101);
      const heart = score > 80 ? "💖" : score > 50 ? "💞" : score > 20 ? "💔" : "🚫";
      return `${heart} **${args[0]}** × **${args[1]}** — ${score}% compatible`;
    },
  },
  rate: { name: "rate", description: "Rate anything out of 10",
    run: ({ raw }) => raw ? `⭐ I rate **${raw}** a solid **${Math.floor(Math.random()*11)}/10**` : "Rate what?" },
  countdown: { name: "countdown", description: "Time until date — `#countdown 2026-12-25`",
    run: ({ raw }) => {
      const t = Date.parse(raw);
      if (!t) return "Usage: `#countdown 2026-12-25` (ISO date)";
      const diff = t - Date.now();
      if (diff < 0) return `⏳ That date passed ${Math.abs(Math.round(diff/86400000))} days ago.`;
      const d = Math.floor(diff/86400000), h = Math.floor((diff%86400000)/3600000);
      return `⏰ ${d}d ${h}h until **${raw}**`;
    },
  },
  time: { name: "time", description: "Show your local time",
    run: () => `🕒 It's **${new Date().toLocaleString()}** locally.` },
  base64: { name: "base64", description: "Encode text to base64",
    run: ({ raw }) => raw ? "🔐 `" + btoa(unescape(encodeURIComponent(raw))) + "`" : "Usage: `#base64 hello`" },
  remind: { name: "remind", description: "Remind you — `#remind 10m drink water`",
    run: ({ args, username }): BotResult => {
      const secs = parseDuration(args[0] || "");
      const text = args.slice(1).join(" ");
      if (!secs || !text) return { reply: "Usage: `#remind 10m take a break` (s/m/h, max 6h)" };
      return {
        reply: `⏰ Got it ${username} — I'll remind you in **${args[0]}** about *"${text}"*.`,
        action: { kind: "remind", seconds: secs, text },
      };
    },
  },
  invite: { name: "invite", description: "Invite link to Polaris",
    run: () => `✨ Share Polaris: ${typeof window !== "undefined" ? window.location.origin : "https://polarisbeta.lovable.app"}` },
  // Admin commands live in ADMIN_COMMANDS below and are wired to server functions.
};

/** Parse a duration token like "perm", "30m", "1h", "3d", "7d". Returns minutes (or "perm"). */
function parseDurationToken(tok: string | undefined): number | "perm" | null {
  if (!tok) return null;
  const t = tok.trim().toLowerCase();
  if (t === "perm" || t === "permanent" || t === "forever") return "perm";
  const m = /^(\d+)\s*(m|min|mins|h|hr|hrs|d|day|days|w|wk|wks)?$/.exec(t);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  const u = (m[2] || "m").toLowerCase();
  if (u.startsWith("m")) return n;
  if (u.startsWith("h")) return n * 60;
  if (u.startsWith("d")) return n * 60 * 24;
  if (u.startsWith("w")) return n * 60 * 24 * 7;
  return n;
}
function minutesToHours(min: number | "perm"): number | "perm" {
  return min === "perm" ? "perm" : Math.max(1, Math.round(min / 60));
}
function fmtDuration(min: number | "perm"): string {
  if (min === "perm") return "permanently";
  if (min < 60) return `${min}m`;
  if (min < 60 * 24) return `${Math.round(min / 60)}h`;
  return `${Math.round(min / (60 * 24))}d`;
}
/** Pull the first `#channel` token out of raw text (returns slug w/o the hash). */
function pickChannelRef(raw: string): string | undefined {
  const m = /#([a-z0-9][\w-]{0,79})/i.exec(raw);
  return m ? m[1].toLowerCase() : undefined;
}

/**
 * Adds the proper admin server-side commands. These return a `BotAction` of
 * kind `admin` that ChatRoom dispatches via `useServerFn`.
 */
function adminCommand(name: string, description: string, run: BotCommand["run"]): BotCommand {
  return { name, description, adminOnly: true, run };
}

const ADMIN_COMMANDS: Record<string, BotCommand> = {
  ban: adminCommand("ban", "Ban a user — `/ban @user 7d spamming` (perm/1h/3d/7d/30d)", ({ args, isAdmin }): BotResult => {
    if (!isAdmin) return { reply: "❌ Insufficient permissions." };
    const target = args[0]?.replace(/^@/, "");
    if (!target) return { reply: "Usage: `/ban @user [perm|1h|3d|7d|30d] [reason]`" };
    const dur = parseDurationToken(args[1]);
    const reasonStart = dur === null ? 1 : 2;
    const reason = args.slice(reasonStart).join(" ").trim() || "No reason provided";
    const durHours = minutesToHours(dur ?? "perm");
    const label = dur === null ? "permanently" : fmtDuration(dur);
    return {
      reply: `🔨 Banning **${target}** ${label}.\n*Reason: ${reason}*`,
      action: { kind: "admin", op: "ban", username: target, reason, durationHours: durHours },
    };
  }),
  unban: adminCommand("unban", "Lift bans on a user — `/unban @user`", ({ args, isAdmin }): BotResult => {
    if (!isAdmin) return { reply: "❌ Insufficient permissions." };
    const target = args[0]?.replace(/^@/, "");
    if (!target) return { reply: "Usage: `/unban @user`" };
    return { reply: `🕊️ Unbanning **${target}**…`, action: { kind: "admin", op: "unban", username: target } };
  }),
  kick: adminCommand("kick", "Force a user to sign in again — `/kick @user`", ({ args, isAdmin }): BotResult => {
    if (!isAdmin) return { reply: "❌ Insufficient permissions." };
    const target = args[0]?.replace(/^@/, "");
    if (!target) return { reply: "Usage: `/kick @user`" };
    return { reply: `👢 Kicking **${target}** — they'll need to sign in again.`, action: { kind: "admin", op: "kick", username: target } };
  }),
  mute: adminCommand("mute", "Mute a user — `/mute @user 30m noisy` (perm/15m/1h/1d…)", ({ args, isAdmin }): BotResult => {
    if (!isAdmin) return { reply: "❌ Insufficient permissions." };
    const target = args[0]?.replace(/^@/, "");
    if (!target) return { reply: "Usage: `/mute @user [perm|30m|1h|1d] [reason]`" };
    const dur = parseDurationToken(args[1]) ?? 60;
    const reasonStart = parseDurationToken(args[1]) === null ? 1 : 2;
    const reason = args.slice(reasonStart).join(" ").trim() || undefined;
    return {
      reply: `🔇 Muting **${target}** ${fmtDuration(dur)}${reason ? ` — *${reason}*` : ""}.`,
      action: { kind: "admin", op: "mute", username: target, reason, durationMinutes: dur },
    };
  }),
  unmute: adminCommand("unmute", "Lift a mute — `/unmute @user`", ({ args, isAdmin }): BotResult => {
    if (!isAdmin) return { reply: "❌ Insufficient permissions." };
    const target = args[0]?.replace(/^@/, "");
    if (!target) return { reply: "Usage: `/unmute @user`" };
    return { reply: `🔊 Unmuting **${target}**.`, action: { kind: "admin", op: "unmute", username: target } };
  }),
  purge: adminCommand("purge", "Bulk-delete N messages — `/purge 25` or `/purge #channel 50`", ({ raw, args, isAdmin }): BotResult => {
    if (!isAdmin) return { reply: "❌ Insufficient permissions." };
    const channelSlug = pickChannelRef(raw);
    const num = args.map((a) => parseInt(a, 10)).find((n) => Number.isFinite(n) && n > 0);
    const count = Math.min(500, Math.max(1, num ?? 10));
    return {
      reply: `🧹 Purging the last **${count}** messages${channelSlug ? ` in **#${channelSlug}**` : ""}…`,
      action: { kind: "admin", op: "purge", count, channelSlug },
    };
  }),
  lock: adminCommand("lock", "Lock a channel — `/lock #preview = on` or `/lock #preview role=Owner`", ({ raw, isAdmin }): BotResult => {
    if (!isAdmin) return { reply: "❌ Insufficient permissions." };
    const channelSlug = pickChannelRef(raw);
    const off = /=\s*off\b|\boff\b/i.test(raw);
    const role = /role\s*=\s*([A-Za-z][\w-]*)/i.exec(raw)?.[1] ?? "Owner";
    if (off) return { reply: `🔓 Unlocking ${channelSlug ? `**#${channelSlug}**` : "this channel"}.`, action: { kind: "admin", op: "unlock", channelSlug } };
    return {
      reply: `🔒 Locking ${channelSlug ? `**#${channelSlug}**` : "this channel"} — only **${role}** can post.`,
      action: { kind: "admin", op: "lock", channelSlug, role },
    };
  }),
  unlock: adminCommand("unlock", "Unlock a channel — `/unlock #preview`", ({ raw, isAdmin }): BotResult => {
    if (!isAdmin) return { reply: "❌ Insufficient permissions." };
    const channelSlug = pickChannelRef(raw);
    return { reply: `🔓 Unlocking ${channelSlug ? `**#${channelSlug}**` : "this channel"}.`, action: { kind: "admin", op: "unlock", channelSlug } };
  }),
};

/** Returns a bot reply (and optional action) if `text` is a command, or null otherwise. */
export async function runBotCommand(text: string, opts: { isAdmin: boolean; username: string }): Promise<BotResult | null> {
  const trimmed = text.trim();
  // Default prefix is `/`; legacy `#` still works for everyone.
  if (!trimmed.startsWith("/") && !trimmed.startsWith("#")) return null;
  const body = trimmed.slice(1);
  const [name, ...rest] = body.split(/\s+/);
  const key = name.toLowerCase();
  const cmd = ADMIN_COMMANDS[key] ?? COMMANDS[key];
  if (!cmd) return null;
  const raw = rest.join(" ");
  const out = await cmd.run({ args: rest, raw, isAdmin: opts.isAdmin, username: opts.username });
  return typeof out === "string" ? { reply: out } : out;
}

export function isBotMessage(userId: string): boolean {
  return userId === POLARIS_BOT_ID;
}

/** Friendly greetings the bot uses when someone replies directly to it. */
const GREETINGS = [
  "Hey, what's up! 👋",
  "Hi there! Need anything? Try `#help` ✨",
  "Hey! I'm listening — `#help` shows what I can do.",
  "Yo! 🤖 Happy to help.",
];
export function botGreeting(username: string): string {
  return `${pick(GREETINGS)} *(@${username})*`;
}