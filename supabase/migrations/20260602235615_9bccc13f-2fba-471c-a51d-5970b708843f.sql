-- Watch parties
CREATE TABLE public.watch_parties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  host_id uuid NOT NULL,
  kind text NOT NULL, -- movie | tv
  tmdb_id integer NOT NULL,
  title text NOT NULL,
  season integer,
  episode integer,
  position_seconds double precision NOT NULL DEFAULT 0,
  is_playing boolean NOT NULL DEFAULT false,
  provider_idx integer NOT NULL DEFAULT 0,
  state_updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.watch_parties TO authenticated;
GRANT SELECT ON public.watch_parties TO anon;
GRANT ALL ON public.watch_parties TO service_role;

ALTER TABLE public.watch_parties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parties read all" ON public.watch_parties
  FOR SELECT TO public USING (true);
CREATE POLICY "parties insert as host" ON public.watch_parties
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = host_id);
CREATE POLICY "parties host update" ON public.watch_parties
  FOR UPDATE TO authenticated USING (auth.uid() = host_id) WITH CHECK (auth.uid() = host_id);
CREATE POLICY "parties host delete" ON public.watch_parties
  FOR DELETE TO authenticated USING (auth.uid() = host_id);

CREATE TRIGGER watch_parties_touch BEFORE UPDATE ON public.watch_parties
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Members
CREATE TABLE public.watch_party_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id uuid NOT NULL REFERENCES public.watch_parties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  username text NOT NULL,
  avatar_emoji text,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (party_id, user_id)
);

GRANT SELECT, INSERT, DELETE ON public.watch_party_members TO authenticated;
GRANT SELECT ON public.watch_party_members TO anon;
GRANT ALL ON public.watch_party_members TO service_role;

ALTER TABLE public.watch_party_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members read all" ON public.watch_party_members
  FOR SELECT TO public USING (true);
CREATE POLICY "members self join" ON public.watch_party_members
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "members self leave" ON public.watch_party_members
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.watch_parties;
ALTER PUBLICATION supabase_realtime ADD TABLE public.watch_party_members;

CREATE INDEX watch_parties_code_idx ON public.watch_parties(code);
CREATE INDEX watch_party_members_party_idx ON public.watch_party_members(party_id);