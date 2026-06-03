import { supabase } from "@/integrations/supabase/client";
import { safeGetItem, safeSetItem } from "@/lib/safe-storage";

export type CustomWallpaper = {
  id: string;
  name: string;
  url: string;
  accent: string;
  type: "static" | "animated";
};

const LOCAL_KEY = "polaris:wallpapers:custom";
const OVERRIDE_KEY = "polaris:wallpaper:override";

export function listLocalCustomWallpapers(): CustomWallpaper[] {
  try {
    const raw = safeGetItem("localStorage", LOCAL_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CustomWallpaper[];
  } catch {
    return [];
  }
}

export function saveLocalCustomWallpaper(w: CustomWallpaper) {
  const all = listLocalCustomWallpapers().filter((x) => x.id !== w.id);
  all.unshift(w);
  safeSetItem("localStorage", LOCAL_KEY, JSON.stringify(all.slice(0, 30)));
  window.dispatchEvent(new Event("polaris:custom-wallpapers-changed"));
}

export function removeLocalCustomWallpaper(id: string) {
  const next = listLocalCustomWallpapers().filter((x) => x.id !== id);
  safeSetItem("localStorage", LOCAL_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("polaris:custom-wallpapers-changed"));
}

/** Read the current wallpaper override (custom or community). */
export function readWallpaperOverride(): CustomWallpaper | null {
  try {
    const raw = safeGetItem("localStorage", OVERRIDE_KEY);
    return raw ? (JSON.parse(raw) as CustomWallpaper) : null;
  } catch {
    return null;
  }
}

export function writeWallpaperOverride(w: CustomWallpaper | null) {
  if (w) safeSetItem("localStorage", OVERRIDE_KEY, JSON.stringify(w));
  else safeSetItem("localStorage", OVERRIDE_KEY, "");
  window.dispatchEvent(new Event("polaris:wallpaper-override-changed"));
}

/** Sample average color from an image to derive an accent triplet. */
export async function pickAccentFromImage(file: File): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const c = document.createElement("canvas");
        const SZ = 32;
        c.width = SZ;
        c.height = SZ;
        const ctx = c.getContext("2d")!;
        ctx.drawImage(img, 0, 0, SZ, SZ);
        const { data } = ctx.getImageData(0, 0, SZ, SZ);
        let r = 0, g = 0, b = 0, n = 0;
        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3];
          if (a < 32) continue;
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          n++;
        }
        if (!n) return resolve("255 170 90");
        // Boost saturation a little so the UI tint reads warmer.
        const avg = [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
        const max = Math.max(...avg);
        const boosted = avg.map((v) => Math.min(255, Math.round(80 + (v / Math.max(1, max)) * 175)));
        resolve(`${boosted[0]} ${boosted[1]} ${boosted[2]}`);
      } catch {
        resolve("255 170 90");
      } finally {
        URL.revokeObjectURL(img.src);
      }
    };
    img.onerror = () => resolve("255 170 90");
    img.src = URL.createObjectURL(file);
  });
}

/** Upload a wallpaper file to storage and return its public URL. */
export async function uploadWallpaperFile(file: File, userId: string): Promise<string> {
  const safeExt = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${userId}/${crypto.randomUUID()}.${safeExt}`;
  const { error } = await supabase.storage.from("wallpapers").upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("wallpapers").getPublicUrl(path);
  return data.publicUrl;
}

export type CommunityWallpaper = {
  id: string;
  uploader_id: string;
  uploader_username: string;
  name: string;
  image_url: string;
  accent: string;
  type: "static" | "animated";
  hearts: number;
  created_at: string;
};

export async function fetchCommunityWallpapers(): Promise<CommunityWallpaper[]> {
  const { data, error } = await supabase
    .from("community_wallpapers")
    .select("id,uploader_id,uploader_username,name,image_url,accent,type,hearts,created_at")
    .eq("status", "active")
    .order("hearts", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(120);
  if (error) return [];
  return (data ?? []) as CommunityWallpaper[];
}

export async function insertCommunityWallpaper(payload: {
  uploader_id: string;
  uploader_username: string;
  name: string;
  image_url: string;
  accent: string;
  type: "static" | "animated";
}) {
  return supabase.from("community_wallpapers").insert(payload as never).select().single();
}

export async function toggleHeart(id: string) {
  // RPC handles dedupe + increment.
  return supabase.rpc("toggle_wallpaper_heart" as never, { _id: id } as never);
}

export async function reportWallpaper(id: string, reporter_id: string, reason: string) {
  return supabase
    .from("wallpaper_reports")
    .insert({ wallpaper_id: id, reporter_id, reason } as never);
}

export async function hideWallpaper(id: string) {
  return supabase.rpc("hide_wallpaper" as never, { _id: id } as never);
}