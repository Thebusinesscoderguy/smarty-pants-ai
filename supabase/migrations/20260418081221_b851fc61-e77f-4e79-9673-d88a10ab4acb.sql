-- Part 1: Add AI grading fields to homework_submissions
ALTER TABLE public.homework_submissions
  ADD COLUMN IF NOT EXISTS ai_score numeric,
  ADD COLUMN IF NOT EXISTS ai_feedback text,
  ADD COLUMN IF NOT EXISTS ai_confidence numeric,
  ADD COLUMN IF NOT EXISTS ai_graded_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_homework_submissions_status_ai
  ON public.homework_submissions (status, ai_graded_at);

-- Part 2: Parent email preferences
CREATE TABLE IF NOT EXISTS public.parent_email_preferences (
  parent_id uuid PRIMARY KEY,
  weekly_digest_enabled boolean NOT NULL DEFAULT true,
  last_digest_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.parent_email_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents view own email prefs"
  ON public.parent_email_preferences FOR SELECT
  USING (auth.uid() = parent_id);

CREATE POLICY "Parents insert own email prefs"
  ON public.parent_email_preferences FOR INSERT
  WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Parents update own email prefs"
  ON public.parent_email_preferences FOR UPDATE
  USING (auth.uid() = parent_id);

CREATE TRIGGER trg_parent_email_preferences_updated
  BEFORE UPDATE ON public.parent_email_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();