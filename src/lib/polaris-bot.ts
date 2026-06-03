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
  | { kind: "remind"; seconds: number; text: string };

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
      const member = Object.values(COMMANDS).filter((c) => !c.adminOnly).map((c) => `\`#${c.name}\` — ${c.description}`).join("\n");
      const admin = Object.values(COMMANDS).filter((c) => c.adminOnly).map((c) => `\`#${c.name}\` — ${c.description}`).join("\n");
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
  // ADMIN
  ban:    { name: "ban",    description: "Ban a user (admin)", adminOnly: true,
    run: ({ args, isAdmin }) => {
      if (!isAdmin) return "❌ Insufficient permissions.";
      const target = args[0]?.replace(/^@/, "");
      if (!target) return "Usage: `#ban @user [reason]`";
      const reason = args.slice(1).join(" ") || "No reason provided";
      return `🔨 Successfully banned **${target}**.\n*Reason: ${reason}*`;
    },
  },
  kick:   { name: "kick",   description: "Kick a user (admin)", adminOnly: true,
    run: ({ args, isAdmin }) => {
      if (!isAdmin) return "❌ Insufficient permissions.";
      const target = args[0]?.replace(/^@/, "");
      return target ? `👢 **${target}** was kicked.` : "Usage: `#kick @user`";
    },
  },
  mute:   { name: "mute",   description: "Mute a user (admin)", adminOnly: true,
    run: ({ args, isAdmin }) => {
      if (!isAdmin) return "❌ Insufficient permissions.";
      const target = args[0]?.replace(/^@/, "");
      const dur = args[1] || "10m";
      return target ? `🔇 **${target}** muted for ${dur}.` : "Usage: `#mute @user 10m`";
    },
  },
  warn:   { name: "warn",   description: "Warn a user (admin)", adminOnly: true,
    run: ({ args, isAdmin }) => {
      if (!isAdmin) return "❌ Insufficient permissions.";
      const target = args[0]?.replace(/^@/, "");
      return target ? `⚠️ **${target}** has been warned.` : "Usage: `#warn @user`";
    },
  },
  purge:  { name: "purge",  description: "Bulk-clear N messages (admin)", adminOnly: true,
    run: ({ args, isAdmin }): BotResult => {
      if (!isAdmin) return { reply: "❌ Insufficient permissions." };
      const n = Math.min(100, Math.max(1, parseInt(args[0] || "10", 10) || 10));
      return { reply: `🧹 Purging the last **${n}** messages…`, action: { kind: "purge", count: n } };
    },
  },
  lock:   { name: "lock",   description: "Lock the channel (admin)", adminOnly: true,
    run: ({ isAdmin }): BotResult => isAdmin
      ? { reply: "🔒 Channel locked. Only admins can post now.", action: { kind: "lock" } }
      : { reply: "❌ Insufficient permissions." },
  },
  unlock: { name: "unlock", description: "Unlock the channel (admin)", adminOnly: true,
    run: ({ isAdmin }): BotResult => isAdmin
      ? { reply: "🔓 Channel unlocked. Everyone can post again.", action: { kind: "unlock" } }
      : { reply: "❌ Insufficient permissions." },
  },
};

/** Returns a bot reply (and optional action) if `text` is a command, or null otherwise. */
export async function runBotCommand(text: string, opts: { isAdmin: boolean; username: string }): Promise<BotResult | null> {
  const trimmed = text.trim();
  if (!trimmed.startsWith("#") && !trimmed.startsWith("/")) return null;
  const body = trimmed.slice(1);
  const [name, ...rest] = body.split(/\s+/);
  const key = name.toLowerCase();
  const cmd = COMMANDS[key];
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