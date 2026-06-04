
-- 1. Hide guardian_email from client reads
REVOKE SELECT (guardian_email) ON public.profiles FROM authenticated, anon;

-- 2. Helper: get school_id(s) for a user (admin or teacher)
CREATE OR REPLACE FUNCTION public.get_user_school_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sa.id FROM public.school_accounts sa WHERE sa.admin_user_id = _user_id
  UNION
  SELECT t.school_id FROM public.school_teachers t
    JOIN auth.users u ON lower(u.email) = lower(t.email)
    WHERE u.id = _user_id AND t.is_active = true
  UNION
  SELECT s.school_id FROM public.school_staff s
    WHERE (s.user_id = _user_id) AND s.is_active = true;
$$;
REVOKE EXECUTE ON FUNCTION public.get_user_school_ids(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_school_ids(uuid) TO authenticated, service_role;

-- 3. Tighten content_assignments SELECT policy
DROP POLICY IF EXISTS "Assigned users can view content assignments" ON public.content_assignments;
CREATE POLICY "Assigned users can view content assignments"
ON public.content_assignments
FOR SELECT
TO authenticated
USING (
  ((assignment_type = 'individual') AND (target_id = auth.uid()))
  OR ((assignment_type = 'classification') AND (EXISTS (
        SELECT 1 FROM public.student_classifications sc
        WHERE sc.student_id = auth.uid()
          AND sc.classification_tag = content_assignments.classification_tag
      )))
  OR ((assignment_type = 'all') AND EXISTS (
        SELECT 1 FROM public.get_user_school_ids(content_assignments.assigned_by) sid
        WHERE public.is_school_member(auth.uid(), sid)
      ))
);

-- 4. Exam session locks: allow students to create/release their own
CREATE POLICY "Students can create own session lock"
ON public.exam_session_locks
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Students can release own session lock"
ON public.exam_session_locks
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- 5. Prevent students from self-assigning scores on test_attempts
CREATE OR REPLACE FUNCTION public.enforce_test_attempt_student_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) = 'service_role'
     OR auth.role() = 'service_role'
     OR session_user IN ('postgres', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  IF EXISTS (SELECT 1 FROM public.tests t WHERE t.id = NEW.test_id AND t.creator_id = auth.uid()) THEN
    RETURN NEW;
  END IF;

  IF NEW.score        IS DISTINCT FROM OLD.score
     OR NEW.percentage   IS DISTINCT FROM OLD.percentage
     OR NEW.total_points IS DISTINCT FROM OLD.total_points
     OR NEW.student_id   IS DISTINCT FROM OLD.student_id
     OR NEW.test_id      IS DISTINCT FROM OLD.test_id THEN
    RAISE EXCEPTION 'Students cannot modify scoring fields on test attempts.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_test_attempt_student_updates ON public.test_attempts;
CREATE TRIGGER trg_enforce_test_attempt_student_updates
  BEFORE UPDATE ON public.test_attempts
  FOR EACH ROW EXECUTE FUNCTION public.enforce_test_attempt_student_updates();
