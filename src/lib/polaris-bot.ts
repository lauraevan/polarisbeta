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
  run: (ctx: BotContext) => string | Promise<string>;
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

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

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
    run: ({ args, isAdmin }) => {
      if (!isAdmin) return "❌ Insufficient permissions.";
      const n = Math.min(100, Math.max(1, parseInt(args[0] || "10", 10) || 10));
      return `🧹 Purged the last **${n}** messages.`;
    },
  },
  lock:   { name: "lock",   description: "Lock the channel (admin)", adminOnly: true,
    run: ({ isAdmin }) => isAdmin ? "🔒 Channel locked. Only admins can post now." : "❌ Insufficient permissions.",
  },
  unlock: { name: "unlock", description: "Unlock the channel (admin)", adminOnly: true,
    run: ({ isAdmin }) => isAdmin ? "🔓 Channel unlocked. Everyone can post again." : "❌ Insufficient permissions.",
  },
};

/** Returns a bot reply string if `text` is a command, or null otherwise. */
export async function runBotCommand(text: string, opts: { isAdmin: boolean; username: string }): Promise<string | null> {
  const trimmed = text.trim();
  if (!trimmed.startsWith("#") && !trimmed.startsWith("/")) return null;
  const body = trimmed.slice(1);
  const [name, ...rest] = body.split(/\s+/);
  const key = name.toLowerCase();
  const cmd = COMMANDS[key];
  if (!cmd) return null;
  const raw = rest.join(" ");
  return cmd.run({ args: rest, raw, isAdmin: opts.isAdmin, username: opts.username });
}

export function isBotMessage(userId: string): boolean {
  return userId === POLARIS_BOT_ID;
}