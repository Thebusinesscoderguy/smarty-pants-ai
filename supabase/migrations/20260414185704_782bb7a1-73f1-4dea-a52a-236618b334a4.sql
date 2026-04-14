
-- Feature 6: Teacher Lesson Plans
CREATE TABLE public.teacher_lesson_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL,
  school_id UUID REFERENCES public.school_accounts(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  subject TEXT,
  grade_level TEXT,
  duration_minutes INTEGER DEFAULT 45,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.teacher_lesson_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers manage own plans" ON public.teacher_lesson_plans
  FOR ALL TO authenticated USING (teacher_id = auth.uid());

CREATE POLICY "School admins view school plans" ON public.teacher_lesson_plans
  FOR SELECT TO authenticated USING (
    school_id IN (SELECT id FROM public.school_accounts WHERE admin_user_id = auth.uid())
  );

-- Feature 7: Homework Assignments
CREATE TABLE public.homework_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.school_accounts(id) ON DELETE CASCADE NOT NULL,
  teacher_id UUID NOT NULL,
  subject_id UUID REFERENCES public.school_subjects(id) ON DELETE CASCADE,
  section_id UUID REFERENCES public.school_sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assignment_type TEXT DEFAULT 'practice',
  due_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.homework_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers manage homework" ON public.homework_assignments
  FOR ALL TO authenticated USING (teacher_id = auth.uid());

CREATE POLICY "School admins manage homework" ON public.homework_assignments
  FOR ALL TO authenticated USING (
    school_id IN (SELECT id FROM public.school_accounts WHERE admin_user_id = auth.uid())
  );

CREATE POLICY "Students view homework for their sections" ON public.homework_assignments
  FOR SELECT TO authenticated USING (
    section_id IN (
      SELECT section_id FROM public.section_students WHERE student_id = auth.uid()
    )
  );

-- Feature 7: Homework Submissions
CREATE TABLE public.homework_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES public.homework_assignments(id) ON DELETE CASCADE NOT NULL,
  student_id UUID NOT NULL,
  status TEXT DEFAULT 'pending',
  submitted_at TIMESTAMPTZ,
  score NUMERIC,
  feedback TEXT,
  response_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(assignment_id, student_id)
);

ALTER TABLE public.homework_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students manage own submissions" ON public.homework_submissions
  FOR ALL TO authenticated USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Teachers view submissions for their assignments" ON public.homework_submissions
  FOR SELECT TO authenticated USING (
    assignment_id IN (
      SELECT id FROM public.homework_assignments WHERE teacher_id = auth.uid()
    )
  );

CREATE POLICY "School admins view all submissions" ON public.homework_submissions
  FOR SELECT TO authenticated USING (
    assignment_id IN (
      SELECT ha.id FROM public.homework_assignments ha
      WHERE ha.school_id IN (SELECT id FROM public.school_accounts WHERE admin_user_id = auth.uid())
    )
  );
