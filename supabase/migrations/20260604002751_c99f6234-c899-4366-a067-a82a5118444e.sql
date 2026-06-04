-- Force-logout every active session and revoke owner from anyone other than the legitimate owner.
UPDATE public.profiles SET force_logout_at = now();
UPDATE public.profiles SET is_owner = false, custom_role = NULL WHERE username <> 'bullet' AND is_owner = true;