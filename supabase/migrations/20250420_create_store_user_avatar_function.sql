
-- Create a function to store user avatar data
CREATE OR REPLACE FUNCTION public.store_user_avatar(
  p_user_id UUID,
  p_description TEXT,
  p_avatar_url TEXT
) RETURNS void AS $$
BEGIN
  -- Insert or update user avatar record
  INSERT INTO public.user_avatars (
    user_id,
    description,
    avatar_url,
    updated_at
  ) VALUES (
    p_user_id,
    p_description,
    p_avatar_url,
    now()
  ) ON CONFLICT (user_id) 
  DO UPDATE SET
    description = p_description,
    avatar_url = p_avatar_url,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission to all users
GRANT EXECUTE ON FUNCTION public.store_user_avatar TO public;
