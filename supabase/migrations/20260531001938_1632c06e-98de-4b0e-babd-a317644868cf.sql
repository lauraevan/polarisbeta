
-- Chat channels (public rooms) + messages
CREATE TABLE public.chat_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  topic text DEFAULT 'general',
  emoji text DEFAULT '💬',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.chat_channels TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.chat_channels TO authenticated;
GRANT ALL ON public.chat_channels TO service_role;
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "channels public read" ON public.chat_channels FOR SELECT USING (true);
CREATE POLICY "channels auth insert" ON public.chat_channels FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "channels owner delete" ON public.chat_channels FOR DELETE TO authenticated USING (auth.uid() = created_by);

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  avatar_emoji text,
  accent_color text,
  content text,
  -- attachments: array of {kind:'image'|'gif'|'video'|'drawing'|'link', url, meta?}
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  reply_to uuid REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX chat_messages_channel_created_idx ON public.chat_messages (channel_id, created_at DESC);
GRANT SELECT ON public.chat_messages TO anon, authenticated;
GRANT INSERT, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages public read" ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "messages auth insert" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "messages owner delete" ON public.chat_messages FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_channels;

-- Seed default channels
INSERT INTO public.chat_channels (slug, name, description, emoji) VALUES
  ('general',   'general',   'Polaris chat — the lobby',         '💬'),
  ('games',     'games',     'Talk about what you''re playing',  '🎮'),
  ('media',     'media',     'Movies, shows, anime',             '🎬'),
  ('art',       'art',       'Drawings + creative posts',        '🎨'),
  ('gartic',    'gartic',    'Gartic Phone invites',             '🖌️'),
  ('off-topic', 'off-topic', 'Anything goes',                    '✨');
