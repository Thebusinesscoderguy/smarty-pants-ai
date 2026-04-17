CREATE TABLE public.school_onboarding_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL UNIQUE,
  current_step INTEGER NOT NULL DEFAULT 0,
  completed_steps TEXT[] NOT NULL DEFAULT '{}',
  framework_chosen BOOLEAN NOT NULL DEFAULT false,
  students_imported INTEGER NOT NULL DEFAULT 0,
  teachers_invited INTEGER NOT NULL DEFAULT 0,
  gradebook_status TEXT NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.school_onboarding_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School admins manage own onboarding progress"
ON public.school_onboarding_progress
FOR ALL
TO authenticated
USING (school_id IN (SELECT id FROM public.school_accounts WHERE admin_user_id = auth.uid()))
WITH CHECK (school_id IN (SELECT id FROM public.school_accounts WHERE admin_user_id = auth.uid()));

CREATE TRIGGER update_school_onboarding_progress_updated_at
BEFORE UPDATE ON public.school_onboarding_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();