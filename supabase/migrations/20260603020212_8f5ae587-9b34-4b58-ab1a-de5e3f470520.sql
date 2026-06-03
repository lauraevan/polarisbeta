ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS muted_until timestamptz,
  ADD COLUMN IF NOT EXISTS mute_reason text;