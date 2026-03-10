
-- Daily attendance tracking per student per subject
CREATE TABLE public.student_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.school_accounts(id),
  student_id UUID NOT NULL,
  subject_id UUID NOT NULL REFERENCES public.school_subjects(id),
  attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_present BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, subject_id, attendance_date)
);

ALTER TABLE public.student_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School admins can manage attendance"
  ON public.student_attendance FOR ALL
  USING (school_id IN (SELECT id FROM school_accounts WHERE admin_user_id = auth.uid()))
  WITH CHECK (school_id IN (SELECT id FROM school_accounts WHERE admin_user_id = auth.uid()));

CREATE POLICY "Students can view their own attendance"
  ON public.student_attendance FOR SELECT
  USING (student_id = auth.uid());

-- Semester marks for project, literacy, final exam (one-time entries per student per subject per semester)
CREATE TABLE public.student_semester_marks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.school_accounts(id),
  student_id UUID NOT NULL,
  subject_id UUID NOT NULL REFERENCES public.school_subjects(id),
  semester TEXT NOT NULL DEFAULT 'S1',
  project_mark NUMERIC CHECK (project_mark >= 0 AND project_mark <= 10),
  literacy_mark NUMERIC CHECK (literacy_mark >= 0 AND literacy_mark <= 10),
  final_exam_mark NUMERIC CHECK (final_exam_mark >= 0 AND final_exam_mark <= 20),
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, subject_id, semester)
);

ALTER TABLE public.student_semester_marks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School admins can manage semester marks"
  ON public.student_semester_marks FOR ALL
  USING (school_id IN (SELECT id FROM school_accounts WHERE admin_user_id = auth.uid()))
  WITH CHECK (school_id IN (SELECT id FROM school_accounts WHERE admin_user_id = auth.uid()));

CREATE POLICY "Students can view their own semester marks"
  ON public.student_semester_marks FOR SELECT
  USING (student_id = auth.uid());
