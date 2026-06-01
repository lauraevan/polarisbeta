
-- ============ ENUMS ============
DO $$ BEGIN
  CREATE TYPE public.shop_item_kind AS ENUM ('theme','accessory','badge','icon','bundle');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.coin_tx_kind AS ENUM ('quest_reward','purchase','exchange','admin_grant','welcome');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.quest_kind AS ENUM ('watch_movie','play_game','chat_messages','customize_profile','try_wallpaper','daily_login');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============ user_wallet ============
CREATE TABLE IF NOT EXISTS public.user_wallet (
  user_id          uuid PRIMARY KEY,
  coins            integer NOT NULL DEFAULT 0,
  basic_credits    integer NOT NULL DEFAULT 0,
  premium_credits  integer NOT NULL DEFAULT 0,
  updated_at       timestamptz NOT NULL DEFAULT now(),
  created_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT wallet_nonneg CHECK (coins >= 0 AND basic_credits >= 0 AND premium_credits >= 0)
);
GRANT SELECT ON public.user_wallet TO authenticated;
GRANT ALL ON public.user_wallet TO service_role;
ALTER TABLE public.user_wallet ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wallet read own" ON public.user_wallet FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ============ shop_items (public catalog) ============
CREATE TABLE IF NOT EXISTS public.shop_items (
  id              text PRIMARY KEY,
  kind            public.shop_item_kind NOT NULL,
  name            text NOT NULL,
  description     text,
  price_coins     integer,
  price_basic_credits   integer,
  price_premium_credits integer,
  payload         jsonb NOT NULL DEFAULT '{}'::jsonb,
  bundle_contents text[] NOT NULL DEFAULT '{}'::text[],
  is_active       boolean NOT NULL DEFAULT true,
  sort_order      integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.shop_items TO anon, authenticated;
GRANT ALL ON public.shop_items TO service_role;
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shop public read" ON public.shop_items FOR SELECT TO public USING (is_active = true);

-- ============ user_inventory ============
CREATE TABLE IF NOT EXISTS public.user_inventory (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL,
  item_id     text NOT NULL REFERENCES public.shop_items(id) ON DELETE CASCADE,
  acquired_at timestamptz NOT NULL DEFAULT now(),
  equipped    boolean NOT NULL DEFAULT false,
  UNIQUE (user_id, item_id)
);
CREATE INDEX IF NOT EXISTS idx_inv_user ON public.user_inventory(user_id);
GRANT SELECT ON public.user_inventory TO authenticated;
GRANT ALL ON public.user_inventory TO service_role;
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inventory read own" ON public.user_inventory FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "inventory equip own" ON public.user_inventory FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ quests (public catalog) ============
CREATE TABLE IF NOT EXISTS public.quests (
  id           text PRIMARY KEY,
  kind         public.quest_kind NOT NULL,
  name         text NOT NULL,
  description  text NOT NULL,
  reward_coins integer NOT NULL,
  difficulty   text NOT NULL DEFAULT 'easy',  -- easy | medium | hard
  target       jsonb NOT NULL DEFAULT '{}'::jsonb,
  repeatable   boolean NOT NULL DEFAULT false,
  is_active    boolean NOT NULL DEFAULT true,
  sort_order   integer NOT NULL DEFAULT 0,
  CONSTRAINT reward_bounds CHECK (reward_coins BETWEEN 100 AND 750)
);
GRANT SELECT ON public.quests TO anon, authenticated;
GRANT ALL ON public.quests TO service_role;
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quests public read" ON public.quests FOR SELECT TO public USING (is_active = true);

-- ============ user_quest_progress ============
CREATE TABLE IF NOT EXISTS public.user_quest_progress (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL,
  quest_id     text NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  progress     jsonb NOT NULL DEFAULT '{}'::jsonb,  -- heartbeats, counters, etc
  completed    boolean NOT NULL DEFAULT false,
  claimed      boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  claimed_at   timestamptz,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, quest_id)
);
CREATE INDEX IF NOT EXISTS idx_qp_user ON public.user_quest_progress(user_id);
GRANT SELECT ON public.user_quest_progress TO authenticated;
GRANT ALL ON public.user_quest_progress TO service_role;
ALTER TABLE public.user_quest_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quest progress read own" ON public.user_quest_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ============ coin_transactions (audit) ============
CREATE TABLE IF NOT EXISTS public.coin_transactions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL,
  kind       public.coin_tx_kind NOT NULL,
  coins_delta integer NOT NULL,                -- + earn, - spend
  basic_credits_delta integer NOT NULL DEFAULT 0,
  premium_credits_delta integer NOT NULL DEFAULT 0,
  reference  text,                              -- quest_id, item_id, etc.
  meta       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tx_user ON public.coin_transactions(user_id, created_at DESC);
GRANT SELECT ON public.coin_transactions TO authenticated;
GRANT ALL ON public.coin_transactions TO service_role;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tx read own" ON public.coin_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ============ touch updated_at triggers ============
DROP TRIGGER IF EXISTS touch_wallet ON public.user_wallet;
CREATE TRIGGER touch_wallet BEFORE UPDATE ON public.user_wallet
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
DROP TRIGGER IF EXISTS touch_qp ON public.user_quest_progress;
CREATE TRIGGER touch_qp BEFORE UPDATE ON public.user_quest_progress
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ extend signup trigger to seed wallet with 500 welcome coins ============
CREATE OR REPLACE FUNCTION public.handle_new_polaris_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  uname text;
BEGIN
  uname := COALESCE(NULLIF(NEW.raw_user_meta_data->>'username', ''), split_part(NEW.email, '@', 1));

  INSERT INTO public.profiles (id, username, display_name)
  VALUES (NEW.id, uname, uname)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_wallet (user_id, coins)
  VALUES (NEW.id, 500)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.coin_transactions (user_id, kind, coins_delta, reference, meta)
  VALUES (NEW.id, 'welcome', 500, 'welcome_bonus', '{"reason":"new signup"}'::jsonb);

  RETURN NEW;
END;
$function$;

-- Backfill wallets for existing profiles (no welcome bonus to avoid retroactive grants)
INSERT INTO public.user_wallet (user_id, coins)
SELECT id, 0 FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- ============ Seed catalog ============
-- Themes (chat themes)
INSERT INTO public.shop_items (id, kind, name, description, price_coins, payload, sort_order) VALUES
  ('theme.ember',     'theme',     'Ember Hearth',      'Warm amber & ember tones for chat surfaces.',     900, '{"accent":"255 140 70","banner":"230 110 50"}'::jsonb, 10),
  ('theme.cabin',     'theme',     'Cozy Cabin',        'Pine, cinnamon, and lantern-light palette.',      900, '{"accent":"210 140 90","banner":"160 95 60"}'::jsonb, 20),
  ('theme.dusk',      'theme',     'Velvet Dusk',       'Plum dusk with rose-gold accents.',               900, '{"accent":"200 130 160","banner":"120 70 110"}'::jsonb, 30)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.shop_items (id, kind, name, description, price_coins, payload, sort_order) VALUES
  ('acc.firefly',     'accessory', 'Firefly Banner',     'Animated fireflies drift across your banner.',     900, '{"effect":"firefly"}'::jsonb, 40),
  ('acc.fireplace',   'accessory', 'Fireplace Banner',   'A crackling fireplace glow under your name.',      900, '{"effect":"fireplace"}'::jsonb, 50),
  ('acc.snowfall',    'accessory', 'Snowfall Banner',    'Gentle snow falling across your profile.',         900, '{"effect":"snow"}'::jsonb, 60)
ON CONFLICT (id) DO NOTHING;

-- Badges & icons priced in basic credits
INSERT INTO public.shop_items (id, kind, name, description, price_basic_credits, payload, sort_order) VALUES
  ('badge.cinephile', 'badge', 'Cinephile',        'Awarded to true film lovers.',  3, '{"emoji":"🎬","color":"230 110 50"}'::jsonb, 70),
  ('badge.gamer',     'badge', 'Arcade Champion',  'For dedicated players.',         3, '{"emoji":"🕹️","color":"180 90 200"}'::jsonb, 80),
  ('badge.scholar',   'badge', 'Scholar',          'Worn by curious minds.',         3, '{"emoji":"📚","color":"140 110 80"}'::jsonb, 90),
  ('badge.legend',    'badge', 'Legend',           'For the truly dedicated.',       8, '{"emoji":"⭐","color":"250 200 90"}'::jsonb, 100)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.shop_items (id, kind, name, description, price_basic_credits, payload, sort_order) VALUES
  ('icon.flame',      'icon', 'Flame Avatar Frame',   'A warm flame ring around your avatar.',  2, '{"frame":"flame"}'::jsonb, 110),
  ('icon.aurora',     'icon', 'Aurora Avatar Frame',  'Northern lights ring.',                  2, '{"frame":"aurora"}'::jsonb, 120),
  ('icon.gold',       'icon', 'Gold Avatar Frame',    'Premium gold ring.',                     5, '{"frame":"gold"}'::jsonb, 130),
  ('icon.holo',       'icon', 'Holo Avatar Frame',    'Iridescent holographic ring.',           5, '{"frame":"holo"}'::jsonb, 140)
ON CONFLICT (id) DO NOTHING;

-- Bundles (1600 coins, contains 2-3 items that would otherwise cost 1800-2700)
INSERT INTO public.shop_items (id, kind, name, description, price_coins, payload, bundle_contents, sort_order) VALUES
  ('bundle.cozy_cabin', 'bundle', 'Cozy Cabin Pack',
    'Cozy Cabin theme + Fireplace banner. Save 200 coins.',
    1600, '{}'::jsonb, ARRAY['theme.cabin','acc.fireplace'], 200),
  ('bundle.winter_eve', 'bundle', 'Winter Evening Pack',
    'Velvet Dusk theme + Snowfall banner + Firefly accessory. Save 1100 coins.',
    1600, '{}'::jsonb, ARRAY['theme.dusk','acc.snowfall','acc.firefly'], 210)
ON CONFLICT (id) DO NOTHING;

-- Quests
INSERT INTO public.quests (id, kind, name, description, reward_coins, difficulty, target, repeatable, sort_order) VALUES
  ('q.watch_first',    'watch_movie',       'First Showing',         'Watch any movie or show with at least 85% coverage (no skipping).',  300, 'medium', '{"coverage_pct":85}'::jsonb, true,  10),
  ('q.watch_marathon', 'watch_movie',       'Marathon Watcher',      'Watch 3 different titles with full attendance.',                      750, 'hard',   '{"coverage_pct":85,"count":3}'::jsonb, false, 20),
  ('q.play_short',     'play_game',         'Quick Play',            'Play any game for 10 minutes with active focus.',                     150, 'easy',   '{"minutes":10}'::jsonb, true,  30),
  ('q.play_long',      'play_game',         'Game Night',            'Play any game for 15 minutes with active focus.',                     250, 'medium', '{"minutes":15}'::jsonb, true,  40),
  ('q.chat_chatty',    'chat_messages',     'Friendly Face',         'Send 10 chat messages.',                                              100, 'easy',   '{"count":10}'::jsonb, false, 50),
  ('q.profile_setup',  'customize_profile', 'Make It Yours',         'Customize your profile (display name, bio, accent).',                 150, 'easy',   '{}'::jsonb, false, 60),
  ('q.try_wallpaper',  'try_wallpaper',     'Change of Scenery',     'Try at least 3 different wallpapers.',                                100, 'easy',   '{"count":3}'::jsonb, false, 70),
  ('q.daily_login',    'daily_login',       'Daily Visit',           'Log in today.',                                                       100, 'easy',   '{}'::jsonb, true,  80)
ON CONFLICT (id) DO NOTHING;
