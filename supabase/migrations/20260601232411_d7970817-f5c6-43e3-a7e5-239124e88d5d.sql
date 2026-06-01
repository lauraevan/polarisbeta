CREATE TABLE public.movie_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('movie','tv')),
  tmdb_id INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 10),
  comment TEXT,
  username TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, kind, tmdb_id)
);

CREATE INDEX idx_movie_ratings_kind_tmdb ON public.movie_ratings(kind, tmdb_id);

GRANT SELECT ON public.movie_ratings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.movie_ratings TO authenticated;
GRANT ALL ON public.movie_ratings TO service_role;

ALTER TABLE public.movie_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ratings public read" ON public.movie_ratings FOR SELECT USING (true);
CREATE POLICY "ratings auth insert" ON public.movie_ratings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ratings auth update own" ON public.movie_ratings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ratings auth delete own" ON public.movie_ratings FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER trg_movie_ratings_touch BEFORE UPDATE ON public.movie_ratings
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();