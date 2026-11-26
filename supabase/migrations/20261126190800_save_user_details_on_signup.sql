CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_name text := COALESCE(
    NULLIF(BTRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(BTRIM(NEW.raw_user_meta_data->>'name'), ''),
    NULLIF(SPLIT_PART(COALESCE(NEW.email, ''), '@', 1), ''),
    'Reader'
  );
  profile_photo text := NULLIF(NEW.raw_user_meta_data->>'avatar_url', '');
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (NEW.id, profile_name, profile_photo)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_details (user_id, full_name, photo_url)
  VALUES (NEW.id, profile_name, profile_photo)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;
