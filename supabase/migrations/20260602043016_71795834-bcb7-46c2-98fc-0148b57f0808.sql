
CREATE TYPE public.ban_type AS ENUM ('full_site', 'chat_only', 'dm_only', 'shadow');
CREATE TYPE public.ban_scope AS ENUM ('user', 'ip', 'ip_range', 'device', 'asn', 'country');
CREATE TYPE public.ban_status AS ENUM ('active', 'expired', 'lifted');
CREATE TYPE public.security_event_kind AS ENUM (
  'signin','signup','signout','new_device','session_resumed',
  'ban_issued','ban_lifted','ban_evasion_attempt','blocked_access',
  'appeal_submitted','appeal_reviewed','suspicious_activity','admin_action'
);

CREATE TABLE public.bans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type public.ban_type NOT NULL DEFAULT 'full_site',
  status public.ban_status NOT NULL DEFAULT 'active',
  reason TEXT NOT NULL DEFAULT 'No reason provided',
  notes TEXT,
  issued_by UUID,
  issued_by_username TEXT,
  expires_at TIMESTAMPTZ,
  lifted_at TIMESTAMPTZ,
  lifted_by UUID,
  lifted_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bans TO authenticated;
GRANT ALL ON public.bans TO service_role;
ALTER TABLE public.bans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can view all bans" ON public.bans FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_owner));

CREATE TABLE public.ban_targets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ban_id UUID NOT NULL REFERENCES public.bans(id) ON DELETE CASCADE,
  scope public.ban_scope NOT NULL,
  value TEXT NOT NULL,
  country TEXT, region TEXT, city TEXT,
  latitude DOUBLE PRECISION, longitude DOUBLE PRECISION,
  asn TEXT, org TEXT,
  is_vpn BOOLEAN NOT NULL DEFAULT false,
  is_proxy BOOLEAN NOT NULL DEFAULT false,
  is_tor BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (scope, value, ban_id)
);
CREATE INDEX idx_ban_targets_lookup ON public.ban_targets(scope, value);
CREATE INDEX idx_ban_targets_ban ON public.ban_targets(ban_id);
GRANT SELECT ON public.ban_targets TO authenticated;
GRANT ALL ON public.ban_targets TO service_role;
ALTER TABLE public.ban_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can view ban targets" ON public.ban_targets FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_owner));

CREATE TABLE public.device_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  username TEXT,
  device_fingerprint TEXT NOT NULL,
  ip TEXT,
  user_agent TEXT,
  browser TEXT, os TEXT, device_type TEXT,
  country TEXT, region TEXT, city TEXT,
  latitude DOUBLE PRECISION, longitude DOUBLE PRECISION,
  asn TEXT, org TEXT,
  is_vpn BOOLEAN NOT NULL DEFAULT false,
  is_proxy BOOLEAN NOT NULL DEFAULT false,
  is_tor BOOLEAN NOT NULL DEFAULT false,
  trusted BOOLEAN NOT NULL DEFAULT false,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  visit_count INTEGER NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX uniq_device_sessions_user ON public.device_sessions(device_fingerprint, user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX uniq_device_sessions_guest ON public.device_sessions(device_fingerprint) WHERE user_id IS NULL;
CREATE INDEX idx_device_sessions_user ON public.device_sessions(user_id);
CREATE INDEX idx_device_sessions_ip ON public.device_sessions(ip);
CREATE INDEX idx_device_sessions_fp ON public.device_sessions(device_fingerprint);
CREATE INDEX idx_device_sessions_last_seen ON public.device_sessions(last_seen_at DESC);
GRANT SELECT ON public.device_sessions TO authenticated;
GRANT ALL ON public.device_sessions TO service_role;
ALTER TABLE public.device_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can view all sessions" ON public.device_sessions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_owner));
CREATE POLICY "Users view own sessions" ON public.device_sessions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE public.security_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kind public.security_event_kind NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  user_id UUID, username TEXT,
  device_fingerprint TEXT, ip TEXT, user_agent TEXT,
  country TEXT, region TEXT, city TEXT,
  latitude DOUBLE PRECISION, longitude DOUBLE PRECISION,
  asn TEXT, org TEXT,
  is_vpn BOOLEAN NOT NULL DEFAULT false,
  is_proxy BOOLEAN NOT NULL DEFAULT false,
  is_tor BOOLEAN NOT NULL DEFAULT false,
  path TEXT,
  detail JSONB NOT NULL DEFAULT '{}'::jsonb,
  ban_id UUID REFERENCES public.bans(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_security_events_kind ON public.security_events(kind);
CREATE INDEX idx_security_events_user ON public.security_events(user_id);
CREATE INDEX idx_security_events_ip ON public.security_events(ip);
CREATE INDEX idx_security_events_fp ON public.security_events(device_fingerprint);
CREATE INDEX idx_security_events_created ON public.security_events(created_at DESC);
GRANT SELECT ON public.security_events TO authenticated;
GRANT ALL ON public.security_events TO service_role;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can view all events" ON public.security_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_owner));

CREATE TABLE public.ban_appeals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ban_id UUID NOT NULL REFERENCES public.bans(id) ON DELETE CASCADE,
  user_id UUID, device_fingerprint TEXT, ip TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID, reviewed_at TIMESTAMPTZ, review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.ban_appeals TO authenticated;
GRANT INSERT ON public.ban_appeals TO anon;
GRANT ALL ON public.ban_appeals TO service_role;
ALTER TABLE public.ban_appeals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit appeals" ON public.ban_appeals FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Owners view appeals" ON public.ban_appeals FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_owner));

CREATE TRIGGER bans_touch BEFORE UPDATE ON public.bans
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.check_ban_status(
  _user_id UUID, _ip TEXT, _device_fingerprint TEXT
) RETURNS TABLE (
  ban_id UUID, type public.ban_type, reason TEXT,
  expires_at TIMESTAMPTZ, created_at TIMESTAMPTZ
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT DISTINCT b.id, b.type, b.reason, b.expires_at, b.created_at
  FROM public.bans b
  JOIN public.ban_targets t ON t.ban_id = b.id
  WHERE b.status = 'active'
    AND (b.expires_at IS NULL OR b.expires_at > now())
    AND (
      (_user_id IS NOT NULL AND t.scope = 'user' AND t.value = _user_id::text)
      OR (_ip IS NOT NULL AND t.scope = 'ip' AND t.value = _ip)
      OR (_device_fingerprint IS NOT NULL AND t.scope = 'device' AND t.value = _device_fingerprint)
    )
  ORDER BY b.created_at DESC;
$$;
GRANT EXECUTE ON FUNCTION public.check_ban_status(UUID, TEXT, TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_owner);
$$;
GRANT EXECUTE ON FUNCTION public.is_owner() TO authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.security_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.device_sessions;
