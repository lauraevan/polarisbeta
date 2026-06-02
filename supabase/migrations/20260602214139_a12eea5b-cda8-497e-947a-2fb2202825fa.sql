-- Visibility column on channels
ALTER TABLE public.chat_channels
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public','private','role'));

-- Members table for private rooms
CREATE TABLE IF NOT EXISTS public.chat_channel_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner','member')),
  invited_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (channel_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_channel_members TO authenticated;
GRANT ALL ON public.chat_channel_members TO service_role;

ALTER TABLE public.chat_channel_members ENABLE ROW LEVEL SECURITY;

-- Helper: is the current user a member of a given channel?
CREATE OR REPLACE FUNCTION public.is_channel_member(_channel_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_channel_members
    WHERE channel_id = _channel_id AND user_id = auth.uid()
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_channel_member(uuid) TO authenticated;

-- Membership policies
CREATE POLICY "Members can view their memberships"
  ON public.chat_channel_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.chat_channels c
      WHERE c.id = channel_id AND c.created_by = auth.uid()
    )
  );

CREATE POLICY "Room owner can invite"
  ON public.chat_channel_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_channels c
      WHERE c.id = channel_id AND c.created_by = auth.uid()
    )
  );

CREATE POLICY "Room owner can remove members"
  ON public.chat_channel_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_channels c
      WHERE c.id = channel_id AND c.created_by = auth.uid()
    )
    OR user_id = auth.uid()
  );

-- Tighten channel read: public OR member of private OR owner
DROP POLICY IF EXISTS "channels public read" ON public.chat_channels;
CREATE POLICY "channels read"
  ON public.chat_channels FOR SELECT
  TO public
  USING (
    visibility = 'public'
    OR (auth.uid() IS NOT NULL AND (
      created_by = auth.uid()
      OR public.is_channel_member(id)
    ))
  );

-- Tighten messages read: public channels world-readable; private only for members
DROP POLICY IF EXISTS "messages public read" ON public.chat_messages;
CREATE POLICY "messages read"
  ON public.chat_messages FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_channels c
      WHERE c.id = channel_id
        AND (
          c.visibility = 'public'
          OR (auth.uid() IS NOT NULL AND (c.created_by = auth.uid() OR public.is_channel_member(c.id)))
        )
    )
  );

-- Tighten messages insert: must be a member of the channel (or it's public)
DROP POLICY IF EXISTS "messages auth insert" ON public.chat_messages;
CREATE POLICY "messages auth insert"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.chat_channels c
      WHERE c.id = channel_id
        AND (
          c.visibility = 'public'
          OR c.created_by = auth.uid()
          OR public.is_channel_member(c.id)
        )
    )
  );

CREATE INDEX IF NOT EXISTS chat_channel_members_user_idx ON public.chat_channel_members(user_id);
CREATE INDEX IF NOT EXISTS chat_channel_members_channel_idx ON public.chat_channel_members(channel_id);