
-- Profiles table for Polaris (Discord-inspired)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT,
  pronouns TEXT,
  about_me TEXT,
  description TEXT,
  accent_color TEXT NOT NULL DEFAULT '255 170 90',  -- RGB triplet
  banner_color TEXT NOT NULL DEFAULT '230 150 80',
  avatar_emoji TEXT DEFAULT '✨',
  roles TEXT[] NOT NULL DEFAULT ARRAY['Member'],
  fav_genres INT[] NOT NULL DEFAULT '{}',
  fav_game_tags TEXT[] NOT NULL DEFAULT '{}',
  watch_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  play_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can delete their own profile"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- Auto-touch updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER profiles_touch
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Auto-create profile from signup metadata (username stored in raw_user_meta_data)
CREATE OR REPLACE FUNCTION public.handle_new_polaris_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uname TEXT;
BEGIN
  uname := COALESCE(NEW.raw_user_meta_data->>'username',
                    split_part(NEW.email, '@', 1));
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (NEW.id, uname, uname)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created_polaris ON auth.users;
CREATE TRIGGER on_auth_user_created_polaris
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_polaris_user();
