
-- School subjects table (school-specific subjects)
CREATE TABLE public.school_subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.school_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.school_subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School admins can manage their subjects"
ON public.school_subjects FOR ALL
USING (school_id IN (SELECT id FROM school_accounts WHERE admin_user_id = auth.uid()))
WITH CHECK (school_id IN (SELECT id FROM school_accounts WHERE admin_user_id = auth.uid()));

CREATE POLICY "Students can view their school subjects"
ON public.school_subjects FOR SELECT
USING (school_id IN (SELECT school_id FROM school_student_relationships WHERE student_id = auth.uid() AND is_active = true));

-- Daily grades table for classwork and homework marks
CREATE TABLE public.student_daily_grades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.school_accounts(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  subject_id UUID NOT NULL REFERENCES public.school_subjects(id) ON DELETE CASCADE,
  grade_date DATE NOT NULL DEFAULT CURRENT_DATE,
  classwork_mark NUMERIC,
  homework_mark NUMERIC,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, subject_id, grade_date)
);

ALTER TABLE public.student_daily_grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School admins can manage daily grades"
ON public.student_daily_grades FOR ALL
USING (school_id IN (SELECT id FROM school_accounts WHERE admin_user_id = auth.uid()))
WITH CHECK (school_id IN (SELECT id FROM school_accounts WHERE admin_user_id = auth.uid()));

CREATE POLICY "Students can view their own daily grades"
ON public.student_daily_grades FOR SELECT
USING (student_id = auth.uid());
