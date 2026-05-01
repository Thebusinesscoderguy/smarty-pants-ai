-- Add status tracking + acceptance metadata to student_invitations
ALTER TABLE public.student_invitations
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS accepted_user_id uuid;

-- Constrain to known values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'student_invitations_status_check'
  ) THEN
    ALTER TABLE public.student_invitations
      ADD CONSTRAINT student_invitations_status_check
      CHECK (status IN ('pending','sent','accepted','expired'));
  END IF;
END $$;

-- Backfill from existing data
UPDATE public.student_invitations
SET status = 'accepted', sent_at = COALESCE(sent_at, created_at)
WHERE used = true AND status <> 'accepted';

UPDATE public.student_invitations
SET status = 'expired', sent_at = COALESCE(sent_at, created_at)
WHERE used = false AND expires_at < now() AND status NOT IN ('expired','accepted');

UPDATE public.student_invitations
SET status = 'sent', sent_at = COALESCE(sent_at, created_at)
WHERE used = false AND expires_at >= now() AND status = 'pending';

CREATE INDEX IF NOT EXISTS idx_student_invitations_status
  ON public.student_invitations (school_id, status);