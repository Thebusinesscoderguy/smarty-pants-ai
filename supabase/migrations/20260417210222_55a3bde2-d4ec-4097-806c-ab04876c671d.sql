-- Public shareable artifacts: quizzes, study plans, presentations
CREATE TABLE public.shared_artifacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  share_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(12), 'base64'),
  artifact_type TEXT NOT NULL CHECK (artifact_type IN ('quiz', 'study_plan', 'presentation')),
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  owner_id UUID NOT NULL,
  source_id UUID,
  view_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_shared_artifacts_token ON public.shared_artifacts(share_token);
CREATE INDEX idx_shared_artifacts_owner ON public.shared_artifacts(owner_id);

ALTER TABLE public.shared_artifacts ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can read active shares — this is the whole point of public sharing
CREATE POLICY "Active shared artifacts are publicly viewable"
ON public.shared_artifacts
FOR SELECT
USING (is_active = true);

-- Only the owner can create their own shares
CREATE POLICY "Users can create their own shared artifacts"
ON public.shared_artifacts
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

-- Only the owner can update (e.g., deactivate or rename)
CREATE POLICY "Users can update their own shared artifacts"
ON public.shared_artifacts
FOR UPDATE
USING (auth.uid() = owner_id);

-- Only the owner can delete
CREATE POLICY "Users can delete their own shared artifacts"
ON public.shared_artifacts
FOR DELETE
USING (auth.uid() = owner_id);

-- Auto-update updated_at
CREATE TRIGGER update_shared_artifacts_updated_at
BEFORE UPDATE ON public.shared_artifacts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- View counter function (callable by anon — increments only, no other writes)
CREATE OR REPLACE FUNCTION public.increment_share_view(_token TEXT)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.shared_artifacts
  SET view_count = view_count + 1
  WHERE share_token = _token AND is_active = true;
$$;

GRANT EXECUTE ON FUNCTION public.increment_share_view(TEXT) TO anon, authenticated;