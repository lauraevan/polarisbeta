-- Extend quest_kind enum
ALTER TYPE public.quest_kind ADD VALUE IF NOT EXISTS 'shop_visit';
ALTER TYPE public.quest_kind ADD VALUE IF NOT EXISTS 'shop_purchase';