
ALTER TABLE public.chat_channels ADD COLUMN IF NOT EXISTS slow_mode_seconds integer NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS force_logout_at timestamptz;
