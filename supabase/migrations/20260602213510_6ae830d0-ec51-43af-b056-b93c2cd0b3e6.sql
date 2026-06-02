-- Profile pro state
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pro_until timestamptz,
  ADD COLUMN IF NOT EXISTS pro_tier text;

-- pro_keys table
CREATE TABLE IF NOT EXISTS public.pro_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  tier text NOT NULL CHECK (tier IN ('monthly','lifetime')),
  duration_days integer,
  source text DEFAULT 'manual',
  note text,
  redeemed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  redeemed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pro_keys TO authenticated;
GRANT ALL ON public.pro_keys TO service_role;

ALTER TABLE public.pro_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage all pro keys"
  ON public.pro_keys FOR ALL
  TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

CREATE POLICY "Users can see their redeemed key"
  ON public.pro_keys FOR SELECT
  TO authenticated
  USING (redeemed_by = auth.uid());

CREATE INDEX IF NOT EXISTS pro_keys_code_idx ON public.pro_keys(code);

-- Helpers
CREATE OR REPLACE FUNCTION public.is_pro(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND pro_until IS NOT NULL AND pro_until > now()
  );
$$;

CREATE OR REPLACE FUNCTION public.redeem_pro_key(_code text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _key record;
  _new_until timestamptz;
  _tier text;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT * INTO _key FROM public.pro_keys WHERE code = _code;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_code');
  END IF;
  IF _key.redeemed_by IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_redeemed');
  END IF;
  IF _key.expires_at IS NOT NULL AND _key.expires_at < now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'expired');
  END IF;

  IF _key.tier = 'lifetime' THEN
    _new_until := 'infinity'::timestamptz;
    _tier := 'lifetime';
  ELSE
    _new_until := GREATEST(now(), COALESCE((SELECT pro_until FROM public.profiles WHERE id = _uid), now()))
                  + (COALESCE(_key.duration_days, 30) || ' days')::interval;
    _tier := 'monthly';
  END IF;

  UPDATE public.pro_keys
    SET redeemed_by = _uid, redeemed_at = now()
    WHERE id = _key.id;

  UPDATE public.profiles
    SET pro_until = _new_until, pro_tier = _tier
    WHERE id = _uid;

  RETURN jsonb_build_object('ok', true, 'tier', _tier, 'pro_until', _new_until);
END;
$$;

GRANT EXECUTE ON FUNCTION public.redeem_pro_key(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_pro(uuid) TO authenticated, anon;