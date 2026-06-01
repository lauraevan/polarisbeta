
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_owner boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ban_reason text,
  ADD COLUMN IF NOT EXISTS banned_at timestamptz;

CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  kind text NOT NULL DEFAULT 'announcement',
  posted_by uuid,
  posted_by_username text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.announcements TO anon, authenticated;
GRANT ALL ON public.announcements TO service_role;

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "announcements public read" ON public.announcements
  FOR SELECT USING (true);

-- Allow chat_messages to be deleted by service role for moderation (already covered by service_role grant)
-- Allow chat_channels to be deleted by service role for moderation
GRANT DELETE ON public.chat_channels TO service_role;
GRANT DELETE ON public.chat_messages TO service_role;
GRANT UPDATE ON public.profiles TO service_role;
