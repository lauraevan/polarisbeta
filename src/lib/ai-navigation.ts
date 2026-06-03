/**
 * Parse a user prompt for "take me to X" intents and return a navigation action.
 * Pure regex — keeps the AI page itself free of model-side tool-calling overhead.
 */
import type { NavigateOptions } from "@tanstack/react-router";

type Action = { path: string; query?: string; label: string } | null;

const ROUTES: Array<{ keys: RegExp; path: string; label: string }> = [
  { keys: /\b(cinema|flix|movies?|shows?|netflix|anime|tv)\b/i, path: "/media", label: "Polaris Flix" },
  { keys: /\b(games?|gaming|play)\b/i, path: "/games", label: "Polaris Games" },
  { keys: /\b(music|songs?|spotify|catalog)\b/i, path: "/music", label: "Polaris Music" },
  { keys: /\b(chat|chatrooms?|messages?)\b/i, path: "/chat", label: "Polaris Chat" },
  { keys: /\b(shop|store|buy|coins?)\b/i, path: "/shop", label: "Polaris Shop" },
  { keys: /\b(settings|preferences|config)\b/i, path: "/settings", label: "Settings" },
  { keys: /\b(apps?|launcher)\b/i, path: "/apps", label: "Apps" },
  { keys: /\b(home|hub|start)\b/i, path: "/", label: "Home" },
  { keys: /\b(soundboard)\b/i, path: "/soundboard", label: "Soundboard" },
  { keys: /\b(emulator|retro)\b/i, path: "/emulator", label: "Emulator" },
  { keys: /\b(browser|web)\b/i, path: "/browser", label: "Browser" },
  { keys: /\b(my\s*list|watchlist|favorites?)\b/i, path: "/mylist", label: "My List" },
  { keys: /\b(premium|pro|vip|upgrade)\b/i, path: "/premium", label: "Polaris Premium" },
  { keys: /\b(multi[\s-]?model|multi[\s-]?ai|two ai|2 ai|debate|collaborate)\b/i, path: "/multi-ai", label: "Multi-Model AI" },
  { keys: /\broblox\b/i, path: "/games?tab=roblox", label: "Roblox Emulator" },
];

export function parseNavigation(prompt: string): Action {
  // Trigger phrases — only act if the user clearly asked to be taken somewhere.
  if (!/\b(bring|take|navigate|go to|open|show me|head to|jump to|launch)\b/i.test(prompt)) return null;

  const route = ROUTES.find((r) => r.keys.test(prompt));
  if (!route) return null;

  // Extract a quoted or "to X in Y" query — e.g. `bring me to "Super Mario Galaxy"`.
  const quoted = prompt.match(/["“](.+?)["”]/);
  const after = prompt.match(/(?:to|find|search|watch|play)\s+([A-Z][\w\s:'-]{2,40})/);
  const query = (quoted?.[1] ?? after?.[1] ?? "").trim() || undefined;

  return { path: route.path, label: route.label, query };
}

export function toNavigateOptions(action: NonNullable<Action>): NavigateOptions {
  const search = action.query ? { q: action.query } : undefined;
  return { to: action.path, search } as NavigateOptions;
}