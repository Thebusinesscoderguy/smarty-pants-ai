-- RLS INSERT hardening: add missing WITH CHECK constraints
--
-- Several tables have permissive INSERT policies that do not constrain the
-- owner column (e.g. curriculum_unit_usage uses `WITH CHECK (true)`), which
-- lets an authenticated user insert rows attributed to another user.
--
-- Requirement: add the missing constraints WITHOUT touching/altering any
-- existing policy. Because the existing INSERT policies are PERMISSIVE, they
-- are OR-combined — so a new permissive policy could only *widen* access, never
-- narrow it. The correct (and only) way to add an enforced constraint on top of
-- an untouched permissive policy is an AS RESTRICTIVE policy, which is
-- AND-combined with all permissive policies.
--
-- Notes:
--  * Restrictive policies apply to PUBLIC (all roles). The Postgres service_role
--    used by edge functions has BYPASSRLS, so server-side writes are unaffected.
--  * Each statement uses a brand-new, uniquely named policy. The DROP ... IF
--    EXISTS calls only ever target THESE new names (for idempotency / re-runs);
--    no pre-existing policy is dropped or altered.

-- 1) files — owner is user_id
DROP POLICY IF EXISTS "rls_restrict_files_insert_owner" ON public.files;
CREATE POLICY "rls_restrict_files_insert_owner"
  ON public.files AS RESTRICTIVE FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 2) learning_progress_snapshots — owner is student_id
DROP POLICY IF EXISTS "rls_restrict_lps_insert_owner" ON public.learning_progress_snapshots;
CREATE POLICY "rls_restrict_lps_insert_owner"
  ON public.learning_progress_snapshots AS RESTRICTIVE FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- 3) messages — owner is user_id
DROP POLICY IF EXISTS "rls_restrict_messages_insert_owner" ON public.messages;
CREATE POLICY "rls_restrict_messages_insert_owner"
  ON public.messages AS RESTRICTIVE FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 4) parent_child_relationships — owner is parent_id
DROP POLICY IF EXISTS "rls_restrict_pcr_insert_owner" ON public.parent_child_relationships;
CREATE POLICY "rls_restrict_pcr_insert_owner"
  ON public.parent_child_relationships AS RESTRICTIVE FOR INSERT
  WITH CHECK (auth.uid() = parent_id);

-- 5) student_interactions — owner is student_id
DROP POLICY IF EXISTS "rls_restrict_student_interactions_insert_owner" ON public.student_interactions;
CREATE POLICY "rls_restrict_student_interactions_insert_owner"
  ON public.student_interactions AS RESTRICTIVE FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- 6) invoice_payments — payer is paid_by
DROP POLICY IF EXISTS "rls_restrict_invoice_payments_insert_owner" ON public.invoice_payments;
CREATE POLICY "rls_restrict_invoice_payments_insert_owner"
  ON public.invoice_payments AS RESTRICTIVE FOR INSERT
  WITH CHECK (auth.uid() = paid_by);

-- 7) curriculum_unit_usage — the referenced curriculum unit must be global
--    (shared standard curriculum, school_id IS NULL) or belong to a school the
--    user administers. Prevents logging usage against another school's custom
--    curriculum.
DROP POLICY IF EXISTS "rls_restrict_curriculum_unit_usage_insert_school" ON public.curriculum_unit_usage;
CREATE POLICY "rls_restrict_curriculum_unit_usage_insert_school"
  ON public.curriculum_unit_usage AS RESTRICTIVE FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.curriculum_units cu
      WHERE cu.id = curriculum_unit_usage.curriculum_unit_id
        AND (
          cu.school_id IS NULL
          OR cu.school_id IN (
            SELECT id FROM public.school_accounts WHERE admin_user_id = auth.uid()
          )
        )
    )
  );
