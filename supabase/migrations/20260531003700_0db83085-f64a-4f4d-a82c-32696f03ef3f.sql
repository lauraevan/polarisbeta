CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_polaris_user();

INSERT INTO public.profiles (id, username, display_name)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'username', split_part(u.email, '@', 1)),
  COALESCE(u.raw_user_meta_data->>'username', split_part(u.email, '@', 1))
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;