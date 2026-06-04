
ALTER TABLE public.content_assignments
  ADD COLUMN IF NOT EXISTS share_token text UNIQUE
    DEFAULT encode(gen_random_bytes(16), 'hex');

UPDATE public.content_assignments
  SET share_token = encode(gen_random_bytes(16), 'hex')
  WHERE share_token IS NULL;

ALTER TABLE public.content_assignments
  ALTER COLUMN share_token SET NOT NULL;

-- Resolve a share token to a test id (only for active test assignments).
-- Security definer so anonymous/auth users can resolve the link without
-- direct table read access; access to the actual test is still gated by
-- existing test RLS + is_test_assigned_to_student.
CREATE OR REPLACE FUNCTION public.resolve_test_share_token(_token text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT content_id
  FROM public.content_assignments
  WHERE share_token = _token
    AND content_type = 'test'
    AND is_active = true
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.resolve_test_share_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_test_share_token(text) TO anon, authenticated;
