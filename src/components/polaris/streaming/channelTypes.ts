export type ChannelCategory =
  | "All"
  | "Sports"
  | "News"
  | "Entertainment"
  | "Movies"
  | "Kids"
  | "Music"
  | "Documentary";

export type Channel = {
  id: string;
  name: string;
  category: Exclude<ChannelCategory, "All">;
  domain: string;
  emoji: string;
  accent: string;
  logo?: string;
  tagline?: string;
  popular?: boolean;
  highlight?: boolean;
  now?: string;
  next?: string;
  streams: { label: string; url: string }[];
};