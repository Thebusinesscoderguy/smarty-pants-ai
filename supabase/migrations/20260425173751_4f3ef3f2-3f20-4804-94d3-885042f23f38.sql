ALTER TABLE public.tests
  ADD COLUMN IF NOT EXISTS assessment_mode text NOT NULL DEFAULT 'practice',
  ADD COLUMN IF NOT EXISTS question_randomization boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS question_order_locked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS allow_backtracking boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS violation_threshold integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS violation_action text NOT NULL DEFAULT 'flag',
  ADD COLUMN IF NOT EXISTS exam_instructions text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tests_assessment_mode_check') THEN
    ALTER TABLE public.tests ADD CONSTRAINT tests_assessment_mode_check CHECK (assessment_mode IN ('practice', 'exam'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tests_violation_action_check') THEN
    ALTER TABLE public.tests ADD CONSTRAINT tests_violation_action_check CHECK (violation_action IN ('flag', 'auto_submit'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.exam_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  quiz_id uuid NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL DEFAULT now(),
  end_time timestamptz,
  time_limit integer NOT NULL,
  violation_count integer NOT NULL DEFAULT 0,
  flagged boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'in_progress',
  score integer DEFAULT 0,
  total_points integer DEFAULT 0,
  percentage integer DEFAULT 0,
  answers jsonb DEFAULT '[]'::jsonb,
  time_taken_seconds integer DEFAULT 0,
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'exam_sessions_status_check') THEN
    ALTER TABLE public.exam_sessions ADD CONSTRAINT exam_sessions_status_check CHECK (status IN ('in_progress', 'submitted', 'auto_submitted'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.exam_violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.exam_sessions(id) ON DELETE CASCADE,
  type text NOT NULL,
  timestamp timestamptz NOT NULL DEFAULT now(),
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'exam_violations_type_check') THEN
    ALTER TABLE public.exam_violations ADD CONSTRAINT exam_violations_type_check CHECK (type IN ('tab_switch', 'window_blur', 'exit_fullscreen', 'inactivity', 'copy_paste', 'right_click'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_exam_sessions_user_id ON public.exam_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_quiz_id ON public.exam_sessions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_status ON public.exam_sessions(status);
CREATE INDEX IF NOT EXISTS idx_exam_violations_session_id ON public.exam_violations(session_id);

ALTER TABLE public.exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_violations ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_test_assigned_to_student(_test_id uuid, _student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tests t
    JOIN public.content_assignments ca ON ca.content_id = t.id AND ca.content_type = 'test' AND ca.is_active = true
    LEFT JOIN public.section_students ss ON ca.assignment_type = 'classification' AND ss.student_id = _student_id
    LEFT JOIN public.school_sections sec ON sec.id = ss.section_id
    LEFT JOIN public.student_classifications sc ON sc.student_id = _student_id
    WHERE t.id = _test_id
      AND t.assessment_mode = 'exam'
      AND (
        (ca.assignment_type IN ('student', 'individual') AND ca.target_id = _student_id)
        OR (ca.assignment_type = 'classification' AND ca.classification_tag = sc.classification_tag)
        OR (ca.assignment_type = 'classification' AND ca.classification_tag IN (sec.grade_level, sec.grade_level || ' ' || sec.section_name))
        OR ca.assignment_type = 'all'
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_test(_test_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.tests WHERE id = _test_id AND creator_id = _user_id);
$$;

DROP POLICY IF EXISTS "Students can view own exam sessions" ON public.exam_sessions;
CREATE POLICY "Students can view own exam sessions"
  ON public.exam_sessions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.can_manage_test(quiz_id, auth.uid()));

DROP POLICY IF EXISTS "Assigned students can start exam sessions" ON public.exam_sessions;
CREATE POLICY "Assigned students can start exam sessions"
  ON public.exam_sessions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_test_assigned_to_student(quiz_id, auth.uid()));

DROP POLICY IF EXISTS "Students can update own active exam sessions" ON public.exam_sessions;
CREATE POLICY "Students can update own active exam sessions"
  ON public.exam_sessions FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Students and test managers can view exam violations" ON public.exam_violations;
CREATE POLICY "Students and test managers can view exam violations"
  ON public.exam_violations FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.exam_sessions es
    WHERE es.id = exam_violations.session_id
      AND (es.user_id = auth.uid() OR public.can_manage_test(es.quiz_id, auth.uid()))
  ));

DROP POLICY IF EXISTS "Students can create own exam violations" ON public.exam_violations;
CREATE POLICY "Students can create own exam violations"
  ON public.exam_violations FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.exam_sessions es
    WHERE es.id = exam_violations.session_id AND es.user_id = auth.uid()
  ));

DROP TRIGGER IF EXISTS update_exam_sessions_updated_at ON public.exam_sessions;
CREATE TRIGGER update_exam_sessions_updated_at
  BEFORE UPDATE ON public.exam_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();