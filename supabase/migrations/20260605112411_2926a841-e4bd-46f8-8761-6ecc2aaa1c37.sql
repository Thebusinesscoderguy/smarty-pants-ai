
-- 1) test_attempts: harden student UPDATE to forbid grading-column changes
DROP POLICY IF EXISTS "Students can update their attempts" ON public.test_attempts;
CREATE POLICY "Students can update their attempts"
  ON public.test_attempts
  FOR UPDATE
  USING (auth.uid() = student_id)
  WITH CHECK (
    auth.uid() = student_id
    AND NOT EXISTS (
      SELECT 1 FROM public.tests t
      WHERE t.id = test_attempts.test_id AND t.assessment_mode = 'exam'
    )
  );

-- 2) exam_session_locks: allow heartbeat updates by owner
DROP POLICY IF EXISTS "Students can update own session lock" ON public.exam_session_locks;
CREATE POLICY "Students can update own session lock"
  ON public.exam_session_locks
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 3) content_curriculum_tags: restrict insert to school members
DROP POLICY IF EXISTS cct_insert ON public.content_curriculum_tags;
CREATE POLICY cct_insert
  ON public.content_curriculum_tags
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND public.is_school_member(auth.uid(), school_id)
  );

-- 4) curriculum_unit_usage: restrict insert to own user_id and school membership
DROP POLICY IF EXISTS usage_insert_authenticated ON public.curriculum_unit_usage;
CREATE POLICY usage_insert_authenticated
  ON public.curriculum_unit_usage
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
    AND public.is_school_member(auth.uid(), school_id)
  );

-- 5) question_bank: drop broad read; school admins/teachers/creators still have access via existing * policies
DROP POLICY IF EXISTS "Authenticated users can view question bank" ON public.question_bank;

-- 6) test_questions: hide correct_answer from students
DROP POLICY IF EXISTS "Users can view questions for accessible tests" ON public.test_questions;
-- Test creators retain full access via "Test creators can manage questions" (FOR ALL).
-- Re-add a read policy ONLY for creators (redundant with FOR ALL but explicit).
CREATE POLICY "Test creators can view questions"
  ON public.test_questions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tests t
      WHERE t.id = test_questions.test_id AND t.creator_id = auth.uid()
    )
  );

-- Server-side function returning sanitized exam questions to assigned students
CREATE OR REPLACE FUNCTION public.get_exam_questions_for_student(_test_id uuid)
RETURNS TABLE (
  id uuid,
  test_id uuid,
  question text,
  question_type text,
  options jsonb,
  points integer,
  order_index integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT q.id, q.test_id, q.question, q.question_type, q.options, q.points, q.order_index
  FROM public.test_questions q
  JOIN public.tests t ON t.id = q.test_id
  WHERE q.test_id = _test_id
    AND (
      t.creator_id = auth.uid()
      OR public.is_test_assigned_to_student(t.id, auth.uid())
    )
  ORDER BY q.order_index ASC;
$$;

REVOKE ALL ON FUNCTION public.get_exam_questions_for_student(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_exam_questions_for_student(uuid) TO authenticated;
