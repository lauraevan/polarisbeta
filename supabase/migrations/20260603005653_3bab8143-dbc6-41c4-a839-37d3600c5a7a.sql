-- ============ COMMUNITY WALLPAPERS ============
CREATE TABLE public.community_wallpapers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uploader_id uuid NOT NULL,
  uploader_username text NOT NULL,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
  image_url text NOT NULL,
  accent text NOT NULL DEFAULT '255 170 90',
  type text NOT NULL DEFAULT 'static' CHECK (type IN ('static','animated')),
  hearts integer NOT NULL DEFAULT 0,
  downloads integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','hidden')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.community_wallpapers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_wallpapers TO authenticated;
GRANT ALL ON public.community_wallpapers TO service_role;
ALTER TABLE public.community_wallpapers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wallpapers public read active"
  ON public.community_wallpapers FOR SELECT TO public
  USING (status = 'active' OR is_owner());

CREATE POLICY "wallpapers auth insert"
  ON public.community_wallpapers FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = uploader_id);

CREATE POLICY "wallpapers uploader delete own"
  ON public.community_wallpapers FOR DELETE TO authenticated
  USING (auth.uid() = uploader_id);

CREATE POLICY "wallpapers owner update"
  ON public.community_wallpapers FOR UPDATE TO authenticated
  USING (is_owner()) WITH CHECK (is_owner());

CREATE INDEX idx_community_wallpapers_status_hearts ON public.community_wallpapers (status, hearts DESC, created_at DESC);

-- ============ WALLPAPER REPORTS ============
CREATE TABLE public.wallpaper_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallpaper_id uuid NOT NULL REFERENCES public.community_wallpapers(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL,
  reason text NOT NULL CHECK (char_length(reason) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (wallpaper_id, reporter_id)
);
GRANT SELECT, INSERT, DELETE ON public.wallpaper_reports TO authenticated;
GRANT ALL ON public.wallpaper_reports TO service_role;
ALTER TABLE public.wallpaper_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reports auth insert"
  ON public.wallpaper_reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "reports owner read"
  ON public.wallpaper_reports FOR SELECT TO authenticated
  USING (is_owner() OR auth.uid() = reporter_id);

CREATE POLICY "reports owner delete"
  ON public.wallpaper_reports FOR DELETE TO authenticated
  USING (is_owner());

-- ============ USER LAYOUTS (Pro Customizer) ============
CREATE TABLE public.user_layouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 40),
  document jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_layouts TO authenticated;
GRANT ALL ON public.user_layouts TO service_role;
ALTER TABLE public.user_layouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "layouts owner all"
  ON public.user_layouts FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_user_layouts_user ON public.user_layouts (user_id, updated_at DESC);

-- Cap layouts at 5 per user via trigger.
CREATE OR REPLACE FUNCTION public.enforce_layout_cap()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.user_layouts WHERE user_id = NEW.user_id) >= 5 THEN
    RAISE EXCEPTION 'layout_cap_reached';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_user_layouts_cap
  BEFORE INSERT ON public.user_layouts
  FOR EACH ROW EXECUTE FUNCTION public.enforce_layout_cap();

CREATE TRIGGER trg_user_layouts_updated
  BEFORE UPDATE ON public.user_layouts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ MODERATION RPC ============
CREATE OR REPLACE FUNCTION public.hide_wallpaper(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT is_owner() THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;
  UPDATE public.community_wallpapers SET status = 'hidden' WHERE id = _id;
END $$;

-- ============ HEART RPC (atomic increment, idempotent per user via separate table) ============
CREATE TABLE public.wallpaper_hearts (
  wallpaper_id uuid NOT NULL REFERENCES public.community_wallpapers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (wallpaper_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.wallpaper_hearts TO authenticated;
GRANT ALL ON public.wallpaper_hearts TO service_role;
ALTER TABLE public.wallpaper_hearts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hearts owner all"
  ON public.wallpaper_hearts FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.toggle_wallpaper_heart(_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _existed boolean;
BEGIN
  IF _uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'auth'); END IF;
  SELECT EXISTS(SELECT 1 FROM public.wallpaper_hearts WHERE wallpaper_id = _id AND user_id = _uid) INTO _existed;
  IF _existed THEN
    DELETE FROM public.wallpaper_hearts WHERE wallpaper_id = _id AND user_id = _uid;
    UPDATE public.community_wallpapers SET hearts = GREATEST(0, hearts - 1) WHERE id = _id;
    RETURN jsonb_build_object('ok', true, 'hearted', false);
  ELSE
    INSERT INTO public.wallpaper_hearts (wallpaper_id, user_id) VALUES (_id, _uid);
    UPDATE public.community_wallpapers SET hearts = hearts + 1 WHERE id = _id;
    RETURN jsonb_build_object('ok', true, 'hearted', true);
  END IF;
END $$;