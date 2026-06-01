-- Convert all badge/icon shop items from premium AI credits to coins.
-- Coins are the only currency for shop items now; AI credits are AI-only.

UPDATE public.shop_items
SET price_coins = CASE
      WHEN id = 'badge.cinephile' THEN 600
      WHEN id = 'badge.gamer'     THEN 600
      WHEN id = 'badge.scholar'   THEN 600
      WHEN id = 'badge.legend'    THEN 1600
      WHEN id = 'icon.flame'      THEN 400
      WHEN id = 'icon.aurora'     THEN 400
      WHEN id = 'icon.gold'       THEN 1000
      WHEN id = 'icon.holo'       THEN 1000
      WHEN id = 'badge.early'     THEN 500
      WHEN id = 'badge.host'      THEN 600
      WHEN id = 'badge.collector' THEN 800
      WHEN id = 'icon.lantern'    THEN 700
      WHEN id = 'icon.maple'      THEN 700
      ELSE price_coins
    END,
    price_basic_credits = NULL,
    price_premium_credits = NULL
WHERE kind IN ('badge', 'icon');

-- DM moderation flags: store auto-blocked DMs for review
CREATE TABLE IF NOT EXISTS public.dm_moderation_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  blocked_content TEXT NOT NULL,
  matched_terms TEXT[] NOT NULL DEFAULT '{}',
  severity TEXT NOT NULL DEFAULT 'high',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.dm_moderation_flags TO authenticated;
GRANT ALL ON public.dm_moderation_flags TO service_role;

ALTER TABLE public.dm_moderation_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can insert their own flagged dms"
  ON public.dm_moderation_flags
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "users can view their own flagged sends"
  ON public.dm_moderation_flags
  FOR SELECT TO authenticated
  USING (auth.uid() = sender_id);