
-- School sections table (e.g., Grade 9A, Grade 10B)
CREATE TABLE public.school_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.school_accounts(id) ON DELETE CASCADE,
  grade_level text NOT NULL,
  section_name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(school_id, grade_level, section_name)
);

-- Student-section assignments
CREATE TABLE public.section_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES public.school_sections(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(section_id, student_id)
);

-- RLS for school_sections
ALTER TABLE public.school_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School admins can manage their sections"
  ON public.school_sections FOR ALL
  USING (school_id IN (SELECT id FROM school_accounts WHERE admin_user_id = auth.uid()))
  WITH CHECK (school_id IN (SELECT id FROM school_accounts WHERE admin_user_id = auth.uid()));

CREATE POLICY "Students can view their school sections"
  ON public.school_sections FOR SELECT
  USING (school_id IN (
    SELECT school_id FROM school_student_relationships WHERE student_id = auth.uid() AND is_active = true
  ));

-- RLS for section_students
ALTER TABLE public.section_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School admins can manage section students"
  ON public.section_students FOR ALL
  USING (section_id IN (
    SELECT ss.id FROM school_sections ss
    JOIN school_accounts sa ON sa.id = ss.school_id
    WHERE sa.admin_user_id = auth.uid()
  ))
  WITH CHECK (section_id IN (
    SELECT ss.id FROM school_sections ss
    JOIN school_accounts sa ON sa.id = ss.school_id
    WHERE sa.admin_user_id = auth.uid()
  ));

CREATE POLICY "Students can view their section assignments"
  ON public.section_students FOR SELECT
  USING (student_id = auth.uid());
