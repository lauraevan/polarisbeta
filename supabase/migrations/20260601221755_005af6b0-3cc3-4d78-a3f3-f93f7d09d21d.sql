-- Profile extensions for image banners + spending stats
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS banner_url text,
  ADD COLUMN IF NOT EXISTS spent_coins integer NOT NULL DEFAULT 0;

-- Channel moderation: filter + role gate
ALTER TABLE public.chat_channels
  ADD COLUMN IF NOT EXISTS filter_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS allowed_role text;

-- Allow chat_messages updates (used by rename + moderation by admin via service role)
-- service_role already bypasses RLS, but add an explicit owner-only client policy too
-- so the future client editing flow can use it without service role.

-- Owner-only policies (uses profiles.is_owner)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='chat_messages' AND policyname='messages owner update'
  ) THEN
    CREATE POLICY "messages owner update" ON public.chat_messages
      FOR UPDATE TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_owner))
      WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='chat_messages' AND policyname='messages owner delete'
  ) THEN
    CREATE POLICY "messages owner delete" ON public.chat_messages
      FOR DELETE TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_owner));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='chat_channels' AND policyname='channels owner update'
  ) THEN
    CREATE POLICY "channels owner update" ON public.chat_channels
      FOR UPDATE TO authenticated
      USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_owner))
      WITH CHECK (true);
  END IF;
END $$;

-- Track spend automatically when coin_transactions records a negative coin_delta on purchases
CREATE OR REPLACE FUNCTION public.bump_spent_coins()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.coins_delta < 0 AND NEW.kind IN ('purchase','exchange') THEN
    UPDATE public.profiles
      SET spent_coins = COALESCE(spent_coins, 0) + ABS(NEW.coins_delta)
      WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_bump_spent_coins ON public.coin_transactions;
CREATE TRIGGER trg_bump_spent_coins
AFTER INSERT ON public.coin_transactions
FOR EACH ROW EXECUTE FUNCTION public.bump_spent_coins();
