-- 1) New table: exam_session_locks (server-side multi-tab guard)
CREATE TABLE IF NOT EXISTS public.exam_session_locks (
  session_id uuid PRIMARY KEY REFERENCES public.exam_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  tab_id text NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exam_session_locks_user ON public.exam_session_locks(user_id);

ALTER TABLE public.exam_session_locks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own session lock" ON public.exam_session_locks;
CREATE POLICY "Students can view own session lock"
  ON public.exam_session_locks FOR SELECT TO authenticated
  USING (user_id = auth.uid());
-- No INSERT/UPDATE/DELETE policies for authenticated => only service_role (edge functions) can write.

-- 2) Lock down exam_sessions UPDATE: students may only edit `answers` on their own in_progress sessions.
DROP POLICY IF EXISTS "Students can update own active exam sessions" ON public.exam_sessions;

CREATE POLICY "Students can save own answer drafts"
  ON public.exam_sessions FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND status = 'in_progress')
  WITH CHECK (user_id = auth.uid() AND status = 'in_progress');

-- Trigger that blocks students from changing anything other than `answers` / `updated_at`.
-- Service role bypasses RLS, but triggers still run — so we explicitly skip the check when the
-- caller is service_role (via auth.role()) so edge functions can finalize sessions.
CREATE OR REPLACE FUNCTION public.enforce_exam_session_student_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow privileged callers (service role used by edge functions, or the postgres owner) to do anything.
  IF current_setting('request.jwt.claim.role', true) = 'service_role'
     OR auth.role() = 'service_role'
     OR session_user IN ('postgres', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  -- For everyone else, only `answers` (and `updated_at`) may change.
  IF NEW.status     IS DISTINCT FROM OLD.status
     OR NEW.score          IS DISTINCT FROM OLD.score
     OR NEW.total_points   IS DISTINCT FROM OLD.total_points
     OR NEW.percentage     IS DISTINCT FROM OLD.percentage
     OR NEW.violation_count IS DISTINCT FROM OLD.violation_count
     OR NEW.flagged        IS DISTINCT FROM OLD.flagged
     OR NEW.end_time       IS DISTINCT FROM OLD.end_time
     OR NEW.submitted_at   IS DISTINCT FROM OLD.submitted_at
     OR NEW.time_taken_seconds IS DISTINCT FROM OLD.time_taken_seconds
     OR NEW.start_time     IS DISTINCT FROM OLD.start_time
     OR NEW.time_limit     IS DISTINCT FROM OLD.time_limit
     OR NEW.user_id        IS DISTINCT FROM OLD.user_id
     OR NEW.quiz_id        IS DISTINCT FROM OLD.quiz_id THEN
    RAISE EXCEPTION 'Only the answers field can be updated from the client. Use the exam-submit edge function to finalize.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS exam_sessions_student_update_guard ON public.exam_sessions;
CREATE TRIGGER exam_sessions_student_update_guard
  BEFORE UPDATE ON public.exam_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_exam_session_student_updates();

-- 3) Lock down exam_violations: revoke client INSERT, edge function only.
DROP POLICY IF EXISTS "Students can create own exam violations" ON public.exam_violations;
-- (No replacement INSERT policy for authenticated => only service_role can write.)

-- 4) Tighten test_attempts INSERT: for exam-mode tests, only edge functions (service_role) may insert.
DROP POLICY IF EXISTS "Students can create attempts" ON public.test_attempts;
CREATE POLICY "Students can create attempts for non-exam tests"
  ON public.test_attempts FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = student_id
    AND NOT EXISTS (
      SELECT 1 FROM public.tests t
      WHERE t.id = test_attempts.test_id AND t.assessment_mode = 'exam'
    )
  );
-- Exam-mode attempts are inserted by the exam-submit edge function under service_role.

-- 5) Add search_path to functions previously flagged as mutable.
ALTER FUNCTION public.update_learning_analytics() SET search_path = public;
ALTER FUNCTION public.mark_expired_daily_quests_as_failed() SET search_path = public;
ALTER FUNCTION public.set_daily_quest_expiration() SET search_path = public;
ALTER FUNCTION public.update_quest_progress_v2() SET search_path = public;
ALTER FUNCTION public.update_student_monitoring_snapshot(uuid) SET search_path = public;