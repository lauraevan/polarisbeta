INSERT INTO public.shop_items (id, kind, name, description, price_coins, price_basic_credits, payload, bundle_contents, is_active, sort_order) VALUES
  ('theme.harvest',    'theme',     'Harvest Moon',        'Golden harvest tones with deep amber glow',         900, NULL, '{"accent":"245 180 90","emoji":"🌾"}'::jsonb, '{}', true, 10),
  ('theme.maple',      'theme',     'Maple Hearth',        'Crimson maple leaves over dusky wood',              900, NULL, '{"accent":"220 90 60","emoji":"🍁"}'::jsonb,  '{}', true, 11),
  ('theme.candlelit',  'theme',     'Candlelit Library',   'Soft beeswax warmth for late-night reads',          900, NULL, '{"accent":"235 165 95","emoji":"🕯️"}'::jsonb, '{}', true, 12),
  ('theme.lantern',    'theme',     'Paper Lantern',       'Warm rice-paper glow with a quiet hush',            900, NULL, '{"accent":"250 200 130","emoji":"🏮"}'::jsonb, '{}', true, 13),
  ('acc.steam',        'accessory', 'Tea Steam',           'Soft rising steam over your banner',                900, NULL, '{"effect":"steam","emoji":"🍵"}'::jsonb,       '{}', true, 14),
  ('acc.embers',       'accessory', 'Rising Embers',       'Glowing embers drift upward gently',                900, NULL, '{"effect":"embers","emoji":"🔥"}'::jsonb,      '{}', true, 15),
  ('acc.leaves',       'accessory', 'Falling Leaves',      'Autumn leaves cascade across the banner',           900, NULL, '{"effect":"leaves","emoji":"🍂"}'::jsonb,      '{}', true, 16),
  ('acc.snowdrift',    'accessory', 'Snowdrift',           'Settled snow with the slowest drift',               900, NULL, '{"effect":"snowdrift","emoji":"❄️"}'::jsonb,   '{}', true, 17),
  ('badge.early',      'badge',     'Early Lantern',       'Joined Polaris in the early days',                  NULL, 250,  '{"color":"245 180 90"}'::jsonb,                '{}', true, 20),
  ('badge.host',       'badge',     'Watch Party Host',    'Hosted three or more watch parties',                NULL, 300,  '{"color":"220 110 70"}'::jsonb,                '{}', true, 21),
  ('badge.collector',  'badge',     'Collector',           'Owns 10 or more shop items',                        NULL, 400,  '{"color":"250 200 130"}'::jsonb,               '{}', true, 22),
  ('icon.lantern',     'icon',      'Lantern Avatar Frame','Warm hanging-lantern frame',                        NULL, 350,  '{"frame":"lantern"}'::jsonb,                   '{}', true, 23),
  ('icon.maple',       'icon',      'Maple Avatar Frame',  'Falling-maple animated frame',                      NULL, 350,  '{"frame":"maple"}'::jsonb,                     '{}', true, 24),
  ('bundle.autumn_eve','bundle',    'Autumn Evenings Pack','Harvest + Maple themes with falling leaves & embers',1600,NULL,'{"emoji":"🍂"}'::jsonb,                        '{theme.harvest,theme.maple,acc.leaves,acc.embers}', true, 30),
  ('bundle.tea_room',  'bundle',    'Tea Room Pack',       'Candlelit Library, lantern accents, tea steam',     1600, NULL, '{"emoji":"🍵"}'::jsonb,                        '{theme.candlelit,theme.lantern,acc.steam,icon.lantern}', true, 31),
  ('bundle.collector', 'bundle',    'Collector''s Crate',  'Three badges + a lantern frame for the seasoned host', 1600, NULL, '{"emoji":"🏆"}'::jsonb,                     '{badge.early,badge.host,badge.collector,icon.lantern}', true, 32)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.quests (id, kind, name, description, difficulty, repeatable, reward_coins, target, is_active, sort_order) VALUES
  ('q.shop_visit', 'shop_visit',  'Window Shopping',  'Visit the Cozy Shop today',           'easy',   true,  100, '{}'::jsonb, true, 0),
  ('q.chat_warm',  'chat_messages','Warm Welcome',    'Send 25 chat messages',               'medium', false, 300, '{"count":25}'::jsonb, true, 5),
  ('q.collector',  'shop_purchase','First Treasure',  'Purchase any item from the shop',     'easy',   false, 200, '{}'::jsonb, true, 6)
ON CONFLICT (id) DO NOTHING;