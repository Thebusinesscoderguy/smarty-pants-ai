
-- Teachers table
CREATE TABLE public.school_teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.school_accounts(id) ON DELETE CASCADE,
  email text NOT NULL,
  first_name text,
  last_name text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(school_id, email)
);

ALTER TABLE public.school_teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School admins can manage their teachers"
  ON public.school_teachers FOR ALL
  USING (school_id IN (SELECT id FROM public.school_accounts WHERE admin_user_id = auth.uid()))
  WITH CHECK (school_id IN (SELECT id FROM public.school_accounts WHERE admin_user_id = auth.uid()));

CREATE POLICY "Teachers can view their own record"
  ON public.school_teachers FOR SELECT
  USING (lower(email) = lower(auth.jwt()->>'email') AND is_active = true);

-- Teacher subject-section assignments
CREATE TABLE public.teacher_subject_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.school_teachers(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.school_subjects(id) ON DELETE CASCADE,
  section_id uuid NOT NULL REFERENCES public.school_sections(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(teacher_id, subject_id, section_id)
);

ALTER TABLE public.teacher_subject_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School admins can manage teacher assignments"
  ON public.teacher_subject_sections FOR ALL
  USING (teacher_id IN (
    SELECT t.id FROM public.school_teachers t
    JOIN public.school_accounts sa ON sa.id = t.school_id
    WHERE sa.admin_user_id = auth.uid()
  ))
  WITH CHECK (teacher_id IN (
    SELECT t.id FROM public.school_teachers t
    JOIN public.school_accounts sa ON sa.id = t.school_id
    WHERE sa.admin_user_id = auth.uid()
  ));

CREATE POLICY "Teachers can view their own assignments"
  ON public.teacher_subject_sections FOR SELECT
  USING (teacher_id IN (
    SELECT id FROM public.school_teachers
    WHERE lower(email) = lower(auth.jwt()->>'email') AND is_active = true
  ));

-- Allow teachers to read school_subjects they are assigned to
CREATE POLICY "Teachers can view assigned subjects"
  ON public.school_subjects FOR SELECT
  USING (id IN (
    SELECT tss.subject_id FROM public.teacher_subject_sections tss
    JOIN public.school_teachers t ON t.id = tss.teacher_id
    WHERE lower(t.email) = lower(auth.jwt()->>'email') AND t.is_active = true
  ));

-- Allow teachers to read school_sections they are assigned to
CREATE POLICY "Teachers can view assigned sections"
  ON public.school_sections FOR SELECT
  USING (id IN (
    SELECT tss.section_id FROM public.teacher_subject_sections tss
    JOIN public.school_teachers t ON t.id = tss.teacher_id
    WHERE lower(t.email) = lower(auth.jwt()->>'email') AND t.is_active = true
  ));

-- Allow teachers to manage daily grades for their assigned subjects
CREATE POLICY "Teachers can manage daily grades for their subjects"
  ON public.student_daily_grades FOR ALL
  USING (subject_id IN (
    SELECT tss.subject_id FROM public.teacher_subject_sections tss
    JOIN public.school_teachers t ON t.id = tss.teacher_id
    WHERE lower(t.email) = lower(auth.jwt()->>'email') AND t.is_active = true
  ))
  WITH CHECK (subject_id IN (
    SELECT tss.subject_id FROM public.teacher_subject_sections tss
    JOIN public.school_teachers t ON t.id = tss.teacher_id
    WHERE lower(t.email) = lower(auth.jwt()->>'email') AND t.is_active = true
  ));

-- Allow teachers to manage attendance for their assigned subjects
CREATE POLICY "Teachers can manage attendance for their subjects"
  ON public.student_attendance FOR ALL
  USING (subject_id IN (
    SELECT tss.subject_id FROM public.teacher_subject_sections tss
    JOIN public.school_teachers t ON t.id = tss.teacher_id
    WHERE lower(t.email) = lower(auth.jwt()->>'email') AND t.is_active = true
  ))
  WITH CHECK (subject_id IN (
    SELECT tss.subject_id FROM public.teacher_subject_sections tss
    JOIN public.school_teachers t ON t.id = tss.teacher_id
    WHERE lower(t.email) = lower(auth.jwt()->>'email') AND t.is_active = true
  ));

-- Allow teachers to manage semester marks for their assigned subjects
CREATE POLICY "Teachers can manage semester marks for their subjects"
  ON public.student_semester_marks FOR ALL
  USING (subject_id IN (
    SELECT tss.subject_id FROM public.teacher_subject_sections tss
    JOIN public.school_teachers t ON t.id = tss.teacher_id
    WHERE lower(t.email) = lower(auth.jwt()->>'email') AND t.is_active = true
  ))
  WITH CHECK (subject_id IN (
    SELECT tss.subject_id FROM public.teacher_subject_sections tss
    JOIN public.school_teachers t ON t.id = tss.teacher_id
    WHERE lower(t.email) = lower(auth.jwt()->>'email') AND t.is_active = true
  ));

-- Allow teachers to view students in their assigned sections
CREATE POLICY "Teachers can view students in their sections"
  ON public.section_students FOR SELECT
  USING (section_id IN (
    SELECT tss.section_id FROM public.teacher_subject_sections tss
    JOIN public.school_teachers t ON t.id = tss.teacher_id
    WHERE lower(t.email) = lower(auth.jwt()->>'email') AND t.is_active = true
  ));

-- Allow teachers to view student relationships for their school
CREATE POLICY "Teachers can view school student relationships"
  ON public.school_student_relationships FOR SELECT
  USING (school_id IN (
    SELECT t.school_id FROM public.school_teachers t
    WHERE lower(t.email) = lower(auth.jwt()->>'email') AND t.is_active = true
  ));

-- Allow teachers to view student profiles
CREATE POLICY "Teachers can view student profiles"
  ON public.profiles FOR SELECT
  USING (id IN (
    SELECT ss.student_id FROM public.section_students ss
    JOIN public.teacher_subject_sections tss ON tss.section_id = ss.section_id
    JOIN public.school_teachers t ON t.id = tss.teacher_id
    WHERE lower(t.email) = lower(auth.jwt()->>'email') AND t.is_active = true
  ));

-- Security definer function to check if user is a teacher
CREATE OR REPLACE FUNCTION public.is_school_teacher(_email text)
RETURNS TABLE(school_id uuid, teacher_id uuid, school_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.school_id, t.id as teacher_id, sa.school_name
  FROM public.school_teachers t
  JOIN public.school_accounts sa ON sa.id = t.school_id
  WHERE lower(t.email) = lower(_email) AND t.is_active = true AND sa.is_active = true;
$$;
