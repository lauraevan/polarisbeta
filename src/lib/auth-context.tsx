import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Synthetic email so users can sign up with just username + password.
// Supabase requires an email — we hide that detail entirely.
const SYNTH_DOMAIN = "polaris.local";
const toEmail = (username: string) =>
  `${username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_")}@${SYNTH_DOMAIN}`;

export type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  pronouns: string | null;
  about_me: string | null;
  description: string | null;
  accent_color: string;
  banner_color: string;
  avatar_emoji: string | null;
  avatar_url: string | null;
  custom_role: string | null;
  roles: string[];
  fav_genres: number[];
  fav_game_tags: string[];
  watch_history: Array<{ id: number; kind: string; title: string; at: number }>;
  play_history: Array<{ id: string; title: string; at: number }>;
};

type Ctx = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (username: string, password: string) => Promise<{ error: string | null }>;
  signIn: (username: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => Promise<{ error: string | null }>;
  recordWatch: (entry: { id: number; kind: string; title: string }) => Promise<void>;
  recordPlay: (entry: { id: string; title: string }) => Promise<void>;
};

const AuthCtx = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", uid)
      .maybeSingle();
    if (data) {
      const p = data as unknown as Profile;
      setProfile(p);
      if (typeof document !== "undefined" && p.accent_color) {
        document.documentElement.style.setProperty("--polaris-accent", p.accent_color);
      }
    }
  }, []);

  useEffect(() => {
    // 1. Subscribe FIRST so we never miss an event.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        // defer profile fetch to avoid recursive auth-callback warning
        setTimeout(() => loadProfile(s.user.id), 0);
      } else {
        setProfile(null);
      }
    });
    // 2. Then check existing session.
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) loadProfile(s.user.id);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const signUp = useCallback(async (username: string, password: string) => {
    const clean = username.trim();
    if (clean.length < 3) return { error: "Username must be at least 3 characters." };
    if (password.length < 6) return { error: "Password must be at least 6 characters." };
    const { error } = await supabase.auth.signUp({
      email: toEmail(clean),
      password,
      options: {
        data: { username: clean },
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      },
    });
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("already") || msg.includes("registered"))
        return { error: "That username is taken." };
      return { error: error.message };
    }
    await supabase.auth.signInWithPassword({ email: toEmail(clean), password });
    if (typeof window !== "undefined") {
      // Slight delay so AuthDialog has time to close before profile opens.
      setTimeout(() => window.dispatchEvent(new CustomEvent("polaris:signed-up")), 200);
    }
    return { error: null };
  }, []);

  const signIn = useCallback(async (username: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: toEmail(username),
      password,
    });
    if (error) return { error: "Invalid username or password." };
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user.id);
  }, [user, loadProfile]);

  const updateProfile = useCallback(
    async (patch: Partial<Profile>) => {
      if (!user) return { error: "Not signed in." };
      const { error } = await supabase
        .from("profiles")
        .update(patch as never)
        .eq("id", user.id);
      if (error) return { error: error.message };
      await loadProfile(user.id);
      return { error: null };
    },
    [user, loadProfile],
  );

  const recordWatch = useCallback(
    async (entry: { id: number; kind: string; title: string }) => {
      if (!user || !profile) return;
      const next = [
        { ...entry, at: Date.now() },
        ...profile.watch_history.filter((e) => !(e.id === entry.id && e.kind === entry.kind)),
      ].slice(0, 40);
      await supabase
        .from("profiles")
        .update({ watch_history: next as never })
        .eq("id", user.id);
      setProfile({ ...profile, watch_history: next });
    },
    [user, profile],
  );

  const recordPlay = useCallback(
    async (entry: { id: string; title: string }) => {
      if (!user || !profile) return;
      const next = [
        { ...entry, at: Date.now() },
        ...profile.play_history.filter((e) => e.id !== entry.id),
      ].slice(0, 40);
      await supabase
        .from("profiles")
        .update({ play_history: next as never })
        .eq("id", user.id);
      setProfile({ ...profile, play_history: next });
    },
    [user, profile],
  );

  const value = useMemo<Ctx>(
    () => ({
      user,
      session,
      profile,
      loading,
      signUp,
      signIn,
      signOut,
      refreshProfile,
      updateProfile,
      recordWatch,
      recordPlay,
    }),
    [user, session, profile, loading, signUp, signIn, signOut, refreshProfile, updateProfile, recordWatch, recordPlay],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}