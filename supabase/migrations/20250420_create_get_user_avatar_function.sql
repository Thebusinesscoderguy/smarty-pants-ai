
-- Create a function to get user avatar data
CREATE OR REPLACE FUNCTION public.get_user_avatar(
  p_user_id UUID
) RETURNS jsonb AS $$
DECLARE
  avatar_record jsonb;
BEGIN
  SELECT jsonb_build_object(
    'id', id,
    'user_id', user_id,
    'description', description,
    'avatar_url', avatar_url,
    'created_at', created_at,
    'updated_at', updated_at
  ) INTO avatar_record
  FROM public.user_avatars
  WHERE user_id = p_user_id;
  
  RETURN avatar_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission to all users
GRANT EXECUTE ON FUNCTION public.get_user_avatar TO public;
