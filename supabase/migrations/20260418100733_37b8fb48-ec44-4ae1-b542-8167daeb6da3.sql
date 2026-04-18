
-- 1. Lesson plan → quiz link
ALTER TABLE public.teacher_lesson_plans
ADD COLUMN IF NOT EXISTS linked_quiz_id UUID REFERENCES public.quizzes(id) ON DELETE SET NULL;

-- 2. School email preferences (principal digest opt-in)
CREATE TABLE IF NOT EXISTS public.school_email_preferences (
  school_id UUID PRIMARY KEY REFERENCES public.school_accounts(id) ON DELETE CASCADE,
  weekly_digest_enabled BOOLEAN NOT NULL DEFAULT true,
  last_digest_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.school_email_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School admins manage own preferences"
ON public.school_email_preferences
FOR ALL
TO authenticated
USING (school_id IN (SELECT id FROM public.school_accounts WHERE admin_user_id = auth.uid()))
WITH CHECK (school_id IN (SELECT id FROM public.school_accounts WHERE admin_user_id = auth.uid()));

CREATE TRIGGER update_school_email_preferences_updated_at
BEFORE UPDATE ON public.school_email_preferences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Demo requests (Book a Demo form)
CREATE TABLE IF NOT EXISTS public.demo_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  school_name TEXT,
  school_size TEXT,
  role TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.demo_requests ENABLE ROW LEVEL SECURITY;

-- Anyone (including unauthenticated) can submit a demo request
CREATE POLICY "Anyone can submit demo requests"
ON public.demo_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(name) > 0 AND length(name) <= 200
  AND length(email) > 0 AND length(email) <= 320
  AND (message IS NULL OR length(message) <= 2000)
);

-- No one can read except via service role (admin uses dashboard)
-- Intentionally no SELECT policy: edge function reads with service role
